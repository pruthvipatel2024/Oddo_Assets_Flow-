export type Permission =
  | "asset.create"
  | "asset.update"
  | "asset.delete"
  | "asset.allocate"
  | "asset.transfer"
  | "booking.create"
  | "booking.approve"
  | "maintenance.approve"
  | "audit.create"
  | "audit.close"
  | "report.export"
  | "user.manage"
  | "role.manage"
  | "organization.manage"

export interface Role {
  id: string
  name: string
  permissions: Permission[]
}

// Preset roles in the system
export const SYSTEM_ROLES: Role[] = [
  {
    id: "sys_admin",
    name: "System Admin",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "booking.approve", "maintenance.approve",
      "audit.create", "audit.close", "report.export", "user.manage", "role.manage", "organization.manage"
    ]
  },
  {
    id: "org_admin",
    name: "Organization Admin",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "booking.approve", "maintenance.approve",
      "audit.create", "audit.close", "report.export", "user.manage", "role.manage", "organization.manage"
    ]
  },
  {
    id: "asset_manager",
    name: "Asset Manager",
    permissions: [
      "asset.create", "asset.update", "asset.delete", "asset.allocate", "asset.transfer",
      "booking.create", "maintenance.approve", "audit.create", "audit.close", "report.export"
    ]
  },
  {
    id: "dept_head",
    name: "Department Head",
    permissions: [
      "asset.transfer", "booking.create", "booking.approve", "report.export"
    ]
  },
  {
    id: "employee",
    name: "Employee",
    permissions: [
      "booking.create"
    ]
  }
]

export function hasPermission(roleId: string, permission: Permission): boolean {
  const role = SYSTEM_ROLES.find((r) => r.id === roleId)
  return role ? role.permissions.includes(permission) : false
}
