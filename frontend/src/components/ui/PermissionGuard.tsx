import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { type Permission, hasPermission } from "@/types/auth"
import { ShieldAlert } from "lucide-react"

interface PermissionGuardProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback,
  children,
}: PermissionGuardProps) {
  const { user } = useAuth()

  if (!user) {
    return <>{fallback || null}</>
  }

  const roleId = user.roleId || "employee"
  const checks: Permission[] = []

  if (permission) checks.push(permission)
  if (permissions) checks.push(...permissions)

  if (checks.length === 0) {
    return <>{children}</>
  }

  const hasAccess = requireAll
    ? checks.every((p) => hasPermission(roleId, p))
    : checks.some((p) => hasPermission(roleId, p))

  if (!hasAccess) {
    return (
      <>{fallback !== undefined ? fallback : (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border/80 bg-card/50 min-h-[300px]">
          <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">Permission Denied</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
            Your current account role does not have authorization to view this component or perform this action.
          </p>
        </div>
      )}</>
    )
  }

  return <>{children}</>
}
