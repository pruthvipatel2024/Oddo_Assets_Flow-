import api from "./api"
import type { Department, AssetCategory, User } from "@/types/organization"
import type { Role } from "@/types/auth"

export const OrgService = {
  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await api.get("/org/departments")
    return response.data
  },
  
  async createDepartment(dept: Omit<Department, "id">, operatorId: string, operatorName: string): Promise<Department> {
    const response = await api.post("/org/departments", {
      ...dept,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async updateDepartment(id: string, updates: Partial<Department>, operatorId: string, operatorName: string): Promise<Department> {
    const response = await api.put(`/org/departments/${id}`, {
      ...updates,
      operatorId,
      operatorName,
    })
    return response.data
  },

  // Categories
  async getCategories(): Promise<AssetCategory[]> {
    const response = await api.get("/org/categories")
    return response.data
  },

  async createCategory(cat: Omit<AssetCategory, "id">, operatorId: string, operatorName: string): Promise<AssetCategory> {
    const response = await api.post("/org/categories", {
      ...cat,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async updateCategory(id: string, updates: Partial<AssetCategory>, operatorId: string, operatorName: string): Promise<AssetCategory> {
    const response = await api.put(`/org/categories/${id}`, {
      ...updates,
      operatorId,
      operatorName,
    })
    return response.data
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await api.get("/org/users")
    return response.data
  },

  async createUser(user: Partial<User> & { password?: string }, operatorId: string, operatorName: string): Promise<User> {
    const response = await api.post("/org/users", {
      ...user,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async updateUser(id: string, updates: Partial<User>, operatorId: string, operatorName: string): Promise<User> {
    const response = await api.put(`/org/users/${id}`, {
      ...updates,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async resetUserPassword(id: string, passwordStr: string, operatorId: string, operatorName: string): Promise<any> {
    const response = await api.post(`/org/users/${id}/reset-password`, {
      password: passwordStr,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async getRoles(): Promise<Role[]> {
    const response = await api.get("/org/roles")
    return response.data
  },
}
