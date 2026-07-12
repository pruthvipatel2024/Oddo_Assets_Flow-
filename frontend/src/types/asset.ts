export type AssetCondition = "new" | "good" | "fair" | "poor"

export type AssetStatus =
  | "Available"
  | "Allocated"
  | "Reserved"
  | "Under Maintenance"
  | "Lost"
  | "Retired"
  | "Disposed"

export interface Asset {
  tag: string // e.g. AF-0001
  name: string
  categoryId: string
  serialNumber: string
  acquisitionDate: string
  acquisitionCost: number
  condition: AssetCondition
  location: string
  sharedFlag: boolean // If true, is bookable by slot. If false, exclusively allocated.
  status: AssetStatus
  customFields: Record<string, any>
  assignedToUserId?: string
}

export interface AssetHistoryEntry {
  id: string
  assetTag: string
  date: string
  type: "registration" | "allocation" | "return" | "transfer" | "maintenance" | "audit" | "booking"
  details: string
  performedBy: string // User's name
}

export interface AssetAllocation {
  id: string
  assetTag: string
  userId?: string
  departmentId?: string
  allocatedAt: string
  expectedReturnDate?: string
  returnedAt?: string
  returnConditionNotes?: string
  status: "active" | "returned"
}

export interface TransferRequest {
  id: string
  assetTag: string
  fromUserId?: string
  toUserId: string
  departmentId?: string
  status: "Pending" | "Approved" | "Rejected"
  requestedAt: string
  requestedByUserId: string
  approvedByUserId?: string
}
