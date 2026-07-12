import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AssetService } from "@/services/asset.service"
import { OrgService } from "@/services/org.service"
import type { Asset, AssetAllocation, TransferRequest, AssetCondition } from "@/types/asset"
import type { User, Department } from "@/types/organization"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { FileDown, ArrowLeftRight, Check, X, AlertTriangle, Plus } from "lucide-react"
import { toast } from "sonner"

export function AssetAllocationPage() {
  const { user } = useAuth()

  // State collections
  const [allocations, setAllocations] = useState<AssetAllocation[]>([])
  const [transfers, setTransfers] = useState<TransferRequest[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // Drawer controls
  const [allocateDrawerOpen, setAllocateDrawerOpen] = useState(false)
  const [returnDrawerOpen, setReturnDrawerOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  // Allocation Form fields
  const [allocAssetTag, setAllocAssetTag] = useState("")
  const [allocTargetType, setAllocTargetType] = useState<"employee" | "department">("employee")
  const [allocEmployeeId, setAllocEmployeeId] = useState("")
  const [allocDeptId, setAllocDeptId] = useState("")
  const [expectedReturnDate, setExpectedReturnDate] = useState("")

  // Conflict state (triggers transfer option)
  const [conflictActive, setConflictActive] = useState(false)
  const [conflictHolder, setConflictHolder] = useState<string>("")
  const [conflictAlloc, setConflictAlloc] = useState<AssetAllocation | null>(null)

  // Return Form fields
  const [returnNotes, setReturnNotes] = useState("")
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("good")

  const loadData = async () => {
    try {
      const [allocationsData, transfersData, assetsData, usersData, departmentsData] = await Promise.all([
        AssetService.getAllocations(),
        AssetService.getTransferRequests(),
        AssetService.getAssets(),
        OrgService.getUsers(),
        OrgService.getDepartments(),
      ])
      setAllocations(allocationsData)
      setTransfers(transfersData)
      setAssets(assetsData)
      setUsersList(usersData)
      setDepartments(departmentsData)
    } catch {
      toast.error("Failed to load custody data.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Active allocations view
  const activeAllocations = useMemo(() => {
    return allocations.filter((a) => a.status === "active")
  }, [allocations])

  // Overdue allocations (past expected return date)
  const overdueAllocations = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return activeAllocations.filter((a) => a.expectedReturnDate && a.expectedReturnDate < todayStr)
  }, [activeAllocations])

  const handleOpenAllocate = () => {
    setAllocAssetTag("")
    setAllocTargetType("employee")
    setAllocEmployeeId(usersList[0]?.id || "")
    setAllocDeptId(departments[0]?.id || "")
    setExpectedReturnDate("")
    setConflictActive(false)
    setConflictHolder("")
    setConflictAlloc(null)
    setAllocateDrawerOpen(true)
  }

  const handleOpenReturn = (assetTag: string) => {
    const asset = assets.find((a) => a.tag === assetTag)
    if (!asset) return
    setSelectedAsset(asset)
    setReturnNotes("")
    setReturnCondition(asset.condition)
    setReturnDrawerOpen(true)
  }

  // Submit allocation with conflict checks
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!allocAssetTag) throw new Error("Please select or scan an asset.")
      
      const targetAsset = assets.find((a) => a.tag === allocAssetTag)
      if (!targetAsset) throw new Error("Asset not found.")

      // Enforce exclusivity check
      if (targetAsset.status !== "Available") {
        const active = await AssetService.getActiveAllocation(allocAssetTag)
        setConflictAlloc(active || null)
        
        let holderName = "another workflow"
        if (active) {
          if (active.userId) {
            holderName = usersList.find((u) => u.id === active.userId)?.fullName || active.userId
          } else if (active.departmentId) {
            holderName = departments.find((d) => d.id === active.departmentId)?.name || active.departmentId
          }
        }
        setConflictHolder(holderName)
        setConflictActive(true)
        throw new Error(`Exclusivity Conflict: ${allocAssetTag} is currently held by ${holderName}.`)
      }

      const empId = allocTargetType === "employee" ? allocEmployeeId : undefined
      const deptId = allocTargetType === "department" ? allocDeptId : undefined

      if (allocTargetType === "employee" && !allocEmployeeId) throw new Error("Please select a user.")
      if (allocTargetType === "department" && !allocDeptId) throw new Error("Please select a department.")

      await AssetService.allocateAsset(
        allocAssetTag,
        empId,
        deptId,
        expectedReturnDate || undefined,
        user.id,
        user.fullName
      )

      toast.success("Asset allocated successfully.")
      setAllocateDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete allocation.")
    }
  }

  // Raise Transfer Request (Conflict work-around)
  const handleInitiateTransfer = async () => {
    if (!user) return
    if (!allocAssetTag || !conflictAlloc) return

    const targetEmpId = allocTargetType === "employee" ? allocEmployeeId : ""
    const targetDeptId = allocTargetType === "department" ? allocDeptId : ""

    if (allocTargetType === "employee" && !allocEmployeeId) {
      toast.error("Select user to transfer to.")
      return
    }

    try {
      await AssetService.createTransferRequest(
        allocAssetTag,
        conflictAlloc.userId,
        targetEmpId,
        targetDeptId || undefined,
        user.id,
        user.fullName
      )
      toast.success("Conflict bypassed: Transfer Request has been dispatched to managers.")
      setAllocateDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create transfer request.")
    }
  }

  // Confirm Return Flow
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedAsset) return

    try {
      await AssetService.returnAsset(
        selectedAsset.tag,
        returnNotes.trim() || "Check-in return notes logged.",
        returnCondition,
        user.id,
        user.fullName
      )
      toast.success(`Check-in complete. ${selectedAsset.tag} is now available.`)
      setReturnDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete return check-in.")
    }
  }

  // Transfer approvals
  const handleApproveTransfer = async (reqId: string) => {
    if (!user) return
    try {
      await AssetService.approveTransferRequest(reqId, user.id, user.fullName)
      toast.success("Transfer approved. Asset re-allocated.")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve transfer.")
    }
  }

  const handleRejectTransfer = async (reqId: string) => {
    if (!user) return
    try {
      await AssetService.rejectTransferRequest(reqId, user.id, user.fullName)
      toast.error("Transfer request rejected.")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to reject transfer.")
    }
  }

  // Active Allocations columns
  const activeAllocColumns: Column<AssetAllocation>[] = [
    { header: "Asset Tag", accessor: "assetTag", sortable: true },
    {
      header: "Asset Name",
      accessor: (a) => assets.find((as) => as.tag === a.assetTag)?.name || "Unknown",
    },
    {
      header: "Allocated To",
      accessor: (a) => {
        if (a.userId) {
          const emp = usersList.find((u) => u.id === a.userId)
          return emp ? `${emp.fullName} (User)` : a.userId
        }
        if (a.departmentId) {
          const dept = departments.find((d) => d.id === a.departmentId)
          return dept ? `${dept.name} (Dept)` : a.departmentId
        }
        return "Unassigned"
      },
    },
    { header: "Allocated At", accessor: "allocatedAt", sortable: true },
    {
      header: "Expected Return",
      accessor: (a) => a.expectedReturnDate || <span className="text-muted-foreground italic">Indefinite</span>,
    },
    {
      header: "Actions",
      accessor: (a) => (
        <PermissionGuard permission="asset.allocate">
          <Button variant="ghost" size="sm" onClick={() => handleOpenReturn(a.assetTag)} className="h-7 text-xs px-2 text-primary hover:bg-secondary cursor-pointer">
            <FileDown className="h-3.5 w-3.5 mr-1" /> Return Check-In
          </Button>
        </PermissionGuard>
      ),
    },
  ]

  // Overdue allocations columns
  const overdueAllocColumns: Column<AssetAllocation>[] = [
    { header: "Asset Tag", accessor: "assetTag" },
    {
      header: "Asset Name",
      accessor: (a) => assets.find((as) => as.tag === a.assetTag)?.name || "Unknown",
    },
    {
      header: "Holder",
      accessor: (a) => {
        if (a.userId) return usersList.find((u) => u.id === a.userId)?.fullName || a.userId
        return departments.find((d) => d.id === a.departmentId)?.name || a.departmentId || ""
      },
    },
    { header: "Expected Return Date", accessor: "expectedReturnDate" },
  ]

  // Transfer requests columns
  const transferColumns: Column<TransferRequest>[] = [
    { header: "Asset", accessor: "assetTag" },
    {
      header: "From Holder",
      accessor: (t) => usersList.find((u) => u.id === t.fromUserId)?.fullName || t.fromUserId || "Unknown",
    },
    {
      header: "Transfer To",
      accessor: (t) => usersList.find((u) => u.id === t.toUserId)?.fullName || t.toUserId || "Unknown",
    },
    {
      header: "Requested By",
      accessor: (t) => usersList.find((u) => u.id === t.requestedByUserId)?.fullName || t.requestedByUserId || "System",
    },
    {
      header: "Status",
      accessor: (t) => {
        let variant: "default" | "success" | "warning" | "destructive" = "default"
        if (t.status === "Approved") variant = "success"
        else if (t.status === "Pending") variant = "warning"
        else if (t.status === "Rejected") variant = "destructive"
        return <Badge variant={variant}>{t.status}</Badge>
      },
    },
    {
      header: "Actions",
      accessor: (t) =>
        t.status === "Pending" ? (
          <div className="flex items-center gap-1.5">
            <PermissionGuard permission="asset.allocate">
              <Button size="sm" onClick={() => handleApproveTransfer(t.id)} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-2">
                <Check className="h-3 w-3 mr-0.5" /> Approve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRejectTransfer(t.id)} className="h-7 text-[10px] text-destructive hover:bg-destructive/10 cursor-pointer px-2">
                <X className="h-3 w-3 mr-0.5" /> Reject
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">Resolved</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Allocations & Transfers</h2>
          <p className="text-xs text-muted-foreground">
            Manage physical inventory custody. Allocate items to personnel/departments, process transfer approvals, and monitor returns.
          </p>
        </div>
        <PermissionGuard permission="asset.allocate">
          <Button size="sm" onClick={handleOpenAllocate} className="text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Allocate Asset
          </Button>
        </PermissionGuard>
      </div>

      {/* KPI Overdue Indicator Alert */}
      {overdueAllocations.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/[0.02]">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2.5 items-start text-xs">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <h4 className="font-bold text-destructive">Overdue Asset Returns Detected</h4>
                <p className="text-muted-foreground">
                  {overdueAllocations.length} active allocation(s) are past their expected return schedules. Surface alerts or contact holders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Allocations List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Allocations Ledger</CardTitle>
            <CardDescription className="text-xs">Ledger of all inventory items currently checked-out.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={activeAllocations}
              columns={activeAllocColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>

        {/* Overdue returns & quick lookups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Overdue Returns Monitor</CardTitle>
            <CardDescription className="text-xs">Assets past anticipated return dates.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={overdueAllocations}
              columns={overdueAllocations.length === 0 ? [] : overdueAllocColumns}
              pageSize={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transfer Requests Board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Asset Transfer Approval Board</CardTitle>
          <CardDescription className="text-xs">
            Review custody transfer requests to bypass allocation locks.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={transfers}
            columns={transferColumns}
            pageSize={5}
          />
        </CardContent>
      </Card>

      {/* Drawer 1: Allocation Form */}
      <Drawer
        open={allocateDrawerOpen}
        onClose={() => setAllocateDrawerOpen(false)}
        title="Check-Out Asset Check"
        description="Allocate inventory items to single owners or departments."
        footer={
          conflictActive ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setAllocateDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
                Cancel
              </Button>
              <Button size="sm" onClick={handleInitiateTransfer} className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
                <ArrowLeftRight className="h-4 w-4 mr-2" /> Request Custody Transfer
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setAllocateDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAllocateSubmit} className="text-xs h-8 cursor-pointer">
                Assign Allocation
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
          {/* Conflict Alert in Drawer */}
          {conflictActive && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex gap-2 items-center font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Exclusivity Lock Triggered</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Item <strong>{allocAssetTag}</strong> is currently held by <strong>{conflictHolder}</strong>. Double allocation is blocked by ERP policy.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Select Available Asset</label>
            <Select value={allocAssetTag} onChange={(e) => setAllocAssetTag(e.target.value)}>
              <option value="">Choose Asset...</option>
              {assets.map((asset) => (
                <option key={asset.tag} value={asset.tag}>
                  {asset.tag} - {asset.name} ({asset.status})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Allocate Target</label>
              <Select value={allocTargetType} onChange={(e) => setAllocTargetType(e.target.value as any)}>
                <option value="employee">User Profile</option>
                <option value="department">Department</option>
              </Select>
            </div>

            {allocTargetType === "employee" ? (
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">User Account</label>
                <Select value={allocEmployeeId} onChange={(e) => setAllocEmployeeId(e.target.value)}>
                  {usersList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.designation || emp.roleId})
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Department</label>
                <Select value={allocDeptId} onChange={(e) => setAllocDeptId(e.target.value)}>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Expected Return Date</label>
            <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
          </div>
        </form>
      </Drawer>

      {/* Drawer 2: Return Form */}
      <Drawer
        open={returnDrawerOpen}
        onClose={() => setReturnDrawerOpen(false)}
        title="Check-In Return Custody"
        description={selectedAsset ? `Asset Tag: ${selectedAsset.tag} (${selectedAsset.name})` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setReturnDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleReturnSubmit} className="text-xs h-8 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirm Check-In
            </Button>
          </>
        }
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Return Condition Rating</label>
            <Select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as any)}>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Condition Notes / Comments</label>
            <Input
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g. Returned clean, minor scuffs from usage."
              className="text-xs"
            />
          </div>
        </form>
      </Drawer>
    </div>
  )
}
