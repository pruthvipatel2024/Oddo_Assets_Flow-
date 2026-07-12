export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "maintenance" | "approval" | "audit" | "system"
  read: boolean
  timestamp: string
}
