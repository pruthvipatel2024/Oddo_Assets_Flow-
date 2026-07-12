import React from "react"
import { Search, Monitor, Moon, Sun, ArrowRight, Laptop, Calendar, ShieldCheck, Database, Building2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/Dialog"
import { useTheme } from "@/contexts/ThemeContext"
import { useNavigate } from "react-router-dom"

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [search, setSearch] = React.useState("")

  const items = [
    {
      category: "Navigation",
      list: [
        { name: "Go to Dashboard", icon: Laptop, action: () => navigate("/dashboard") },
        { name: "Asset Directory", icon: Database, action: () => navigate("/assets") },
        { name: "Departments & Hierarchy", icon: Building2, action: () => navigate("/organization") },
        { name: "Resource Calendar", icon: Calendar, action: () => navigate("/bookings") },
        { name: "Maintenance Board", icon: ShieldCheck, action: () => navigate("/maintenance") },
      ],
    },
    {
      category: "Theme Settings",
      list: [
        { name: "Switch to Light Mode", icon: Sun, action: () => setTheme("light") },
        { name: "Switch to Dark Mode", icon: Moon, action: () => setTheme("dark") },
        { name: "Switch to System Mode", icon: Monitor, action: () => setTheme("system") },
      ],
    },
  ]

  const filteredItems = items
    .map((group) => ({
      ...group,
      list: group.list.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.list.length > 0)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border-border/80" onClose={onClose}>
        <div className="flex items-center border-b border-border/50 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search modules..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-[350px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No commands or pages found matching your search.
            </div>
          ) : (
            filteredItems.map((group) => (
              <div key={group.category} className="mb-2">
                <h3 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </h3>
                <div className="space-y-0.5">
                  {group.list.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          item.action()
                          onClose()
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground/80 hover:text-foreground rounded-md hover:bg-secondary/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span>{item.name}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-all -translate-x-1 group-hover:translate-x-0" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-muted/40 border-t border-border/50 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Use <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/80 font-mono text-[10px]">Tab</kbd> to select and <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/80 font-mono text-[10px]">Enter</kbd> to execute
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/80 font-mono text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
