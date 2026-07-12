import api from "./api"
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from "@/types/maintenance"

export const MaintenanceService = {
  async getRequests(): Promise<MaintenanceRequest[]> {
    const response = await api.get("/maintenance")
    return response.data
  },

  async raiseRequest(
    assetTag: string,
    employeeId: string,
    description: string,
    priority: MaintenancePriority,
    operatorId: string,
    operatorName: string
  ): Promise<MaintenanceRequest> {
    const response = await api.post("/maintenance", {
      assetTag,
      employeeId,
      description,
      priority,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async updateRequestStatus(
    requestId: string,
    status: MaintenanceStatus,
    fields: { technicianName?: string; notes?: string; newCondition?: any },
    operatorId: string,
    operatorName: string
  ): Promise<void> {
    if (status === "In Progress" || status === "Approved") {
      await api.post(`/maintenance/${requestId}/assign`, {
        technicianName: fields.technicianName || "Assigned Technician",
        notes: fields.notes || "",
        operatorId,
        operatorName,
      })
    } else if (status === "Resolved") {
      await api.post(`/maintenance/${requestId}/resolve`, {
        notes: fields.notes || "",
        newCondition: fields.newCondition || "good",
        operatorId,
        operatorName,
      })
    }
  },
}
