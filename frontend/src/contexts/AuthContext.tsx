import React, { createContext, useContext, useState, useEffect } from "react"
import api from "@/services/api"
import type { User } from "@/types/organization"

interface AuthContextType {
  user: User | null
  login: (email: string, password?: string) => Promise<boolean>
  signup: (name: string, email: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "assetflow-user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse saved user", e)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", { email, password })
      const match = response.data

      const loggedUser: User = {
        id: match.id,
        employeeCode: match.employeeCode,
        firstName: match.firstName,
        lastName: match.lastName,
        fullName: match.fullName,
        email: match.email,
        phone: match.phone,
        avatar: match.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${match.firstName}`,
        departmentId: match.departmentId,
        designation: match.designation,
        roleId: match.roleId,
        status: match.status,
        lastLogin: match.lastLogin,
      }

      setUser(loggedUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))
      setIsLoading(false)
      return true
    } catch (err: any) {
      setIsLoading(false)
      throw new Error(err.response?.data?.message || "Failed to log in.")
    }
  }

  const signup = async (name: string, email: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await api.post("/auth/signup", { name, email })
      setIsLoading(false)
      return true
    } catch (err: any) {
      setIsLoading(false)
      throw new Error(err.response?.data?.message || "Failed to sign up.")
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      await api.post("/auth/forgot-password", { email })
      return true
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Email address not found.")
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    user,
    login,
    signup,
    forgotPassword,
    logout,
    isAuthenticated: !!user,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
