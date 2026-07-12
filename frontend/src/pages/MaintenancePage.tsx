import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { MaintenanceService } from "@/services/maintenance.service"
import { AssetService } from "@/services/asset.service"
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from "@/types/maintenance"
import type { Asset, AssetCondition } from "@/types/asset"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { Wrench, Clock, Check, X, Plus, Play, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function MaintenancePage() {
  const { user } = useAuth()

  // State collections
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [allocations, setAllocations] = useState<any[]>([])

  // Drawer states
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)

  // Form Fields - Raise Request
  const [maintAssetTag, setMaintAssetTag] = useState("")
  const [maintDescription, setMaintDescription] = useState("")
  const [maintPriority, setMaintPriority] = useState<MaintenancePriority>("medium")

  // Form Fields - Manager Actions
  const [technicianName, setTechnicianName] = useState("")
  const [maintNotes, setMaintNotes] = useState("")
  const [actionType, setActionType] = useState<"approve" | "resolve">("approve")
  const [newAssetCondition, setNewAssetCondition] = useState<AssetCondition>("good")

  const loadData = async () => {
    try {
      const [requestsData, assetsData, allocationsData] = await Promise.all([
        MaintenanceService.getRequests(),
        AssetService.getAssets(),
        AssetService.getAllocations(),
      ])
      setRequests(requestsData)
      setAssets(assetsData)
      setAllocations(allocationsData)
    } catch {
      toast.error("Failed to load maintenance data.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // KPI summaries
  const kpis = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "Pending").length,
      inProgress: requests.filter((r) => r.status === "In Progress").length,
      active: requests.filter((r) => r.status === "Approved" || r.status === "In Progress").length,
    }
  }, [requests])

  const handleOpenRaise = () => {
    // prefill asset tag if employee owns an allocated asset
    const myAlloc = allocations.find((a) => a.userId === user?.id && a.status === "active")
    setMaintAssetTag(myAlloc ? myAlloc.assetTag : "")
    setMaintDescription("")
    setMaintPriority("medium")
    setRequestDrawerOpen(true)
  }

  const handleOpenAction = (req: MaintenanceRequest, type: "approve" | "resolve") => {
    setSelectedRequest(req)
    setActionType(type)
    if (type === "approve") {
      setTechnicianName("")
      setMaintNotes("")
    } else {
      setMaintNotes("")
      const asset = assets.find((a) => a.tag === req.assetTag)
      setNewAssetCondition(asset ? asset.condition : "good")
    }
    setActionDrawerOpen(true)
  }

  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!maintAssetTag) throw new Error("Please select an asset.")
      if (!maintDescription.trim()) throw new Error("Please describe the issue details.")

      await MaintenanceService.raiseRequest(
        maintAssetTag,
        user.id,
        maintDescription.trim(),
        maintPriority,
        user.id,
        user.fullName
      )

      toast.success("Maintenance request raised successfully.")
      setRequestDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request.")
    }
  }

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedRequest) return

    try {
      if (actionType === "approve") {
        if (!technicianName.trim()) throw new Error("Technician assignment is required.")
        
        await MaintenanceService.updateRequestStatus(
          selectedRequest.id,
          "Approved",
          { technicianName: technicianName.trim(), notes: maintNotes.trim() || "Approved repair schedule." },
          user.id,
          user.fullName
        )
        toast.success("Maintenance ticket approved. Asset status set to Under Maintenance.")
      } else {
        // Resolve ticket
        await MaintenanceService.updateRequestStatus(
          selectedRequest.id,
          "Resolved",
          { notes: maintNotes.trim() || "Repair work concluded successfully.", newCondition: newAssetCondition },
          user.id,
          user.fullName
        )
        toast.success("Maintenance ticket resolved. Asset returned to inventory.")
      }

      setActionDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to process ticket action.")
    }
  }

  const handleStartWork = async (id: string) => {
    if (!user) return
    try {
      await MaintenanceService.updateRequestStatus(
        id,
        "In Progress",
        { notes: "Technician began disassembly and diagnostics." },
        user.id,
        user.fullName
      )
      toast.info("Repair work status updated to In Progress.")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.")
    }
  }

  const handleRejectRequest = async (id: string) => {
    if (!user) return
    try {
      await MaintenanceService.updateRequestStatus(
        id,
        "Rejected",
        { notes: "Ticket rejected by manager." },
        user.id,
        user.fullName
      )
      toast.error("Maintenance ticket rejected.")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject ticket.")
    }
  }

  const getPriorityBadge = (priority: MaintenancePriority) => {
    let variant: "default" | "warning" | "destructive" = "default"
    if (priority === "high") variant = "destructive"
    else if (priority === "medium") variant = "warning"
    return <Badge variant={variant} className="uppercase text-[9px]">{priority}</Badge>
  }

  const getStatusBadge = (status: MaintenanceStatus) => {
    let variant: "default" | "success" | "warning" | "destructive" | "info" = "default"
    switch (status) {
      case "Pending":
        variant = "warning"
        break
      case "Approved":
        variant = "default"
        break
      case "In Progress":
        variant = "info"
        break
      case "Resolved":
        variant = "success"
        break
      case "Rejected":
        variant = "destructive"
        break
    }
    return <Badge variant={variant}>{status}</Badge>
  }

  // Columns for work orders table
  const columns: Column<MaintenanceRequest>[] = [
    { header: "Asset Tag", accessor: "assetTag", sortable: true },
    {
      header: "Asset Name",
      accessor: (r) => assets.find((a) => a.tag === r.assetTag)?.name || "Unknown",
    },
    {
      header: "Log Description",
      accessor: (r) => <p className="max-w-[200px] truncate" title={r.description}>{r.description}</p>,
    },
    {
      header: "Priority",
      accessor: (r) => getPriorityBadge(r.priority),
    },
    {
      header: "Technician Assigned",
      accessor: (r) => r.technicianName || <span className="text-muted-foreground italic">Unassigned</span>,
    },
    {
      header: "Status",
      accessor: (r) => getStatusBadge(r.status),
    },
    {
      header: "Actions",
      accessor: (r) => {
        if (r.status === "Pending") {
          return (
            <PermissionGuard permission="maintenance.approve" fallback={null}>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => handleOpenAction(r, "approve")} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-2">
                  <Check className="h-3 w-3 mr-0.5" /> Approve
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRejectRequest(r.id)} className="h-7 text-[10px] text-destructive hover:bg-destructive/10 cursor-pointer px-2">
                  <X className="h-3 w-3 mr-0.5" /> Deny
                </Button>
              </div>
            </PermissionGuard>
          )
        }
        if (r.status === "Approved") {
          return (
            <PermissionGuard permission="maintenance.approve" fallback={null}>
              <Button size="sm" onClick={() => handleStartWork(r.id)} className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white cursor-pointer px-2">
                <Play className="h-3 w-3 mr-0.5" /> Start Work
              </Button>
            </PermissionGuard>
          )
        }
        if (r.status === "In Progress") {
          return (
            <PermissionGuard permission="maintenance.approve" fallback={null}>
              <Button size="sm" onClick={() => handleOpenAction(r, "resolve")} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-2">
                <CheckCircle className="h-3 w-3 mr-0.5" /> Resolve Ticket
              </Button>
            </PermissionGuard>
          )
        }
        return <span className="text-[10px] text-muted-foreground italic">Concluded</span>
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Maintenance & Repairs</h2>
          <p className="text-xs text-muted-foreground">
            Manage equipment failures and hardware repair workflows. Assign tasks to technicians, resolve issues, and log condition results.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenRaise} className="text-xs h-8 cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Raise Maint Request
        </Button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-warning/10 text-warning rounded-lg">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">Pending Review</span>
              <p className="text-lg font-bold">{kpis.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-info/10 text-info rounded-lg">
              <Play className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">In Progress</span>
              <p className="text-lg font-bold">{kpis.inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Wrench className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">Total Active Work</span>
              <p className="text-lg font-bold">{kpis.active}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Repairs & Maintenance Ledger</CardTitle>
          <CardDescription className="text-xs">
            Review logged equipment failures and operations schedules.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={requests}
            columns={columns}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Drawer 1: Raise Request */}
      <Drawer
        open={requestDrawerOpen}
        onClose={() => setRequestDrawerOpen(false)}
        title="File Failure Ticket"
        description="Raise a ticket for equipment failure. The asset will flag Under Maintenance."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRequestDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleRaiseSubmit} className="text-xs h-8 cursor-pointer">
              File Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleRaiseSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Select Asset Tag</label>
            <Select value={maintAssetTag} onChange={(e) => setMaintAssetTag(e.target.value)}>
              <option value="">Select Asset...</option>
              {assets.map((asset) => (
                <option key={asset.tag} value={asset.tag}>
                  {asset.tag} - {asset.name} ({asset.status})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Issue Priority</label>
            <Select value={maintPriority} onChange={(e) => setMaintPriority(e.target.value as any)}>
              <option value="low">Low - Standard diagnostics</option>
              <option value="medium">Medium - Normal queue</option>
              <option value="high">High - Immediate attention</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Description of Failure</label>
            <Input
              value={maintDescription}
              onChange={(e) => setMaintDescription(e.target.value)}
              placeholder="e.g. Screen flickering when system gets warm."
              className="text-xs text-foreground"
            />
          </div>
        </form>
      </Drawer>

      {/* Drawer 2: Approve / Resolve Action */}
      <Drawer
        open={actionDrawerOpen}
        onClose={() => setActionDrawerOpen(false)}
        title={actionType === "approve" ? "Schedule Diagnostic & Assignment" : "Conclude Repair Ticket"}
        description={selectedRequest ? `Ticket ID: ${selectedRequest.id} | Asset: ${selectedRequest.assetTag}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setActionDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleActionSubmit} className="text-xs h-8 cursor-pointer">
              {actionType === "approve" ? "Assign Work" : "Resolve & Close"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
          {actionType === "approve" ? (
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Assign Technician / Vendor</label>
              <Input
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="e.g. Acme Diagnostics Hub"
                className="text-xs"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Update Asset Condition Rating</label>
              <Select value={newAssetCondition} onChange={(e) => setNewAssetCondition(e.target.value as any)}>
                <option value="new">New / Restored</option>
                <option value="good">Good / Functional</option>
                <option value="fair">Fair / Functional with defects</option>
                <option value="poor">Poor / Needs replacement</option>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Resolution Notes / Comments</label>
            <Input
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              placeholder={actionType === "approve" ? "Provide schedule comments" : "Confirm repaired parts details..."}
              className="text-xs"
            />
          </div>
        </form>
      </Drawer>
    </div>
  )
}
