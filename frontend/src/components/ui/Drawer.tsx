import React, { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "./Button"
import { cn } from "@/utils/cn"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DrawerProps) {
  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel Container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className={cn(
            "w-screen bg-card border-l border-border/80 shadow-2xl flex flex-col justify-between transition-transform duration-300 transform animate-in slide-in-from-right",
            sizeClasses[size]
          )}
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-border/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold tracking-wide text-foreground/90 uppercase">{title}</h2>
              {description && (
                <p className="text-[11px] text-muted-foreground font-medium leading-normal">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 select-text">
            {children}
          </div>

          {/* Footer Area */}
          {footer && (
            <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
