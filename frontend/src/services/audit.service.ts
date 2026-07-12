import api from "./api"
import type { AuditCycle, AuditResult } from "@/types/audit"

export const AuditService = {
  async getCycles(): Promise<AuditCycle[]> {
    const response = await api.get("/audits")
    return response.data
  },

  async createCycle(
    name: string,
    scopeDepartmentId: string | undefined,
    scopeLocation: string | undefined,
    startDate: string,
    endDate: string,
    auditorIds: string[],
    notes: string | undefined,
    operatorId: string,
    operatorName: string
  ): Promise<AuditCycle> {
    const response = await api.post("/audits", {
      name,
      scopeDepartmentId,
      scopeLocation,
      startDate,
      endDate,
      auditorIds,
      notes,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async recordResult(
    cycleId: string,
    assetTag: string,
    result: AuditResult,
    operatorId: string,
    operatorName: string
  ): Promise<void> {
    await api.post(`/audits/${cycleId}/record`, {
      assetTag,
      result,
      operatorId,
      operatorName,
    })
  },

  async closeCycle(cycleId: string, operatorId: string, operatorName: string): Promise<void> {
    await api.post(`/audits/${cycleId}/close`, {
      operatorId,
      operatorName,
    })
  },
}
