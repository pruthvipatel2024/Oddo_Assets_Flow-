import api from "./api"
import type { ResourceBooking } from "@/types/booking"

export const BookingService = {
  async getBookings(): Promise<ResourceBooking[]> {
    const response = await api.get("/bookings")
    return response.data
  },

  async hasOverlap(assetTag: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    const bookings = await this.getBookings()
    const startMs = new Date(startTime).getTime()
    const endMs = new Date(endTime).getTime()

    return bookings.some((b) => {
      if (b.assetTag !== assetTag) return false
      if (b.status === "Cancelled") return false
      if (excludeId && b.id === excludeId) return false

      const bStartMs = new Date(b.startTime).getTime()
      const bEndMs = new Date(b.endTime).getTime()

      return startMs < bEndMs && endMs > bStartMs
    })
  },

  async createBooking(
    assetTag: string,
    employeeId: string,
    departmentId: string | undefined,
    startTime: string,
    endTime: string,
    notes: string | undefined,
    operatorId: string,
    operatorName: string
  ): Promise<ResourceBooking> {
    try {
      const response = await api.post("/bookings", {
        assetTag,
        employeeId,
        departmentId,
        startTime,
        endTime,
        notes,
        operatorId,
        operatorName,
      })
      return response.data
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Overlap conflict detected.")
    }
  },

  async cancelBooking(bookingId: string, operatorId: string, operatorName: string): Promise<void> {
    await api.post(`/bookings/${bookingId}/cancel`, {
      operatorId,
      operatorName,
    })
  },
}
