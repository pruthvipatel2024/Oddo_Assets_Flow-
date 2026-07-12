import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ActivityLogger } from "@/services/activity.service"
import api from "@/services/api"
import type { ActivityLog } from "@/types/logs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { ShieldAlert, RefreshCw, Database } from "lucide-react"
import { toast } from "sonner"

export function SettingsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])

  const loadLogs = async () => {
    try {
      const data = await ActivityLogger.getLogs()
      setLogs(data)
    } catch {
      toast.error("Failed to retrieve audit trail.")
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleResetDatabase = async () => {
    if (window.confirm("Are you sure you want to restore the database to seed settings? This will clear all modifications.")) {
      try {
        await api.post("/db/reset")
        toast.success("Database restored to default seeds.")
        loadLogs()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch {
        toast.error("Failed to restore default database.")
      }
    }
  }

  const logColumns: Column<ActivityLog>[] = [
    { header: "Activity Action", accessor: "action", sortable: true },
    { header: "Operation Details", accessor: "details" },
    { header: "Operator Username", accessor: "userName", sortable: true },
    {
      header: "Timestamp",
      accessor: (l) => new Date(l.timestamp).toLocaleString(),
      sortable: true,
      sortKey: "timestamp",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Settings & Logs</h2>
        <p className="text-xs text-muted-foreground">
          View user profile configurations, manage database resets, and inspect system audit trial logs.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <div className="border-b border-border/60 pb-3">
          <TabsList>
            <TabsTrigger value="profile" className="text-xs py-1">User Profile</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs py-1">System Audit Logs</TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Details Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Profile Settings</CardTitle>
                <CardDescription className="text-xs">Your current active ERP session metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-muted-foreground text-[10px] uppercase block">Full Name</span>
                      <p className="font-semibold text-sm">{user.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-muted-foreground text-[10px] uppercase block">Email Address</span>
                      <p className="font-semibold text-sm">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-muted-foreground text-[10px] uppercase block">Role Level</span>
                      <div>
                        <Badge variant="info" className="capitalize text-[10px]">{user.roleId.replace("_", " ")}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-muted-foreground text-[10px] uppercase block">Department Index</span>
                      <p className="font-semibold text-sm">{user.departmentId || "Unassigned"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <PermissionGuard permission="organization.manage">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-destructive">Database Controls</CardTitle>
                  <CardDescription className="text-xs">Admin database reset keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      Restoring the database will overwrite all active allocations, bookings, audits, and category alterations with initial seed configurations.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleResetDatabase} className="w-full text-xs text-destructive hover:bg-destructive/10 cursor-pointer">
                    <Database className="h-4 w-4 mr-2" /> Reset ERP Database Seed
                  </Button>
                </CardContent>
              </Card>
            </PermissionGuard>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs">
          <PermissionGuard permission="organization.manage">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Central Audit Trail Log</CardTitle>
                  <CardDescription className="text-xs">Trace operator activity actions recorded on the ERP server.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadLogs} className="h-8 text-xs cursor-pointer">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  data={logs}
                  columns={logColumns}
                  searchPlaceholder="Search log events..."
                  searchKeys={["action", "details", "userName"]}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
