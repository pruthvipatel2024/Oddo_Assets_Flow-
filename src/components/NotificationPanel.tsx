import { useState } from "react"
import { Check, Inbox, MessageSquare, AlertCircle, Wrench, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/utils/cn"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: "maintenance" | "approval" | "audit" | "system"
  read: boolean
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "not_1",
      title: "Maintenance Scheduled",
      description: "Critical firmware update for Server-Rack 4B scheduled for tonight at 23:00.",
      time: "10m ago",
      type: "maintenance",
      read: false,
    },
    {
      id: "not_2",
      title: "Asset Approval Required",
      description: "Bruce Wayne requested allocation of 'High-Performance GPU Node (AF-902)'.",
      time: "1h ago",
      type: "approval",
      read: false,
    },
    {
      id: "not_3",
      title: "Audit Discrepancy Flagged",
      description: "IT hardware audit flagged 'Dell XPS Laptop (AF-043)' as missing from Department HQ.",
      time: "4h ago",
      type: "audit",
      read: true,
    },
    {
      id: "not_4",
      title: "System Update Complete",
      description: "AssetFlow database backup finished successfully (Size: 12.4GB).",
      time: "1d ago",
      type: "system",
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4 text-amber-500" />
      case "approval":
        return <MessageSquare className="h-4 w-4 text-primary" />
      case "audit":
        return <ShieldAlert className="h-4 w-4 text-destructive" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!open) return null

  return (
    <>
      {/* Background click listener to close popover */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden divide-y divide-border/60 animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="px-1.5 py-0.5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Check className="h-3. w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
              <Inbox className="h-8 w-8 stroke-1 mb-2" />
              <p className="text-xs">All caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "p-4 hover:bg-muted/30 transition-colors flex gap-3 cursor-pointer items-start relative",
                  !n.read && "bg-primary/[0.02]"
                )}
              >
                {!n.read && (
                  <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                )}
                <div className="p-2 rounded-md bg-secondary/80 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <h4 className={cn("text-xs font-semibold text-foreground/90", !n.read && "font-bold")}>
                    {n.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.description}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 block">
                    {n.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
