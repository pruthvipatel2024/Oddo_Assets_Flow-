import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AssetService } from "@/services/asset.service"
import { BookingService } from "@/services/booking.service"
import { MaintenanceService } from "@/services/maintenance.service"
import { ActivityLogger } from "@/services/activity.service"
import { OrgService } from "@/services/org.service"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import {
  Laptop,
  Users,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Plus,
  RefreshCw,
  CalendarRange,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Live state bindings
  const [assets, setAssets] = useState<any[]>([])
  const [allocations, setAllocations] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [
        assetsData,
        allocsData,
        bookingsData,
        maintData,
        transfersData,
        catsData,
        usersData,
        logsData,
      ] = await Promise.all([
        AssetService.getAssets(),
        AssetService.getAllocations(),
        BookingService.getBookings(),
        MaintenanceService.getRequests(),
        AssetService.getTransferRequests(),
        OrgService.getCategories(),
        OrgService.getUsers(),
        ActivityLogger.getLogs(),
      ])
      setAssets(assetsData)
      setAllocations(allocsData)
      setBookings(bookingsData)
      setMaintenance(maintData)
      setTransfers(transfersData)
      setCategories(catsData)
      setUsersList(usersData)
      setLogs(logsData)
    } catch {
      toast.error("Failed to load dashboard data.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // KPI Calculations
  const kpiData = useMemo(() => {
    const total = assets.length
    const available = assets.filter((a) => a.status === "Available").length
    const allocated = assets.filter((a) => a.status === "Allocated").length
    const maintCount = maintenance.filter((r) => r.status === "Pending" || r.status === "In Progress" || r.status === "Approved").length
    const activeBookings = bookings.filter((b) => b.status === "Upcoming" || b.status === "Ongoing").length
    const pendingTrans = transfers.filter((t) => t.status === "Pending").length

    const todayStr = new Date().toISOString().split("T")[0]
    const overdue = allocations.filter(
      (a) => a.status === "active" && a.expectedReturnDate && a.expectedReturnDate < todayStr
    ).length

    // User management KPI
    const totalUsers = usersList.length
    const activeUsers = usersList.filter((u) => u.status === "active").length
    const deptHeads = usersList.filter((u) => u.roleId === "dept_head").length
    const assetManagers = usersList.filter((u) => u.roleId === "asset_manager").length

    return {
      total,
      available,
      allocated,
      maintCount,
      activeBookings,
      pendingTrans,
      overdue,
      totalUsers,
      activeUsers,
      deptHeads,
      assetManagers,
    }
  }, [assets, allocations, bookings, maintenance, transfers, usersList])

  // PieChart Category cost data
  const categoryChartData = useMemo(() => {
    return categories
      .map((cat, idx) => {
        const filtered = assets.filter((a) => a.categoryId === cat.id)
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
        return {
          name: cat.name,
          value: filtered.length,
          color: colors[idx % colors.length],
        }
      })
      .filter((c) => c.value > 0)
  }, [categories, assets])

  // AreaChart trends mock structure combined with actual items counts
  const utilizationTrendData = [
    { name: "Mon", allocated: Math.max(kpiData.allocated - 3, 0), maintenance: kpiData.maintCount },
    { name: "Tue", allocated: Math.max(kpiData.allocated - 1, 0), maintenance: Math.max(kpiData.maintCount - 1, 0) },
    { name: "Wed", allocated: kpiData.allocated, maintenance: kpiData.maintCount },
    { name: "Thu", allocated: Math.max(kpiData.allocated + 1, 0), maintenance: kpiData.maintCount },
    { name: "Fri", allocated: kpiData.allocated, maintenance: kpiData.maintCount },
  ]

  // Filter pending transfers for dashboard actions (admin/manager review)
  const pendingTransfers = useMemo(() => {
    return transfers.filter((t) => t.status === "Pending").slice(0, 3)
  }, [transfers])

  // Recent timeline actions (last 4 audit logs)
  const recentTimeline = useMemo(() => {
    return logs.slice(0, 4)
  }, [logs])

  const handleApproveTransfer = async (id: string, tag: string) => {
    if (!user) return
    try {
      await AssetService.approveTransferRequest(id, user.id, user.fullName)
      toast.success(`Transfer for ${tag} approved.`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer.")
    }
  }

  const handleRejectTransfer = async (id: string, tag: string) => {
    if (!user) return
    try {
      await AssetService.rejectTransferRequest(id, user.id, user.fullName)
      toast.error(`Transfer for ${tag} rejected.`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject transfer.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Welcome back, <strong className="text-foreground">{user?.fullName}</strong>. Real-time operation snapshot of AssetFlow ERP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadData()
              toast.success("Synchronized data structures.")
            }}
            className="text-xs h-8 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh Sync
          </Button>

          <PermissionGuard permissions={["asset.create"]}>
            <Button
              size="sm"
              onClick={() => navigate("/assets")}
              className="text-xs h-8 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Register Asset
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Unified User Management Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-secondary/35 border border-border/60 rounded-xl p-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            U
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total ERP Users</span>
            <span className="text-sm font-bold text-foreground">{kpiData.totalUsers} Profiles</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active Users</span>
            <span className="text-sm font-bold text-foreground">{kpiData.activeUsers} Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            M
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Asset Managers</span>
            <span className="text-sm font-bold text-foreground">{kpiData.assetManagers} Leads</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            H
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Department Heads</span>
            <span className="text-sm font-bold text-foreground">{kpiData.deptHeads} Directors</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Available Assets</span>
              <p className="text-xl font-bold">{kpiData.available}</p>
              <div className="text-[10px] text-muted-foreground font-medium">
                Out of {kpiData.total} total items
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <Laptop className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Active Custodies</span>
              <p className="text-xl font-bold">{kpiData.allocated}</p>
              <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {kpiData.total > 0 ? Math.round((kpiData.allocated / kpiData.total) * 100) : 0}% Utilized
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Ongoing Repairs</span>
              <p className="text-xl font-bold">{kpiData.maintCount}</p>
              <div className="text-[10px] text-amber-500 font-semibold">
                IT & facilities queue
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-destructive/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Overdue returns</span>
              <p className="text-xl font-bold text-destructive">{kpiData.overdue}</p>
              <div className="text-[10px] text-muted-foreground">
                Action required immediately
              </div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/bookings")}
          className="h-14 flex items-center justify-between border-dashed hover:border-primary/50 text-xs text-foreground cursor-pointer px-4"
        >
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-primary" />
            <div className="text-left">
              <span className="font-bold block">Reserve Facility/ pooled item</span>
              <span className="text-[10px] text-muted-foreground">Book space, car, or devices.</span>
            </div>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/maintenance")}
          className="h-14 flex items-center justify-between border-dashed hover:border-amber-500/50 text-xs text-foreground cursor-pointer px-4"
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-amber-500" />
            <div className="text-left">
              <span className="font-bold block">Raise Repair Ticket</span>
              <span className="text-[10px] text-muted-foreground">Flag equipment faults instantly.</span>
            </div>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/assets")}
          className="h-14 flex items-center justify-between border-dashed hover:border-emerald-500/50 text-xs text-foreground cursor-pointer px-4"
        >
          <div className="flex items-center gap-3">
            <Laptop className="h-5 w-5 text-emerald-500" />
            <div className="text-left">
              <span className="font-bold block">Search Inventory Tag</span>
              <span className="text-[10px] text-muted-foreground">Trace details, serial, or history.</span>
            </div>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Utilization Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Asset Allocation & Maintenance Trends</CardTitle>
            <CardDescription className="text-xs">
              Overview of active devices checked-out vs units in repair shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="name" stroke="currentColor" className="text-[10px] opacity-60" />
                <YAxis stroke="currentColor" className="text-[10px] opacity-60" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                />
                <Area type="monotone" dataKey="allocated" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAllocated)" name="Allocated Units" />
                <Area type="monotone" dataKey="maintenance" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="In Repair" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Assets volume by Category</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of total inventory item counts.
            </CardDescription>
          </CardHeader>
          {categoryChartData.length === 0 ? (
            <CardContent className="h-[180px] flex items-center justify-center italic text-muted-foreground text-xs">
              No assets in directory.
            </CardContent>
          ) : (
            <>
              <CardContent className="h-[180px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
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
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total</span>
                  <span className="text-lg font-bold">{kpiData.total}</span>
                </div>
              </CardContent>
              <div className="p-4 border-t border-border/40 grid grid-cols-2 gap-2 text-[10px] max-h-[85px] overflow-y-auto pr-1">
                {categoryChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                    <span className="font-semibold ml-auto">{item.value} units</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Approvals & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Bypass Custody Transfer Approvals</CardTitle>
              <CardDescription className="text-xs">
                Asset transfer requests awaiting administrator/manager approval.
              </CardDescription>
            </div>
            <Badge variant="warning" className="text-[10px]">
              {pendingTransfers.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Asset Tag</TableHead>
                  <TableHead className="text-xs">From Holder</TableHead>
                  <TableHead className="text-xs">Transfer Target</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs py-6 text-muted-foreground italic">
                      No pending custody transfer requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTransfers.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-xs font-semibold py-3">{req.assetTag}</TableCell>
                      <TableCell className="text-xs py-3 text-muted-foreground">
                        {usersList.find((u) => u.id === req.fromUserId)?.fullName || req.fromUserId}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <span className="font-medium text-foreground/80">
                          {usersList.find((u) => u.id === req.toUserId)?.fullName || req.toUserId}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right py-3">
                        <PermissionGuard permission="transfer.approve">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectTransfer(req.id, req.assetTag)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              Deny
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTransfer(req.id, req.assetTag)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            >
                              Approve
                            </Button>
                          </div>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">System Audit Trail</CardTitle>
            <CardDescription className="text-xs">
              Recent resource events and status updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recentTimeline.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No activity logs recorded.</p>
            ) : (
              <div className="relative border-l border-border/80 pl-4 space-y-5 ml-1 text-xs">
                {recentTimeline.map((activity) => (
                  <div key={activity.id} className="relative group select-text">
                    <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-foreground/90 truncate">{activity.action}</span>
                        <span className="text-[8px] text-muted-foreground shrink-0">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
