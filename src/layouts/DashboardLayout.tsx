import React, { useState } from "react"
import { Outlet, Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import {
  LayoutDashboard,
  Building2,
  Database,
  CalendarRange,
  Wrench,
  ShieldCheck,
  FileBarChart2,
  Settings,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  ChevronRight,
  Menu,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { CommandPalette } from "@/components/CommandPalette"
import { NotificationPanel } from "@/components/NotificationPanel"
import { cn } from "@/utils/cn"

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true"
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [activeWorkspace, setActiveWorkspace] = useState("Corporate HQ (Primary)")
  const workspaces = [
    "Corporate HQ (Primary)",
    "Europe Logistics Hub",
    "Asia R&D Campus",
    "North America Warehouse",
  ]

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed
    setIsSidebarCollapsed(nextState)
    localStorage.setItem("sidebar-collapsed", String(nextState))
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navigation = [
    {
      group: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Analytics & Reports", href: "/reports", icon: FileBarChart2 },
      ],
    },
    {
      group: "Assets & Logistics",
      items: [
        { name: "Asset Directory", href: "/assets", icon: Database },
        { name: "Maintenance & Repair", href: "/maintenance", icon: Wrench },
        { name: "Resource Bookings", href: "/bookings", icon: CalendarRange },
      ],
    },
    {
      group: "Management",
      items: [
        { name: "Departments & Org", href: "/organization", icon: Building2 },
        { name: "Auditing & Compliance", href: "/audits", icon: ShieldCheck },
      ],
    },
    {
      group: "System",
      items: [
        { name: "Settings & Config", href: "/settings", icon: Settings },
      ],
    },
  ]

  // Breadcrumbs generation
  const pathSegments = location.pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, idx) => {
    const href = "/" + pathSegments.slice(0, idx + 1).join("/")
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ")
    return { name, href, active: idx === pathSegments.length - 1 }
  })

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      <CommandPalette open={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border/80 bg-card transition-all duration-300 relative z-30",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header/Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border/40 justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="font-bold text-primary-foreground text-sm">AF</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                AssetFlow
              </span>
            )}
          </Link>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 border-b border-border/40 relative">
          <button
            onClick={() => !isSidebarCollapsed && setIsWorkspaceOpen(!isWorkspaceOpen)}
            disabled={isSidebarCollapsed}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition-colors text-left text-xs font-semibold select-none",
              isSidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {isSidebarCollapsed ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <>
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground font-medium block uppercase tracking-wider">Workspace</span>
                  <span className="truncate block font-semibold text-foreground/90">{activeWorkspace}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </>
            )}
          </button>

          {isWorkspaceOpen && !isSidebarCollapsed && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsWorkspaceOpen(false)} />
              <div className="absolute left-3 right-3 mt-1 py-1 rounded-md border border-border bg-card shadow-lg z-40 max-h-48 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws}
                    onClick={() => {
                      setActiveWorkspace(ws)
                      setIsWorkspaceOpen(false)
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-xs text-left hover:bg-secondary/80 transition-colors",
                      activeWorkspace === ws && "font-semibold text-primary"
                    )}
                  >
                    {ws}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navigation.map((group) => (
            <div key={group.group} className="space-y-1">
              {!isSidebarCollapsed && (
                <h4 className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.group}
                </h4>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group",
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Collapse Toggle */}
        <div className="p-3 border-t border-border/40">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium">
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-4 relative z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground select-none">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">
                AssetFlow
              </Link>
              {breadcrumbs.map((bc) => (
                <React.Fragment key={bc.href}>
                  <ChevronRight className="h-3 w-3 shrink-0" />
                  <Link
                    to={bc.href}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      bc.active && "text-foreground font-medium pointer-events-none"
                    )}
                  >
                    {bc.name}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            {/* Search Box Trigger */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-secondary border border-border/30 text-xs text-muted-foreground transition-all cursor-pointer w-40 md:w-56"
            >
              <Search className="h-3.5 w-3.5 mr-1 text-muted-foreground/80" />
              <span className="text-left flex-1">Quick search...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-muted/90 border border-border/80 text-[10px] font-mono select-none">
                Ctrl+K
              </kbd>
            </button>

            {/* Theme Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={`Toggle theme (Current: ${theme})`}
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </Button>
            </div>

            {/* Notifications Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <Bell className="h-4 w-4 text-foreground/80" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <NotificationPanel
                open={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-secondary/60 transition-colors text-left cursor-pointer"
              >
                <img
                  src={user?.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                  alt={user?.name || "User"}
                  className="h-7 w-7 rounded-full border border-border/80 object-cover bg-secondary"
                />
                <span className="hidden lg:inline-block text-xs font-semibold text-foreground/80 max-w-[120px] truncate">
                  {user?.name || "Jane Connor"}
                </span>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg z-40 py-1 divide-y divide-border/60">
                    <div className="px-4 py-2.5">
                      <span className="block text-xs font-semibold text-foreground/90 truncate">{user?.name}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">{user?.email}</span>
                      <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {user?.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <User className="h-3.5 w-3.5" /> Profile Settings
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Inner Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background/50 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer (Collapsible Menu Overlay) */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col p-4 md:hidden animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <span className="font-bold text-base text-primary">AssetFlow</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto pt-4 space-y-4">
              {navigation.map((group) => (
                <div key={group.group} className="space-y-1">
                  <h4 className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                    {group.group}
                  </h4>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all",
                            isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    )
                  })}
                </div>
              ))}
            </nav>
            <div className="border-t border-border/45 pt-4">
              <Button variant="outline" className="w-full text-xs" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Log Out
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
