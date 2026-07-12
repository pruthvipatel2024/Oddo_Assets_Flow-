export interface Department {
  id: string
  name: string
  managerId?: string
  parentId?: string
  status: "active" | "inactive"
}

export interface CategoryField {
  name: string
  type: "text" | "number" | "boolean"
  required: boolean
}

export interface AssetCategory {
  id: string
  name: string
  fields: CategoryField[]
}

// Unified User model replacing Employee
export interface User {
  id: string
  employeeCode?: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  avatar?: string
  departmentId?: string
  designation?: string
  roleId: string
  status: "active" | "inactive" | "suspended"
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}
