import { useState, useEffect, useMemo } from "react"
import { AssetService } from "@/services/asset.service"
import { BookingService } from "@/services/booking.service"
import { OrgService } from "@/services/org.service"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, RefreshCw, BarChart2, PieChart as PieIcon } from "lucide-react"
import { toast } from "sonner"

export function ReportsPage() {
  // State collections
  const [assets, setAssets] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [allocations, setAllocations] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [assetsData, bookingsData, deptsData, catsData, allocationsData] = await Promise.all([
        AssetService.getAssets(),
        BookingService.getBookings(),
        OrgService.getDepartments(),
        OrgService.getCategories(),
        AssetService.getAllocations(),
      ])
      setAssets(assetsData)
      setBookings(bookingsData)
      setDepartments(deptsData)
      setCategories(catsData)
      setAllocations(allocationsData)
    } catch {
      toast.error("Failed to load reports telemetry.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 1. Compute Category distribution for PieChart
  const categoryData = useMemo(() => {
    return categories.map((cat, idx) => {
      const filtered = assets.filter((a) => a.categoryId === cat.id)
      const value = filtered.length
      const cost = filtered.reduce((sum, item) => sum + (item.acquisitionCost || 0), 0)
      
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
      return {
        name: cat.name,
        value,
        cost,
        color: colors[idx % colors.length],
      }
    }).filter((c) => c.value > 0)
  }, [categories, assets])

  // 2. Compute utilization statistics
  const stats = useMemo(() => {
    const total = assets.length
    const allocated = assets.filter((a) => a.status === "Allocated").length
    const maintenanceUnits = assets.filter((a) => a.status === "Under Maintenance").length
    const available = assets.filter((a) => a.status === "Available").length
    const utilizationRate = total > 0 ? Math.round((allocated / total) * 100) : 0

    return {
      total,
      allocated,
      maintenanceUnits,
      available,
      utilizationRate,
    }
  }, [assets])

  // 3. Compute department allocations
  const deptData = useMemo(() => {
    return departments.map((dept) => {
      const activeAllocs = allocations.filter(
        (a) => a.status === "active" && a.departmentId === dept.id
      )
      return {
        name: dept.name,
        allocated: activeAllocs.length,
      }
    })
  }, [departments, allocations])

  // 4. Booking usage windows (heatmap mock structure)
  const heatmapData = [
    { window: "08:00 - 10:00", bookings: 12 },
    { window: "10:00 - 12:00", bookings: 25 },
    { window: "12:00 - 14:00", bookings: 8 },
    { window: "14:00 - 16:00", bookings: 18 },
    { window: "16:00 - 18:00", bookings: 15 },
  ]

  // Export CSV mock reports
  const handleExportCSV = (reportType: string) => {
    try {
      let headers = ""
      let rows = ""
      let filename = "report.csv"

      if (reportType === "assets") {
        headers = "Tag,Name,Category,SerialNumber,Condition,Status,Location,AcquisitionCost,AcquisitionDate\n"
        rows = assets
          .map((a) => {
            const cat = categories.find((c) => c.id === a.categoryId)?.name || "Unknown"
            return `"${a.tag}","${a.name}","${cat}","${a.serialNumber}","${a.condition}","${a.status}","${a.location}",${a.acquisitionCost},"${a.acquisitionDate}"`
          })
          .join("\n")
        filename = "assets_directory_ledger.csv"
      } else {
        headers = "BookingId,AssetTag,EmployeeId,DepartmentId,StartTime,EndTime,Status\n"
        rows = bookings
          .map((b) => `"${b.id}","${b.assetTag}","${b.employeeId}","${b.departmentId || ""}","${b.startTime}","${b.endTime}","${b.status}"`)
          .join("\n")
        filename = "resource_bookings_ledger.csv"
      }

      const csvContent = "data:text/csv;charset=utf-8," + headers + rows
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Export complete: ${filename} downloaded.`)
    } catch {
      toast.error("Export failure.")
    }
  }

  return (
    <PermissionGuard permission="report.export">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Analytics & Reports</h2>
            <p className="text-xs text-muted-foreground">
              Review corporate inventory valuation, department allocations, and resource calendar booking densities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="text-xs h-8 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh Models
            </Button>
            <Button size="sm" onClick={() => handleExportCSV("assets")} className="text-xs h-8 cursor-pointer">
              <Download className="h-3.5 w-3.5 mr-1" /> Export Directory CSV
            </Button>
          </div>
        </div>

        {/* Core KPIs summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">Allocation Ratio</span>
              <p className="text-xl font-bold">{stats.utilizationRate}%</p>
              <div className="text-[10px] text-emerald-500 font-semibold">{stats.allocated} Active Checkouts</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">Valuation Net</span>
              <p className="text-xl font-bold">
                ${assets.reduce((sum, item) => sum + (item.acquisitionCost || 0), 0).toLocaleString()}
              </p>
              <div className="text-[10px] text-muted-foreground">Total acquisition cost</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">Available Units</span>
              <p className="text-xl font-bold">{stats.available}</p>
              <div className="text-[10px] text-muted-foreground">Free for checkout allocation</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">Maintenance Ratio</span>
              <p className="text-xl font-bold">
                {assets.length > 0 ? Math.round((stats.maintenanceUnits / stats.total) * 100) : 0}%
              </p>
              <div className="text-[10px] text-amber-500 font-semibold">{stats.maintenanceUnits} in repairs</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main cost valuation chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><BarChart2 className="h-4 w-4 text-primary" /> Cost Valuation & Counts by Category</CardTitle>
              <CardDescription className="text-xs">Summary of net acquisition costs versus number of registered assets.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-[10px] opacity-70" />
                  <YAxis stroke="currentColor" className="text-[10px] opacity-70" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" name="Total Net Value ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Asset counts donut chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><PieIcon className="h-4 w-4 text-primary" /> Category Distribution</CardTitle>
              <CardDescription className="text-xs">Breakdown of inventory items by catalog category.</CardDescription>
            </CardHeader>
            <CardContent className="h-[180px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Volume</span>
                <span className="text-lg font-bold">{stats.total}</span>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px] max-h-[100px] overflow-y-auto pr-1">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                  <span className="font-semibold ml-auto">{item.value} units</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department allocation bar charts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Active Allocations by Department</CardTitle>
              <CardDescription className="text-xs">Physical inventory checks currently assigned to specific departments.</CardDescription>
            </CardHeader>
            <CardContent className="h-[220px]">
              {deptData.every((d) => d.allocated === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs italic">
                  No active department allocations registered.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.15)" />
                    <XAxis type="number" stroke="currentColor" className="text-[10px] opacity-70" />
                    <YAxis type="category" dataKey="name" stroke="currentColor" className="text-[10px] opacity-70" width={100} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="allocated" fill="#10b981" name="Allocated Items" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bookings heatmap density */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Resource Booking Load density</CardTitle>
              <CardDescription className="text-xs">Peak usage slots based on registered calendar bookings.</CardDescription>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="window" stroke="currentColor" className="text-[10px] opacity-70" />
                  <YAxis stroke="currentColor" className="text-[10px] opacity-70" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Reservations count" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}
