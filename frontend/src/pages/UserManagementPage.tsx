import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { OrgService } from "@/services/org.service"
import type { Department, AssetCategory, User, CategoryField } from "@/types/organization"
import type { Role } from "@/types/auth"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import type { Column } from "@/components/ui/DataTable"
import { Drawer } from "@/components/ui/Drawer"
import { PermissionGuard } from "@/components/ui/PermissionGuard"
import { Building2, Layers, Users, Plus, Edit, ShieldAlert, Key, UserPlus } from "lucide-react"
import { toast } from "sonner"

export function UserManagementPage() {
  const { user } = useAuth()
  
  // Data lists in state
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  // Drawer & Form states
  const [activeTab, setActiveTab] = useState("users")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<{ type: "department" | "category" | "user"; data?: any } | null>(null)

  // Password reset state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")

  // Load database entities
  const loadData = async () => {
    try {
      const [depts, cats, usersData, rolesData] = await Promise.all([
        OrgService.getDepartments(),
        OrgService.getCategories(),
        OrgService.getUsers(),
        OrgService.getRoles(),
      ])
      setDepartments(depts)
      setCategories(cats)
      setUsersList(usersData)
      setRoles(rolesData)
    } catch {
      toast.error("Failed to load administration controls.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Form Fields - User Creation & Update
  const [userCode, setUserCode] = useState("")
  const [userFirstName, setUserFirstName] = useState("")
  const [userLastName, setUserLastName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [userDesignation, setUserDesignation] = useState("")
  const [userDept, setUserDept] = useState("")
  const [userRoleId, setUserRoleId] = useState("employee")
  const [userStatus, setUserStatus] = useState<"active" | "inactive" | "suspended">("active")

  // Form Fields - Department
  const [deptName, setDeptName] = useState("")
  const [deptHead, setDeptHead] = useState("")
  const [deptParent, setDeptParent] = useState("")
  const [deptStatus, setDeptStatus] = useState<"active" | "inactive">("active")

  // Form Fields - Category
  const [catName, setCatName] = useState("")
  const [catFields, setCatFields] = useState<CategoryField[]>([])
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "boolean">("text")
  const [newFieldReq, setNewFieldReq] = useState(false)

  // Open creation drawers
  const handleCreateNewUser = () => {
    setEditingEntity({ type: "user" })
    setUserCode("")
    setUserFirstName("")
    setUserLastName("")
    setUserEmail("")
    setUserPhone("")
    setUserPassword("")
    setUserDesignation("")
    setUserDept(departments[0]?.id || "")
    setUserRoleId("employee")
    setUserStatus("active")
    setDrawerOpen(true)
  }

  const handleCreateNewDept = () => {
    setEditingEntity({ type: "department" })
    setDeptName("")
    setDeptHead(usersList[0]?.id || "")
    setDeptParent("")
    setDeptStatus("active")
    setDrawerOpen(true)
  }

  const handleCreateNewCat = () => {
    setEditingEntity({ type: "category" })
    setCatName("")
    setCatFields([])
    setNewFieldName("")
    setNewFieldType("text")
    setNewFieldReq(false)
    setDrawerOpen(true)
  }

  // Open editing drawers
  const handleEdit = (type: "department" | "category" | "user", data: any) => {
    setEditingEntity({ type, data })
    if (type === "department") {
      setDeptName(data.name)
      setDeptHead(data.managerId || "")
      setDeptParent(data.parentId || "")
      setDeptStatus(data.status)
    } else if (type === "category") {
      setCatName(data.name)
      setCatFields(data.fields || [])
      setNewFieldName("")
    } else if (type === "user") {
      setUserCode(data.employeeCode || "")
      setUserFirstName(data.firstName)
      setUserLastName(data.lastName)
      setUserEmail(data.email)
      setUserPhone(data.phone || "")
      setUserPassword("")
      setUserDesignation(data.designation || "")
      setUserDept(data.departmentId || "")
      setUserRoleId(data.roleId)
      setUserStatus(data.status)
    }
    setDrawerOpen(true)
  }

  // Open password reset
  const handleOpenPasswordReset = (usr: User) => {
    setResetTargetUser(usr)
    setNewPassword("")
    setResetPasswordOpen(true)
  }

  // Add field to Category schema
  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("Attribute name cannot be empty.")
      return
    }
    if (catFields.some((f) => f.name.toLowerCase() === newFieldName.trim().toLowerCase())) {
      toast.error("Attribute already exists.")
      return
    }
    setCatFields([...catFields, { name: newFieldName.trim(), type: newFieldType, required: newFieldReq }])
    setNewFieldName("")
    setNewFieldReq(false)
  }

  const handleRemoveField = (idx: number) => {
    setCatFields(catFields.filter((_, i) => i !== idx))
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingEntity?.type === "user") {
        if (!userFirstName.trim() || !userLastName.trim()) throw new Error("First and Last name are required.")
        if (!userEmail.trim()) throw new Error("Email address is required.")

        if (editingEntity.data) {
          // Edit
          await OrgService.updateUser(
            editingEntity.data.id,
            {
              firstName: userFirstName.trim(),
              lastName: userLastName.trim(),
              phone: userPhone.trim() || undefined,
              departmentId: userDept || undefined,
              designation: userDesignation.trim() || undefined,
              roleId: userRoleId,
              status: userStatus,
            },
            user.id,
            user.fullName
          )
          toast.success("User profile details updated.")
        } else {
          // Create
          await OrgService.createUser(
            {
              employeeCode: userCode.trim() || undefined,
              firstName: userFirstName.trim(),
              lastName: userLastName.trim(),
              email: userEmail.trim(),
              phone: userPhone.trim() || undefined,
              password: userPassword || undefined,
              departmentId: userDept || undefined,
              designation: userDesignation.trim() || undefined,
              roleId: userRoleId,
            },
            user.id,
            user.fullName
          )
          toast.success("User profile created successfully.")
        }
      } else if (editingEntity?.type === "department") {
        if (!deptName.trim()) throw new Error("Department name is required.")
        
        if (editingEntity.data) {
          await OrgService.updateDepartment(
            editingEntity.data.id,
            { name: deptName.trim(), managerId: deptHead || undefined, parentId: deptParent || undefined, status: deptStatus },
            user.id,
            user.fullName
          )
          toast.success("Department details updated.")
        } else {
          await OrgService.createDepartment(
            { name: deptName.trim(), managerId: deptHead || undefined, parentId: deptParent || undefined, status: deptStatus },
            user.id,
            user.fullName
          )
          toast.success("Department registered.")
        }
      } else if (editingEntity?.type === "category") {
        if (!catName.trim()) throw new Error("Category name is required.")

        if (editingEntity.data) {
          await OrgService.updateCategory(
            editingEntity.data.id,
            { name: catName.trim(), fields: catFields },
            user.id,
            user.fullName
          )
          toast.success("Asset category attributes updated.")
        } else {
          await OrgService.createCategory(
            { name: catName.trim(), fields: catFields },
            user.id,
            user.fullName
          )
          toast.success("Asset category registered.")
        }
      }

      setDrawerOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration.")
    }
  }

  // Handle password reset submit
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !resetTargetUser) return

    try {
      if (!newPassword.trim()) throw new Error("Please enter a new password.")
      await OrgService.resetUserPassword(resetTargetUser.id, newPassword, user.id, user.fullName)
      toast.success(`Password for ${resetTargetUser.fullName} has been updated.`)
      setResetPasswordOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.")
    }
  }

  // Table Column Definitions
  const userColumns: Column<User>[] = [
    { header: "Code", accessor: "employeeCode", sortable: true },
    { header: "Full Name", accessor: "fullName", sortable: true },
    { header: "Email", accessor: "email", sortable: true },
    {
      header: "Department",
      accessor: (usr) => departments.find((d) => d.id === usr.departmentId)?.name || <span className="text-muted-foreground italic">Unassigned</span>,
    },
    { header: "Designation", accessor: "designation" },
    {
      header: "Security Role",
      accessor: (usr) => {
        const found = roles.find((r) => r.id === usr.roleId)
        return found ? found.name : usr.roleId
      },
    },
    {
      header: "Status",
      accessor: (usr) => {
        let variant: "default" | "success" | "warning" | "destructive" | "secondary" = "secondary"
        if (usr.status === "active") variant = "success"
        else if (usr.status === "suspended") variant = "destructive"
        return <Badge variant={variant}>{usr.status.toUpperCase()}</Badge>
      },
    },
    {
      header: "Actions",
      accessor: (usr) => (
        <div className="flex gap-1.5 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleEdit("user", usr)} className="h-7 text-xs px-2 cursor-pointer">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenPasswordReset(usr)} className="h-7 text-xs px-2 text-amber-500 hover:text-amber-600 cursor-pointer">
            <Key className="h-3.5 w-3.5 mr-1" /> Reset Creds
          </Button>
        </div>
      ),
    },
  ]

  const deptColumns: Column<Department>[] = [
    { header: "Name", accessor: "name", sortable: true },
    {
      header: "Department Head",
      accessor: (d) => usersList.find((u) => u.id === d.managerId)?.fullName || <span className="text-muted-foreground italic">None Assigned</span>,
    },
    {
      header: "Parent Department",
      accessor: (d) => departments.find((dept) => dept.id === d.parentId)?.name || <span className="text-muted-foreground italic">Root Level</span>,
    },
    {
      header: "Status",
      accessor: (d) => (
        <Badge variant={d.status === "active" ? "success" : "secondary"}>
          {d.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (d) => (
        <Button variant="ghost" size="sm" onClick={() => handleEdit("department", d)} className="h-7 text-xs px-2 cursor-pointer">
          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      ),
    },
  ]

  const catColumns: Column<AssetCategory>[] = [
    { header: "Name", accessor: "name", sortable: true },
    {
      header: "Custom Attributes",
      accessor: (c) =>
        c.fields.length === 0 ? (
          <span className="text-muted-foreground italic text-[11px]">No custom fields</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {c.fields.map((f, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/80 border border-border/40 font-medium">
                {f.name} ({f.type})
              </span>
            ))}
          </div>
        ),
    },
    {
      header: "Actions",
      accessor: (c) => (
        <Button variant="ghost" size="sm" onClick={() => handleEdit("category", c)} className="h-7 text-xs px-2 cursor-pointer">
          <Edit className="h-3.5 w-3.5 mr-1" /> Custom Fields
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-sans">Enterprise Settings</h2>
          <p className="text-xs text-muted-foreground">
            Manage organization hierarchy, configure directory templates, and adjust unified user profiles.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2.5">
          <TabsList className="bg-secondary/40 border border-border/50">
            <TabsTrigger value="users" className="text-xs flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Users & RBAC
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-xs flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Department Structure
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Asset Specifications
            </TabsTrigger>
          </TabsList>

          <div>
            {activeTab === "users" && (
              <PermissionGuard permissions={["user.manage"]}>
                <Button size="sm" onClick={handleCreateNewUser} className="text-xs h-8 cursor-pointer">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add User Profile
                </Button>
              </PermissionGuard>
            )}
            {activeTab === "departments" && (
              <PermissionGuard permissions={["organization.manage"]}>
                <Button size="sm" onClick={handleCreateNewDept} className="text-xs h-8 cursor-pointer">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Department
                </Button>
              </PermissionGuard>
            )}
            {activeTab === "categories" && (
              <PermissionGuard permissions={["organization.manage"]}>
                <Button size="sm" onClick={handleCreateNewCat} className="text-xs h-8 cursor-pointer">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Asset Category
                </Button>
              </PermissionGuard>
            )}
          </div>
        </div>

        {/* Tab 1: Users & RBAC */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Unified User Accounts Log
              </CardTitle>
              <CardDescription className="text-xs">
                Administrate system login accounts, assign designated roles, and allocate security policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={usersList}
                columns={userColumns}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Departments */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Organizational Departments</CardTitle>
              <CardDescription className="text-xs">
                Configure corporate groups, manager boundaries, and parent department nodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={departments}
                columns={deptColumns}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Asset Categories */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Directory Template Fields</CardTitle>
              <CardDescription className="text-xs">
                Define the asset specifications schema. Define unique attributes enforced when registering inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={categories}
                columns={catColumns}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Main Drawer: Unified Create / Edit Form */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          editingEntity?.data
            ? `Modify ${editingEntity.type === "user" ? "User Profile" : editingEntity.type === "department" ? "Department Node" : "Asset Category"}`
            : `Create New ${editingEntity?.type === "user" ? "User Account" : editingEntity?.type === "department" ? "Department Node" : "Asset Category"}`
        }
        description="Verify constraints before completing registry edits."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} className="text-xs h-8 cursor-pointer">
              Save Configuration
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* USER FORM */}
          {editingEntity?.type === "user" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">First Name</label>
                  <Input value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} placeholder="Sarah" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Last Name</label>
                  <Input value={userLastName} onChange={(e) => setUserLastName(e.target.value)} placeholder="Connor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Email Address</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    disabled={!!editingEntity.data}
                    placeholder="email@assetflow.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Phone Number</label>
                  <Input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="1-800-..." />
                </div>
              </div>

              {!editingEntity.data && (
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Initial Login Password</label>
                  <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Employee Code</label>
                  <Input value={userCode} onChange={(e) => setUserCode(e.target.value)} placeholder="AF-EMP-XX" disabled={!!editingEntity.data} />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Designation / Job Title</label>
                  <Input value={userDesignation} onChange={(e) => setUserDesignation(e.target.value)} placeholder="Security Specialist" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Department</label>
                  <Select value={userDept} onChange={(e) => setUserDept(e.target.value)}>
                    <option value="">No Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Access Role (RBAC)</label>
                  <Select value={userRoleId} onChange={(e) => setUserRoleId(e.target.value)}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {editingEntity.data && (
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Account Lifecycle Status</label>
                  <Select value={userStatus} onChange={(e) => setUserStatus(e.target.value as any)}>
                    <option value="active">Active - Login Permitted</option>
                    <option value="inactive">Inactive - Profile Suspended</option>
                    <option value="suspended">Suspended - Locked Out</option>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* DEPARTMENT FORM */}
          {editingEntity?.type === "department" && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Department Name</label>
                <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Quality Operations" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Department Head</label>
                  <Select value={deptHead} onChange={(e) => setDeptHead(e.target.value)}>
                    <option value="">No manager assigned</option>
                    {usersList.map((usr) => (
                      <option key={usr.id} value={usr.id}>{usr.fullName}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[10px]">Parent Department</label>
                  <Select value={deptParent} onChange={(e) => setDeptParent(e.target.value)}>
                    <option value="">Root Level Node</option>
                    {departments
                      .filter((d) => d.id !== editingEntity.data?.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Status</label>
                <Select value={deptStatus} onChange={(e) => setDeptStatus(e.target.value as any)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </>
          )}

          {/* CATEGORY FORM */}
          {editingEntity?.type === "category" && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Category Name</label>
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Lab Sensors" />
              </div>

              {/* Dynamic schema setup */}
              <div className="border-t border-border/40 pt-3 space-y-3">
                <h4 className="font-bold text-[10px] uppercase text-muted-foreground">Category Specification Fields</h4>
                
                {/* Current schema list */}
                {catFields.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No unique schema fields added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {catFields.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-secondary/35 border border-border/50">
                        <div>
                          <span className="font-semibold text-foreground/90">{f.name}</span>
                          <span className="text-[9px] text-muted-foreground ml-2">({f.type}) {f.required && "• Required"}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveField(idx)} className="h-6 text-xs text-destructive hover:bg-destructive/10 px-2.5">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new field to schema */}
                <div className="bg-secondary/25 border border-border/50 rounded-lg p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[9px] uppercase text-muted-foreground">New Attribute Name</label>
                    <Input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="e.g. Firmware Version" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="font-bold text-[9px] uppercase text-muted-foreground">Attribute Type</label>
                      <Select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)}>
                        <option value="text">Alphanumeric Text</option>
                        <option value="number">Numeric Value</option>
                        <option value="boolean">Yes/No Boolean</option>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5 h-9 mb-0.5">
                      <input
                        type="checkbox"
                        id="newFieldReq"
                        checked={newFieldReq}
                        onChange={(e) => setNewFieldReq(e.target.checked)}
                        className="h-4 w-4 border-border rounded"
                      />
                      <label htmlFor="newFieldReq" className="font-semibold text-muted-foreground text-[10px] select-none">
                        Mandatory
                      </label>
                    </div>
                  </div>

                  <Button type="button" onClick={handleAddField} size="sm" className="w-full">
                    Add Attribute Parameter
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </Drawer>

      {/* Password Reset Modal Drawer */}
      <Drawer
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        title="Reset User Credentials"
        description={resetTargetUser ? `Type a new login credentials password for: ${resetTargetUser.fullName}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setResetPasswordOpen(false)} className="text-xs h-8 cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handlePasswordResetSubmit} className="text-xs h-8 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white">
              <Key className="h-3.5 w-3.5 mr-1" /> Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg flex gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              This action will reset the credentials mapping for this user. They must immediately log in using their new credentials.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">New Password String</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters recommended"
              className="text-xs"
            />
          </div>
        </form>
      </Drawer>
    </div>
  )
}
