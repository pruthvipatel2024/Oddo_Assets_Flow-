export type MaintenancePriority = "low" | "medium" | "high"

export type MaintenanceStatus = "Pending" | "Approved" | "Rejected" | "In Progress" | "Resolved"

export interface MaintenanceRequest {
  id: string
  assetTag: string
  employeeId: string // Person who raised the request
  description: string
  priority: MaintenancePriority
  technicianName?: string
  status: MaintenanceStatus
  notes?: string
  createdAt: string
  updatedAt: string
}
