import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { ModulePlaceholder } from "@/pages/ModulePlaceholder"

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
        
        <Route
          path="reports"
          element={
            <ModulePlaceholder
              title="Analytics & Reports"
              description="Analyze organization inventory value, depreciation, and custom asset reports."
              moduleName="reports"
            />
          }
        />
        <Route
          path="assets"
          element={
            <ModulePlaceholder
              title="Asset Directory"
              description="View, register, and update company items, devices, and licenses."
              moduleName="assets"
            />
          }
        />
        <Route
          path="maintenance"
          element={
            <ModulePlaceholder
              title="Maintenance & Repairs"
              description="Log issues, assign technicians, and track active repair tickets."
              moduleName="maintenance"
            />
          }
        />
        <Route
          path="bookings"
          element={
            <ModulePlaceholder
              title="Resource Bookings"
              description="Schedule meeting rooms, select test devices, and resolve reservation conflicts."
              moduleName="bookings"
            />
          }
        />
        <Route
          path="organization"
          element={
            <ModulePlaceholder
              title="Departments & Directory"
              description="Define corporate hierarchy trees and assign employee resource budgets."
              moduleName="organization"
            />
          }
        />
        <Route
          path="audits"
          element={
            <ModulePlaceholder
              title="Auditing & Compliance"
              description="Schedule cycle audits, reconcile item balances, and generate discrepancy sheets."
              moduleName="audits"
            />
          }
        />
        <Route
          path="settings"
          element={
            <ModulePlaceholder
              title="System Config & Settings"
              description="Manage workspaces, integrations, webhook triggers, and custom role permissions."
              moduleName="settings"
            />
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
