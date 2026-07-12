import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { BookingService } from "@/services/booking.service"
import { AssetService } from "@/services/asset.service"
import { OrgService } from "@/services/org.service"
import type { ResourceBooking, BookingStatus } from "@/types/booking"
import type { Asset } from "@/types/asset"
import type { User } from "@/types/organization"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { Clock, Plus, Trash } from "lucide-react"
import { toast } from "sonner"

export function ResourceBookingPage() {
  const { user } = useAuth()

  // State collections
  const [bookings, setBookings] = useState<ResourceBooking[]>([])
  const [sharedAssets, setSharedAssets] = useState<Asset[]>([])
  const [usersList, setUsersList] = useState<User[]>([])

  // Drawer & Form states
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false)
  
  const [bookingAssetTag, setBookingAssetTag] = useState("")
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0])
  const [bookingStartTime, setBookingStartTime] = useState("09:00")
  const [bookingEndTime, setBookingEndTime] = useState("10:00")
  const [bookingNotes, setBookingNotes] = useState("")

  const loadData = async () => {
    try {
      const [bookingsData, assetsData, usersData] = await Promise.all([
        BookingService.getBookings(),
        AssetService.getAssets(),
        OrgService.getUsers(),
      ])
      setBookings(bookingsData)
      setSharedAssets(assetsData.filter((a) => a.sharedFlag))
      setUsersList(usersData)
    } catch {
      toast.error("Failed to load reservations.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenBooking = () => {
    setBookingAssetTag(sharedAssets[0]?.tag || "")
    setBookingDate(new Date().toISOString().split("T")[0])
    setBookingStartTime("09:00")
    setBookingEndTime("10:00")
    setBookingNotes("")
    setBookingDrawerOpen(true)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!bookingAssetTag) throw new Error("Please select a resource.")

      const fullStart = `${bookingDate}T${bookingStartTime}`
      const fullEnd = `${bookingDate}T${bookingEndTime}`

      if (new Date(fullStart).getTime() >= new Date(fullEnd).getTime()) {
        throw new Error("End time must be after start time.")
      }

      await BookingService.createBooking(
        bookingAssetTag,
        user.id,
        user.departmentId,
        fullStart,
        fullEnd,
        bookingNotes.trim(),
        user.id,
        user.fullName
      )

      toast.success("Resource booked successfully!")
      setBookingDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to book resource.")
    }
  }

  const handleCancelBooking = async (id: string) => {
    if (!user) return
    try {
      await BookingService.cancelBooking(id, user.id, user.fullName)
      toast.success("Reservation cancelled.")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel reservation.")
    }
  }

  const getStatusBadge = (status: BookingStatus) => {
    let variant: "default" | "success" | "warning" | "destructive" | "info" = "default"
    switch (status) {
      case "Upcoming":
        variant = "default"
        break
      case "Ongoing":
        variant = "success"
        break
      case "Completed":
        variant = "info"
        break
      case "Cancelled":
        variant = "destructive"
        break
    }
    return <Badge variant={variant}>{status}</Badge>
  }

  // Column definitions for bookings table
  const columns: Column<ResourceBooking>[] = [
    {
      header: "Resource Item",
      accessor: (b) => {
        const asset = sharedAssets.find((a) => a.tag === b.assetTag)
        return asset ? `${asset.name} (${b.assetTag})` : b.assetTag
      },
    },
    {
      header: "Reserved By",
      accessor: (b) => usersList.find((u) => u.id === b.bookedByUserId)?.fullName || b.bookedByUserId,
    },
    {
      header: "Usage Windows",
      accessor: (b) => (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
      sortable: true,
      sortKey: "startTime",
    },
    {
      header: "Status",
      accessor: (b) => getStatusBadge(b.status),
    },
    {
      header: "Reservation Notes",
      accessor: (b) => b.notes || <span className="text-muted-foreground italic">None</span>,
    },
    {
      header: "Actions",
      accessor: (b) =>
        (b.status === "Upcoming" || b.status === "Ongoing") && (b.bookedByUserId === user?.id || user?.roleId === "sys_admin" || user?.roleId === "org_admin") ? (
          <Button variant="ghost" size="sm" onClick={() => handleCancelBooking(b.id)} className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer">
            <Trash className="h-3.5 w-3.5 mr-1" /> Cancel Slot
          </Button>
        ) : (
          <span className="text-muted-foreground italic text-[10px]">Unmodifiable</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Resource Bookings</h2>
          <p className="text-xs text-muted-foreground">
            Schedule shared/bookable spaces, pooled gadgets, and transport vehicles. Overlap validation policies are strictly enforced.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenBooking} className="text-xs h-8 cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Book Shared Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Bookings Calendar Ledger</CardTitle>
            <CardDescription className="text-xs">
              Review upcoming and ongoing shared resource schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={bookings}
              columns={columns}
              pageSize={5}
            />
          </CardContent>
        </Card>

        {/* Calendar View Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Shared Resources Inventory</CardTitle>
            <CardDescription className="text-xs">
              List of pooled/shared items bookable by department employees.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {sharedAssets.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No bookable resources registered in directory.</p>
            ) : (
              sharedAssets.map((asset) => (
                <div key={asset.tag} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0 border-border/40">
                  <div>
                    <span className="font-semibold block">{asset.name}</span>
                    <span className="text-[10px] text-muted-foreground">Tag: {asset.tag} | Location: {asset.location}</span>
                  </div>
                  <Badge variant={asset.status === "Available" ? "success" : "warning"}>{asset.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer: Add Booking Form */}
      <Drawer
        open={bookingDrawerOpen}
        onClose={() => setBookingDrawerOpen(false)}
        title="Schedule Resource Slot"
        description="Book a dedicated window on pooled corporate resources."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setBookingDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleBookingSubmit} className="text-xs h-8 cursor-pointer">
              Schedule Reservation
            </Button>
          </>
        }
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Select Resource</label>
            <Select value={bookingAssetTag} onChange={(e) => setBookingAssetTag(e.target.value)}>
              {sharedAssets.map((asset) => (
                <option key={asset.tag} value={asset.tag}>
                  {asset.name} ({asset.tag}) - {asset.status}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Reservation Date</label>
            <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Start Time</label>
              <Input type="time" value={bookingStartTime} onChange={(e) => setBookingStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">End Time</label>
              <Input type="time" value={bookingEndTime} onChange={(e) => setBookingEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Usage description / Notes</label>
            <Input
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="e.g. Design Studio client meeting"
            />
          </div>
        </form>
      </Drawer>
    </div>
  )
}
