import api from "./api"
import type { Notification } from "@/types/logs"

export const NotificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const response = await api.get(`/notifications/${userId}`)
    return response.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async send(_userId: string, _title: string, _message: string, _type: "maintenance" | "approval" | "audit" | "system"): Promise<void> {
    // Backend automatically creates notifications. Signature is preserved.
    return Promise.resolve()
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId)
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) => this.markAsRead(n.id))
    )
  },
}
