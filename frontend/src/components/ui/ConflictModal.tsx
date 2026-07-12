import React from "react"
import { Dialog, DialogContent } from "./Dialog"
import { Button } from "./Button"
import { AlertCircle, ArrowLeftRight } from "lucide-react"

interface ConflictModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  conflictDetails?: {
    currentHolderName?: string
    currentHolderEmail?: string
    dueDate?: string
  }
  primaryActionLabel?: string
  onPrimaryAction?: () => void
}

export function ConflictModal({
  open,
  onClose,
  title,
  message,
  conflictDetails,
  primaryActionLabel = "Request Custody Transfer",
  onPrimaryAction,
}: ConflictModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-md p-6 bg-card text-card-foreground rounded-lg border border-border shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-destructive/10 text-destructive rounded-full shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
            
            {conflictDetails && (
              <div className="p-3 bg-secondary/40 border border-border/60 rounded-md space-y-1.5 text-xs mt-3">
                {conflictDetails.currentHolderName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase">Current Custodian</span>
                    <span className="font-bold text-foreground/90">{conflictDetails.currentHolderName}</span>
                  </div>
                )}
                {conflictDetails.currentHolderEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase">Email</span>
                    <span className="font-medium text-foreground/80">{conflictDetails.currentHolderEmail}</span>
                  </div>
                )}
                {conflictDetails.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase">Expected Return</span>
                    <span className="font-semibold text-amber-500">{conflictDetails.dueDate}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 border-t border-border/40 pt-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8 cursor-pointer">
            Cancel
          </Button>
          {onPrimaryAction && (
            <Button size="sm" onClick={onPrimaryAction} className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 cursor-pointer">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {primaryActionLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
