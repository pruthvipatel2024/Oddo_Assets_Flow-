import api from "./api"
import type { Asset, AssetHistoryEntry, AssetAllocation, TransferRequest, AssetCondition } from "@/types/asset"

export const AssetService = {
  async getAssets(): Promise<Asset[]> {
    const response = await api.get("/assets")
    return response.data
  },

  async getAsset(tag: string): Promise<Asset | undefined> {
    const assets = await this.getAssets()
    return assets.find((a) => a.tag === tag)
  },

  async registerAsset(asset: Omit<Asset, "tag">, operatorId: string, operatorName: string): Promise<Asset> {
    const response = await api.post("/assets", {
      ...asset,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async updateAsset(tag: string, updates: Partial<Asset>, operatorId: string, operatorName: string): Promise<Asset> {
    const response = await api.put(`/assets/${tag}`, {
      ...updates,
      operatorId,
      operatorName,
    })
    return response.data
  },

  // History entries
  async getAssetHistory(tag: string): Promise<AssetHistoryEntry[]> {
    const response = await api.get(`/assets/${tag}/history`)
    return response.data
  },

  async addAssetHistory(_tag: string, _type: any, _details: string, _performedBy: string): Promise<void> {
    // Backend registers histories. Signature is kept.
    return Promise.resolve()
  },

  // Allocations
  async getAllocations(): Promise<AssetAllocation[]> {
    const response = await api.get("/allocations")
    return response.data
  },

  async getActiveAllocation(tag: string): Promise<AssetAllocation | undefined> {
    const allocations = await this.getAllocations()
    return allocations.find((a) => a.assetTag === tag && a.status === "active")
  },

  async allocateAsset(
    assetTag: string,
    employeeId: string | undefined,
    departmentId: string | undefined,
    expectedReturnDate: string | undefined,
    operatorId: string,
    operatorName: string
  ): Promise<AssetAllocation> {
    const response = await api.post("/allocations", {
      assetTag,
      employeeId,
      departmentId,
      expectedReturnDate,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async returnAsset(
    assetTag: string,
    conditionNotes: string,
    newCondition: AssetCondition,
    operatorId: string,
    operatorName: string
  ): Promise<void> {
    await api.post("/allocations/return", {
      assetTag,
      returnConditionNotes: conditionNotes,
      newCondition,
      operatorId,
      operatorName,
    })
  },

  // Transfers
  async getTransferRequests(): Promise<TransferRequest[]> {
    const response = await api.get("/transfers")
    return response.data
  },

  async createTransferRequest(
    assetTag: string,
    fromEmployeeId: string | undefined,
    toEmployeeId: string,
    departmentId: string | undefined,
    operatorId: string,
    operatorName: string
  ): Promise<TransferRequest> {
    const response = await api.post("/transfers", {
      assetTag,
      fromEmployeeId,
      toEmployeeId,
      departmentId,
      operatorId,
      operatorName,
    })
    return response.data
  },

  async approveTransferRequest(requestId: string, operatorId: string, operatorName: string): Promise<void> {
    await api.post(`/transfers/${requestId}/approve`, {
      operatorId,
      operatorName,
    })
  },

  async rejectTransferRequest(requestId: string, operatorId: string, operatorName: string): Promise<void> {
    await api.post(`/transfers/${requestId}/reject`, {
      operatorId,
      operatorName,
    })
  },
}
