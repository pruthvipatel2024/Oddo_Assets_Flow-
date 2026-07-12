import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AssetService } from "@/services/asset.service"
import { OrgService } from "@/services/org.service"
import type { Asset, AssetCondition, AssetStatus, AssetHistoryEntry, AssetAllocation } from "@/types/asset"
import type { AssetCategory, User, Department } from "@/types/organization"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { Plus, Eye, History, FileText, Info, Wrench, ArrowLeftRight, UserCheck, CheckSquare } from "lucide-react"
import { toast } from "sonner"

export function AssetDirectoryPage() {
  const { user } = useAuth()
  
  // Data lists
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [allocations, setAllocations] = useState<AssetAllocation[]>([])

  // Filter States
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [conditionFilter, setConditionFilter] = useState("")

  // Drawers
  const [registerDrawerOpen, setRegisterDrawerOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetHistory, setAssetHistory] = useState<AssetHistoryEntry[]>([])

  // Register Form states
  const [assetName, setAssetName] = useState("")
  const [assetCatId, setAssetCatId] = useState("")
  const [assetSerial, setAssetSerial] = useState("")
  const [assetAcqDate, setAssetAcqDate] = useState(new Date().toISOString().split("T")[0])
  const [assetAcqCost, setAssetAcqCost] = useState(0)
  const [assetCondition, setAssetCondition] = useState<AssetCondition>("new")
  const [assetLocation, setAssetLocation] = useState("")
  const [assetShared, setAssetShared] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})

  // Quick Custody Action States
  const [allocTargetType, setAllocTargetType] = useState<"employee" | "department">("employee")
  const [allocEmployeeId, setAllocEmployeeId] = useState("")
  const [allocDeptId, setAllocDeptId] = useState("")
  const [expectedReturnDate, setExpectedReturnDate] = useState("")
  const [returnNotes, setReturnNotes] = useState("")
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("good")
  const [transferTargetEmpId, setTransferTargetEmpId] = useState("")

  const loadData = async () => {
    try {
      const [assetsData, catsData, usersData, deptsData, allocationsData] = await Promise.all([
        AssetService.getAssets(),
        OrgService.getCategories(),
        OrgService.getUsers(),
        OrgService.getDepartments(),
        AssetService.getAllocations(),
      ])
      setAssets(assetsData)
      setCategories(catsData)
      setUsersList(usersData)
      setDepartments(deptsData)
      setAllocations(allocationsData)
    } catch {
      toast.error("Failed to load inventory assets.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Dynamic custom fields based on selected category in form
  const selectedCategoryFields = useMemo(() => {
    const cat = categories.find((c) => c.id === assetCatId)
    return cat ? cat.fields : []
  }, [assetCatId, categories])

  // Reset custom values when category changes
  useEffect(() => {
    const initVals: Record<string, any> = {}
    selectedCategoryFields.forEach((field) => {
      initVals[field.name] = field.type === "number" ? 0 : ""
    })
    setCustomFieldValues(initVals)
  }, [selectedCategoryFields])

  // Advanced filters computed client-side
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const cat = categories.find((c) => c.id === asset.categoryId)
      const catName = cat ? cat.name.toLowerCase() : ""

      const query = search.toLowerCase()
      const matchesSearch =
        asset.name.toLowerCase().includes(query) ||
        asset.tag.toLowerCase().includes(query) ||
        asset.serialNumber.toLowerCase().includes(query) ||
        asset.location.toLowerCase().includes(query) ||
        catName.includes(query)

      const matchesCat = categoryFilter ? asset.categoryId === categoryFilter : true
      const matchesStatus = statusFilter ? asset.status === statusFilter : true
      const matchesCondition = conditionFilter ? asset.condition === conditionFilter : true

      return matchesSearch && matchesCat && matchesStatus && matchesCondition
    })
  }, [assets, categories, search, categoryFilter, statusFilter, conditionFilter])

  const handleOpenRegister = () => {
    setAssetName("")
    setAssetCatId(categories[0]?.id || "")
    setAssetSerial("")
    setAssetAcqDate(new Date().toISOString().split("T")[0])
    setAssetAcqCost(0)
    setAssetCondition("new")
    setAssetLocation("")
    setAssetShared(false)
    setRegisterDrawerOpen(true)
  }

  const handleOpenDetails = async (asset: Asset) => {
    setSelectedAsset(asset)
    setAllocEmployeeId(usersList[0]?.id || "")
    setAllocDeptId(departments[0]?.id || "")
    setTransferTargetEmpId(usersList[0]?.id || "")
    setExpectedReturnDate("")
    setReturnNotes("")
    setReturnCondition(asset.condition)
    
    try {
      const history = await AssetService.getAssetHistory(asset.tag)
      setAssetHistory(history)
    } catch {
      toast.error("Failed to load asset lifecycle history.")
    }
    setDetailDrawerOpen(true)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!assetName.trim()) throw new Error("Asset name is required.")
      if (!assetSerial.trim()) throw new Error("Serial number is required.")
      if (!assetCatId) throw new Error("Please select an asset category.")

      // Verify required custom fields
      selectedCategoryFields.forEach((field) => {
        if (field.required) {
          const val = customFieldValues[field.name]
          if (val === undefined || val === null || val === "") {
            throw new Error(`Custom field "${field.name}" is required.`)
          }
        }
      })

      await AssetService.registerAsset(
        {
          name: assetName.trim(),
          categoryId: assetCatId,
          serialNumber: assetSerial.trim(),
          acquisitionDate: assetAcqDate,
          acquisitionCost: Number(assetAcqCost),
          condition: assetCondition,
          location: assetLocation.trim(),
          sharedFlag: assetShared,
          status: "Available",
          customFields: customFieldValues,
        },
        user.id,
        user.fullName
      )

      toast.success("Asset registered successfully!")
      setRegisterDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to register asset.")
    }
  }

  // Quick Action Handlers inside Drawer
  const handleQuickAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedAsset) return

    try {
      const empId = allocTargetType === "employee" ? allocEmployeeId : undefined
      const deptId = allocTargetType === "department" ? allocDeptId : undefined

      if (allocTargetType === "employee" && !allocEmployeeId) throw new Error("Please select a user.")
      if (allocTargetType === "department" && !allocDeptId) throw new Error("Please select a department.")

      await AssetService.allocateAsset(
        selectedAsset.tag,
        empId,
        deptId,
        expectedReturnDate || undefined,
        user.id,
        user.fullName
      )

      toast.success(`Asset ${selectedAsset.tag} allocated successfully.`)
      setDetailDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to allocate asset.")
    }
  }

  const handleQuickReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedAsset) return

    try {
      await AssetService.returnAsset(
        selectedAsset.tag,
        returnNotes.trim() || "Returned via directory quick action.",
        returnCondition,
        user.id,
        user.fullName
      )

      toast.success(`Asset ${selectedAsset.tag} returned successfully.`)
      setDetailDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to return asset.")
    }
  }

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedAsset) return

    const activeAlloc = allocations.find((a) => a.assetTag === selectedAsset.tag && a.status === "active")
    if (!activeAlloc) {
      toast.error("No active allocation found to transfer.")
      return
    }

    try {
      if (!transferTargetEmpId) throw new Error("Please select a user to transfer to.")

      await AssetService.createTransferRequest(
        selectedAsset.tag,
        activeAlloc.userId,
        transferTargetEmpId,
        undefined,
        user.id,
        user.fullName
      )

      toast.success("Custody Transfer Request submitted to managers.")
      setDetailDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch transfer request.")
    }
  }

  const getStatusBadge = (status: AssetStatus) => {
    let variant: "default" | "success" | "warning" | "info" | "destructive" | "secondary" = "default"
    switch (status) {
      case "Available":
        variant = "success"
        break
      case "Allocated":
        variant = "info"
        break
      case "Reserved":
        variant = "warning"
        break
      case "Under Maintenance":
        variant = "warning"
        break
      case "Lost":
        variant = "destructive"
        break
      case "Disposed":
      case "Retired":
        variant = "secondary"
        break
    }
    return <Badge variant={variant}>{status}</Badge>
  }

  // Column definitions
  const columns: Column<Asset>[] = [
    { header: "Tag", accessor: "tag", sortable: true },
    { header: "Asset Name", accessor: "name", sortable: true },
    {
      header: "Category",
      accessor: (a) => categories.find((c) => c.id === a.categoryId)?.name || "Unknown",
    },
    { header: "Serial Number", accessor: "serialNumber" },
    { header: "Location", accessor: "location", sortable: true },
    {
      header: "Status",
      accessor: (a) => getStatusBadge(a.status),
    },
    {
      header: "Type",
      accessor: (a) => (
        <Badge variant={a.sharedFlag ? "info" : "secondary"}>
          {a.sharedFlag ? "Shared / Bookable" : "Exclusive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (a) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(a)} className="h-7 text-xs px-2 cursor-pointer">
            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect & Manage
          </Button>
        </div>
      ),
    },
  ]

  // Find active holder name for display in drawer
  const getActiveHolderText = (tag: string) => {
    const active = allocations.find((a) => a.assetTag === tag && a.status === "active")
    if (!active) return "None"
    if (active.userId) {
      return usersList.find((u) => u.id === active.userId)?.fullName || active.userId
    }
    if (active.departmentId) {
      return departments.find((d) => d.id === active.departmentId)?.name || active.departmentId
    }
    return "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Asset Directory</h2>
          <p className="text-xs text-muted-foreground">
            Central repository of corporate inventory. Inspect details and configure custody controls in a single window.
          </p>
        </div>
        <PermissionGuard permissions={["asset.create"]}>
          <Button size="sm" onClick={handleOpenRegister} className="text-xs h-8 cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Register Asset
          </Button>
        </PermissionGuard>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1 text-xs">
            <label className="font-bold text-muted-foreground uppercase text-[9px]">Text Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tag, name, serial, location..."
              className="text-xs h-8.5"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-muted-foreground uppercase text-[9px]">Category</label>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs h-8.5 py-0.5">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-muted-foreground uppercase text-[9px]">Lifecycle Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs h-8.5 py-0.5">
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </Select>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-muted-foreground uppercase text-[9px]">Condition</label>
            <Select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="text-xs h-8.5 py-0.5">
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Directory Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredAssets}
            columns={columns}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Drawer 1: Registration Form */}
      <Drawer
        open={registerDrawerOpen}
        onClose={() => setRegisterDrawerOpen(false)}
        title="Register New Inventory Item"
        description="Establish a new tracking record. Code AF-XXXX will be auto-generated."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRegisterDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleRegisterSubmit} className="text-xs h-8 cursor-pointer">
              Confirm Registry
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">Asset Name</label>
            <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Dell PowerEdge Server" className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Asset Category</label>
              <Select value={assetCatId} onChange={(e) => setAssetCatId(e.target.value)} className="text-xs">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Serial Number</label>
              <Input value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)} placeholder="e.g. SN-PE-12345" className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Acquisition Date</label>
              <Input type="date" value={assetAcqDate} onChange={(e) => setAssetAcqDate(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Cost Value ($)</label>
              <Input type="number" value={assetAcqCost} onChange={(e) => setAssetAcqCost(Number(e.target.value))} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Current Condition</label>
              <Select value={assetCondition} onChange={(e) => setAssetCondition(e.target.value as any)} className="text-xs">
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase text-[10px]">Storage Location</label>
              <Input value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)} placeholder="e.g. Floor 2 Row C" className="text-xs" />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="assetShared"
              checked={assetShared}
              onChange={(e) => setAssetShared(e.target.checked)}
              className="h-4 w-4 border-border rounded"
            />
            <label htmlFor="assetShared" className="font-bold text-muted-foreground text-[11px] select-none">
              Flag as Shared / Bookable Resource (e.g. cars, spaces, pooled gadgets)
            </label>
          </div>

          {/* Dynamic Custom Fields */}
          {selectedCategoryFields.length > 0 && (
            <div className="border-t border-border/40 pt-4 space-y-3">
              <label className="font-bold text-muted-foreground uppercase text-[10px] block">Category Specific Attributes</label>
              <div className="grid grid-cols-2 gap-3">
                {selectedCategoryFields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="font-semibold text-foreground/80">
                      {field.name} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      placeholder={`Enter ${field.name}`}
                      value={customFieldValues[field.name] ?? ""}
                      onChange={(e) =>
                        setCustomFieldValues({
                          ...customFieldValues,
                          [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="text-xs h-8.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Drawer>

      {/* Drawer 2: Detailed Asset Inspector + Custody Manager */}
      <Drawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedAsset ? `Asset Control: ${selectedAsset.tag}` : "Asset Control"}
        description={selectedAsset?.name}
        size="lg"
      >
        {selectedAsset && (
          <div className="space-y-6 text-xs select-text">
            {/* Metadata Summary */}
            <div className="grid grid-cols-3 gap-3 bg-secondary/35 p-3 rounded-lg border border-border/40">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Category</span>
                <p className="font-semibold">{categories.find((c) => c.id === selectedAsset.categoryId)?.name}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Current Holder</span>
                <p className="font-semibold text-primary truncate" title={getActiveHolderText(selectedAsset.tag)}>
                  {getActiveHolderText(selectedAsset.tag)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Current Status</span>
                <div>{getStatusBadge(selectedAsset.status)}</div>
              </div>
            </div>

            {/* Custody Quick Actions Panel */}
            <div className="bg-card border border-border/80 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-[11px] uppercase text-foreground/90 border-b pb-2 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Custody Control Center
              </h3>

              {selectedAsset.status === "Available" ? (
                // Checkout Form
                <form onSubmit={handleQuickAllocate} className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">This asset is available. Allocate custody directly:</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">Allocate To</label>
                      <Select value={allocTargetType} onChange={(e) => setAllocTargetType(e.target.value as any)}>
                        <option value="employee">User</option>
                        <option value="department">Department</option>
                      </Select>
                    </div>

                    {allocTargetType === "employee" ? (
                      <div className="space-y-1">
                        <label className="font-bold text-muted-foreground text-[10px] uppercase">User Profile</label>
                        <Select value={allocEmployeeId} onChange={(e) => setAllocEmployeeId(e.target.value)}>
                          {usersList.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.designation || emp.roleId})</option>
                          ))}
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="font-bold text-muted-foreground text-[10px] uppercase">Department</label>
                        <Select value={allocDeptId} onChange={(e) => setAllocDeptId(e.target.value)}>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">Expected Return Date</label>
                      <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
                    </div>
                    <Button type="submit" size="sm" className="w-full h-9">
                      Confirm Allocation
                    </Button>
                  </div>
                </form>
              ) : selectedAsset.status === "Allocated" ? (
                // Return Form & Custody Transfer Form side-by-side
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
                  {/* Return form */}
                  <form onSubmit={handleQuickReturn} className="space-y-3 pr-0 md:pr-4">
                    <h4 className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-success" /> Confirm Check-In / Return
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">Notes on Return Condition</label>
                      <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="e.g. Scuffs on back cover, operational." />
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="font-bold text-muted-foreground text-[10px] uppercase">Condition Status</label>
                        <Select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as any)}>
                          <option value="new">New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </Select>
                      </div>
                      <Button type="submit" size="sm" variant="default" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                        Check In
                      </Button>
                    </div>
                  </form>

                  {/* Transfer form */}
                  <form onSubmit={handleQuickTransfer} className="space-y-3 pt-4 md:pt-0 pl-0 md:pl-4">
                    <h4 className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1.5">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500" /> Bypassed Custody Transfer
                    </h4>

                    <p className="text-[10px] text-muted-foreground">
                      Request custody change directly to another user:
                    </p>

                    <div className="space-y-1">
                      <label className="font-bold text-muted-foreground text-[10px] uppercase">Transfer To</label>
                      <Select value={transferTargetEmpId} onChange={(e) => setTransferTargetEmpId(e.target.value)}>
                        {usersList.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                        ))}
                      </Select>
                    </div>

                    <Button type="submit" size="sm" variant="default" className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white">
                      Submit Transfer
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">
                  Custody control is disabled for assets with status: <strong className="text-foreground">{selectedAsset.status}</strong>.
                </p>
              )}
            </div>

            {/* Core Details list */}
            <div className="space-y-2">
              <h3 className="font-bold text-[10px] uppercase text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> Core Inventory Parameters
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <div className="flex justify-between border-b pb-1.5 border-dashed border-border/40">
                  <span className="text-muted-foreground">Acquisition Date:</span>
                  <span className="font-medium text-foreground">{selectedAsset.acquisitionDate}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-dashed border-border/40">
                  <span className="text-muted-foreground">Acquisition Value:</span>
                  <span className="font-medium text-foreground">${selectedAsset.acquisitionCost}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-dashed border-border/40">
                  <span className="text-muted-foreground">Storage Location:</span>
                  <span className="font-medium text-foreground">{selectedAsset.location}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-dashed border-border/40">
                  <span className="text-muted-foreground">Initial Condition:</span>
                  <span className="font-medium text-foreground capitalize">{selectedAsset.condition}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Custom Fields Details */}
            {Object.keys(selectedAsset.customFields).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-[10px] uppercase text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Category Enforced Parameters
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {Object.entries(selectedAsset.customFields).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b pb-1.5 border-dashed border-border/40">
                      <span className="text-muted-foreground">{k}:</span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Event History Timeline */}
            <div className="space-y-3.5">
              <h3 className="font-bold text-[10px] uppercase text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Lifecycle Event History
              </h3>
              {assetHistory.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground py-2">No event modifications registered.</p>
              ) : (
                <div className="relative border-l border-border/80 pl-4 space-y-4 ml-1">
                  {assetHistory.map((h) => (
                    <div key={h.id} className="relative">
                      {/* Timeline point */}
                      <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-secondary/80 flex items-center justify-center">
                        {h.type === "maintenance" ? (
                          <Wrench className="h-2 w-2 text-amber-500" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground/90 capitalize">{h.type}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(h.date).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{h.details}</p>
                        <span className="text-[9px] text-muted-foreground/80 block">Performed by: {h.performedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
