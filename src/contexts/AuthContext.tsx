import React, { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "admin" | "manager" | "employee"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  department?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, role: UserRole) => Promise<boolean>
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

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    let name = "Alex Mercer"
    let department = "Operations"
    if (role === "admin") {
      name = "Sarah Connor"
      department = "IT Infrastructure"
    } else if (role === "manager") {
      name = "Bruce Wayne"
      department = "Facilities & Logistics"
    }

    const mockUser: User = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      department,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
    }

    setUser(mockUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser))
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    user,
    login,
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
