export type BookingStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled"

export interface ResourceBooking {
  id: string
  assetTag: string
  employeeId: string
  departmentId?: string
  startTime: string
  endTime: string
  status: BookingStatus
  notes?: string
}
