import api from "./api"
import type { ActivityLog } from "@/types/logs"

export const ActivityLogger = {
  async getLogs(): Promise<ActivityLog[]> {
    const response = await api.get("/logs")
    return response.data.sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  },

  async log(_action: string, _details: string, _userId: string, _userName: string): Promise<void> {
    // Backend automatically registers logging. Keep function signature to avoid refactoring UI component invocations.
    return Promise.resolve()
  },
}
