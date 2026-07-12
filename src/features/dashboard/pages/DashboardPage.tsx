import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table"
import {
  Laptop,
  Users,
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
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
import { toast } from "sonner"

export function DashboardPage() {


  // Mock data for analytics
  const utilizationData = [
    { name: "Jan", allocated: 65, maintenance: 5 },
    { name: "Feb", allocated: 72, maintenance: 8 },
    { name: "Mar", allocated: 80, maintenance: 6 },
    { name: "Apr", allocated: 78, maintenance: 10 },
    { name: "May", allocated: 85, maintenance: 12 },
    { name: "Jun", allocated: 90, maintenance: 7 },
  ]

  const categoryData = [
    { name: "Computing", value: 45, color: "#3b82f6" },
    { name: "Infrastructure", value: 20, color: "#10b981" },
    { name: "Office/Furniture", value: 15, color: "#f59e0b" },
    { name: "Logistics Devices", value: 20, color: "#8b5cf6" },
  ]

  const pendingApprovals = [
    {
      id: "req_1",
      employee: "Bruce Wayne",
      asset: "Dell XPS 15 Laptop",
      category: "Computing",
      requestedAt: "2 hours ago",
      status: "pending",
    },
    {
      id: "req_2",
      employee: "John Doe",
      asset: "Bar Code Scanner Zebra",
      category: "Logistics Devices",
      requestedAt: "Yesterday",
      status: "pending",
    },
    {
      id: "req_3",
      employee: "Harley Quinn",
      asset: "Ergonomic Office Chair",
      category: "Furniture",
      requestedAt: "2 days ago",
      status: "pending",
    },
  ]

  const recentActivity = [
    { id: 1, action: "Asset Assigned", desc: "AF-109 (MacBook Pro) allocated to Alex Mercer", time: "10 mins ago" },
    { id: 2, action: "Maintenance Closed", desc: "AF-902 (UPS Power Supply) maintenance completed", time: "1 hour ago" },
    { id: 3, action: "Category Created", desc: "Added new asset sub-category 'IoT Gateways'", time: "4 hours ago" },
    { id: 4, action: "Audit Registered", desc: "IT Audit Cycle Q2 verified by Administrator", time: "1 day ago" },
  ]

  const handleApprove = (id: string, name: string) => {
    toast.success(`Request ${id} approved for ${name}`)
  }

  const handleReject = (id: string, name: string) => {
    toast.error(`Request ${id} rejected for ${name}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Real-time status of corporate assets, allocations, and ongoing maintenance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Refreshing data models...")}
            className="text-xs h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => toast.success("Asset registration wizard opened.")}
            className="text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Register Asset
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Assets</span>
              <p className="text-xl font-bold">1,248</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                <TrendingUp className="h-3 w-3" /> +12% vs last month
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
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active Allocations</span>
              <p className="text-xl font-bold">894</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                <TrendingUp className="h-3 w-3" /> 92.4% Utilization
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
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active Maintenance</span>
              <p className="text-xl font-bold">18</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                <Clock className="h-3 w-3" /> Avg. resolution 1.2d
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
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Audit compliance</span>
              <p className="text-xl font-bold">98.2%</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                Last run 4 days ago
              </div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Utilization Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Asset Allocation & Maintenance Trends</CardTitle>
            <CardDescription className="text-xs">
              Overview of active devices deployed vs units in repair shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <CardTitle className="text-sm font-semibold">Assets by Category</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of total inventory value.
            </CardDescription>
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
            {/* Center Total label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
              <span className="text-lg font-bold">1.2k</span>
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="font-semibold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Approvals & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Pending Request Approvals</CardTitle>
              <CardDescription className="text-xs">
                Asset allocation requests awaiting administrator approval.
              </CardDescription>
            </div>
            <Badge variant="warning" className="text-[10px]">
              {pendingApprovals.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Asset Requested</TableHead>
                  <TableHead className="text-xs">Requested</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-xs font-semibold py-3">{req.employee}</TableCell>
                    <TableCell className="text-xs py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground/80">{req.asset}</span>
                        <span className="text-[10px] text-muted-foreground">{req.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3">{req.requestedAt}</TableCell>
                    <TableCell className="text-xs text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(req.id, req.employee)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id, req.employee)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            <div className="relative border-l border-border/80 pl-4 space-y-5 ml-1 text-xs">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="relative group">
                  {/* Timeline point */}
                  <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground/90">{activity.action}</span>
                      <span className="text-[9px] text-muted-foreground">{activity.time}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
