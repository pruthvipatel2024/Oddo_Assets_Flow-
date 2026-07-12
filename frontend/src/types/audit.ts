export type AuditCycleStatus = "Active" | "Closed"

export type AuditResult = "Verified" | "Missing" | "Damaged"

export interface AuditCycle {
  id: string
  name: string
  scopeDepartmentId?: string // If empty, all departments
  scopeLocation?: string     // If empty, all locations
  startDate: string
  endDate: string
  auditorIds: string[]       // Employee IDs assigned to audit
  status: AuditCycleStatus
  results: Record<string, AuditResult> // assetTag -> status
  notes?: string
}
