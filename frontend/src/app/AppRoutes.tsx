import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { AssetDirectoryPage } from "@/pages/AssetDirectoryPage"
import { AssetAllocationPage } from "@/pages/AssetAllocationPage"
import { ResourceBookingPage } from "@/pages/ResourceBookingPage"
import { MaintenancePage } from "@/pages/MaintenancePage"
import { UserManagementPage } from "@/pages/UserManagementPage"
import { AuditPage } from "@/pages/AuditPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { PermissionGuard } from "@/components/ui/PermissionGuard"

// Route protection guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected ERP Workspace Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirect root to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Feature Modules */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={
          <PermissionGuard permission="report.export">
            <ReportsPage />
          </PermissionGuard>
        } />
        <Route path="assets" element={<AssetDirectoryPage />} />
        <Route path="allocations" element={
          <PermissionGuard permission="asset.allocate">
            <AssetAllocationPage />
          </PermissionGuard>
        } />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="bookings" element={<ResourceBookingPage />} />
        <Route path="organization" element={
          <PermissionGuard permission="organization.manage">
            <UserManagementPage />
          </PermissionGuard>
        } />
        <Route path="audits" element={
          <PermissionGuard permission="audit.create">
            <AuditPage />
          </PermissionGuard>
        } />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
