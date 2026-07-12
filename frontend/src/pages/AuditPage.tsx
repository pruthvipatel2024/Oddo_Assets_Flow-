import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AuditService } from "@/services/audit.service"
import { AssetService } from "@/services/asset.service"
import { OrgService } from "@/services/org.service"
import type { AuditCycle, AuditResult } from "@/types/audit"
import type { Asset, AssetAllocation } from "@/types/asset"
import type { User, Department } from "@/types/organization"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { ClipboardList, ShieldAlert, Plus, Lock } from "lucide-react"
import { toast } from "sonner"

export function AuditPage() {
  const { user } = useAuth()

  // State collections
  const [cycles, setCycles] = useState<AuditCycle[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [allocations, setAllocations] = useState<AssetAllocation[]>([])

  // Drawer states
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [portalOpen, setPortalOpen] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<AuditCycle | null>(null)

  // Form Fields - Create Cycle
  const [cycleName, setCycleName] = useState("")
  const [scopeDeptId, setScopeDeptId] = useState("")
  const [scopeLocation, setScopeLocation] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [assignedAuditorUserId, setAssignedAuditorUserId] = useState("")
  const [cycleNotes, setCycleNotes] = useState("")

  const loadData = async () => {
    try {
      const [cyclesData, assetsData, usersData, departmentsData, allocationsData] = await Promise.all([
        AuditService.getCycles(),
        AssetService.getAssets(),
        OrgService.getUsers(),
        OrgService.getDepartments(),
        AssetService.getAllocations(),
      ])
      setCycles(cyclesData)
      setAssets(assetsData)
      setUsersList(usersData)
      setDepartments(departmentsData)
      setAllocations(allocationsData)
    } catch {
      toast.error("Failed to load audit cycles.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // filter assets scoped for the current selected cycle checklist
  const scopedChecklistAssets = useMemo(() => {
    if (!selectedCycle) return []
    return assets.filter((asset) => {
      const activeAlloc = allocations.find((a) => a.assetTag === asset.tag && a.status === "active")
      const matchesDept = selectedCycle.scopeDepartmentId ? asset.categoryId === selectedCycle.scopeDepartmentId || 
        (activeAlloc && activeAlloc.departmentId === selectedCycle.scopeDepartmentId)
        : true

      const matchesLoc = selectedCycle.scopeLocation ? asset.location.toLowerCase().includes(selectedCycle.scopeLocation.toLowerCase()) : true

      return matchesDept && matchesLoc
    })
  }, [selectedCycle, assets, allocations])

  // Is current logged in user assigned as auditor for selected cycle?
  const isAssignedAuditor = useMemo(() => {
    if (!selectedCycle || !user) return false
    return selectedCycle.assignedAuditorUserId === user.id || user.roleId === "sys_admin" || user.roleId === "org_admin"
  }, [selectedCycle, user])

  const handleOpenCreate = () => {
    setCycleName("")
    setScopeDeptId("")
    setScopeLocation("")
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setAssignedAuditorUserId(usersList[0]?.id || "")
    setCycleNotes("")
    setCreateDrawerOpen(true)
  }

  const handleOpenChecklistPortal = (cycle: AuditCycle) => {
    setSelectedCycle(cycle)
    setPortalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!cycleName.trim()) throw new Error("Cycle name is required.")
      if (!endDate) throw new Error("Please schedule an audit end date.")
      if (!assignedAuditorUserId) throw new Error("Please select an auditor.")

      await AuditService.createCycle(
        cycleName.trim(),
        scopeDeptId || undefined,
        scopeLocation || undefined,
        startDate,
        endDate,
        assignedAuditorUserId,
        cycleNotes.trim() || undefined,
        user.id,
        user.fullName
      )

      toast.success("Audit cycle launched and notifications dispatched.")
      setCreateDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to launch audit cycle.")
    }
  }

  // Auditor checklist toggle
  const handleMarkResult = async (tag: string, result: AuditResult) => {
    if (!user || !selectedCycle) return

    try {
      await AuditService.recordResult(selectedCycle.id, tag, result, user.id, user.fullName)
      toast.success(`${tag} marked as ${result}`)
      
      const [updatedCycles, updatedAssets] = await Promise.all([
        AuditService.getCycles(),
        AssetService.getAssets()
      ])
      setCycles(updatedCycles)
      setSelectedCycle(updatedCycles.find((c) => c.id === selectedCycle.id) || null)
      setAssets(updatedAssets)
    } catch (err: any) {
      toast.error(err.message || "Failed to register checklist result.")
    }
  }

  // Closing audit cycle
  const handleCloseAuditCycle = async () => {
    if (!user || !selectedCycle) return

    try {
      await AuditService.closeCycle(selectedCycle.id, user.id, user.fullName)
      toast.success("Audit cycle locked. Discrepancy actions applied.")
      setPortalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize audit cycle.")
    }
  }

  // Columns for cycle list
  const columns: Column<AuditCycle>[] = [
    { header: "Audit Name", accessor: "name", sortable: true },
    {
      header: "Department Scope",
      accessor: (c) => departments.find((d) => d.id === c.scopeDepartmentId)?.name || <span className="text-muted-foreground font-semibold uppercase text-[10px]">All Org</span>,
    },
    {
      header: "Checklist Scope Location",
      accessor: (c) => c.scopeLocation || <span className="text-muted-foreground font-semibold uppercase text-[10px]">All Facilities</span>,
    },
    {
      header: "Scheduled Window",
      accessor: (c) => `${c.startDate} to ${c.endDate}`,
    },
    {
      header: "Status",
      accessor: (c) => (
        <Badge variant={c.status === "Active" ? "warning" : "secondary"}>
          {c.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Auditor Assigned",
      accessor: (c) => usersList.find((u) => u.id === c.assignedAuditorUserId)?.fullName || c.assignedAuditorUserId,
    },
    {
      header: "Actions",
      accessor: (c) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenChecklistPortal(c)} className="h-7 text-xs px-2 cursor-pointer">
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          {c.status === "Active" ? "Perform Audit" : "Discrepancy Sheet"}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Audits & Compliance</h2>
          <p className="text-xs text-muted-foreground">
            Launch inventory audits, assign cycle checklists to officers, and auto-generate lost item discrepancy sheets.
          </p>
        </div>
        <PermissionGuard permissions={["audit.create"]}>
          <Button size="sm" onClick={handleOpenCreate} className="text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Launch Audit Cycle
          </Button>
        </PermissionGuard>
      </div>

      {/* Main cycles table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={cycles}
            columns={columns}
            pageSize={5}
          />
        </CardContent>
      </Card>

      {/* Drawer 1: Create Cycle */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Schedule Compliance Audit"
        description="Verify inventory records against physical office spaces."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreateDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSubmit} className="text-xs h-8 cursor-pointer">
              Launch Audit
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Audit Cycle Name</label>
            <Input
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g. Q3 Corporate Hardware Audit"
              className="text-xs text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Scope Department (Optional)</label>
              <Select value={scopeDeptId} onChange={(e) => setScopeDeptId(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Scope Location (Optional)</label>
              <Input
                value={scopeLocation}
                onChange={(e) => setScopeLocation(e.target.value)}
                placeholder="e.g. HQ Floor 3"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Assign Auditor</label>
            <Select value={assignedAuditorUserId} onChange={(e) => setAssignedAuditorUserId(e.target.value)}>
              {usersList.map((usr) => (
                <option key={usr.id} value={usr.id}>{usr.fullName} ({usr.designation || usr.roleId})</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Audit Cycle Scope Notes</label>
            <textarea
              value={cycleNotes}
              onChange={(e) => setCycleNotes(e.target.value)}
              placeholder="Provide context or guidelines for checklist officers..."
              className="w-full min-h-[80px] bg-background border border-border/80 rounded-md p-2 text-xs focus:outline-none"
            />
          </div>
        </form>
      </Drawer>

      {/* Drawer 2: Checklist & Discrepancy Portal */}
      <Drawer
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        title={selectedCycle ? `${selectedCycle.name}` : "Audit Checklist Portal"}
        description={
          selectedCycle?.status === "Active"
            ? "Inspect items in scope and mark checklist flags."
            : "Locked audit cycle discrepancy outcomes sheet."
        }
        size="xl"
        footer={
          selectedCycle?.status === "Active" && (user?.roleId === "sys_admin" || user?.roleId === "org_admin") ? (
            <Button size="sm" onClick={handleCloseAuditCycle} className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-white cursor-pointer">
              <Lock className="h-4 w-4 mr-2" /> Finalize & Close Audit Cycle
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setPortalOpen(false)} className="text-xs h-8 cursor-pointer">
              Close Portal View
            </Button>
          )
        }
      >
        {selectedCycle && (
          <div className="space-y-5 text-xs select-none">
            {/* Meta summary */}
            <div className="grid grid-cols-4 gap-3 bg-secondary/35 p-3 rounded-lg border border-border/40 select-text">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Scope Dept</span>
                <p className="font-semibold">{departments.find((d) => d.id === selectedCycle.scopeDepartmentId)?.name || "All Org"}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Scope Facility</span>
                <p className="font-semibold truncate">{selectedCycle.scopeLocation || "All Facilities"}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">End Date</span>
                <p className="font-semibold">{selectedCycle.endDate}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Closing Policy</span>
                <p className="font-semibold text-destructive">Flags auto-adjust status</p>
              </div>
            </div>

            {/* Checklist portal */}
            <div className="space-y-3 select-text">
              <h3 className="font-bold text-[10px] uppercase text-muted-foreground border-b pb-1.5">Scoped Equipment Checklist Ledger</h3>
              
              {scopedChecklistAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-8">No inventory items matched this audit scope.</p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {scopedChecklistAssets.map((asset) => {
                    const result = selectedCycle.results[asset.tag]
                    const isClosed = selectedCycle.status === "Closed"
                    const canEdit = isAssignedAuditor && !isClosed

                    return (
                      <div key={asset.tag} className="p-3 rounded-lg border border-border/80 bg-card/45 flex items-center justify-between flex-wrap gap-3">
                        <div className="space-y-0.5 max-w-[50%]">
                          <span className="font-bold text-foreground/80">{asset.name}</span>
                          <div className="flex gap-2 text-[10px] text-muted-foreground font-medium pt-0.5">
                            <span>{asset.tag}</span>
                            <span>•</span>
                            <span className="truncate">{asset.location}</span>
                          </div>
                        </div>

                        {/* Action buttons or status */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {canEdit ? (
                            <>
                              <Button
                                size="sm"
                                variant={result === "Verified" ? "default" : "outline"}
                                onClick={() => handleMarkResult(asset.tag, "Verified")}
                                className="h-7 text-[10px] py-1 px-2.5 cursor-pointer font-bold border-emerald-500 hover:bg-emerald-50"
                              >
                                Verified
                              </Button>
                              <Button
                                size="sm"
                                variant={result === "Missing" ? "destructive" : "outline"}
                                onClick={() => handleMarkResult(asset.tag, "Missing")}
                                className="h-7 text-[10px] py-1 px-2.5 cursor-pointer font-bold border-red-500 hover:bg-red-50"
                              >
                                Missing
                              </Button>
                              <Button
                                size="sm"
                                variant={result === "Damaged" ? "default" : "outline"}
                                onClick={() => handleMarkResult(asset.tag, "Damaged")}
                                className={`h-7 text-[10px] py-1 px-2.5 cursor-pointer font-bold border-amber-500 ${
                                  result === "Damaged"
                                    ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                                    : "hover:bg-amber-55 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                Damaged
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              {result ? (
                                <Badge
                                  variant={
                                    result === "Verified"
                                      ? "success"
                                      : result === "Missing"
                                      ? "destructive"
                                      : "warning"
                                  }
                                >
                                  {result.toUpperCase()}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">UNAUDITED</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Discrepancies Outcomes Panel (if Closed) */}
            {selectedCycle.status === "Closed" && (
              <div className="p-4 bg-muted/20 border border-dashed border-border/80 rounded-lg space-y-2 select-text">
                <h4 className="font-bold text-foreground/80 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-destructive" /> Discrepancy Closure Outcomes Report</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Upon closing the audit cycle, the following automated actions were logged:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Any checklist items marked as <span className="text-destructive font-semibold">Missing</span> were updated to status <span className="font-semibold text-foreground">Lost</span>.</li>
                  <li>Checklist items marked as <span className="text-amber-500 font-semibold">Damaged</span> triggered maintenance fault flags.</li>
                  <li>Discrepancy balances locked into historical compliance files.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
