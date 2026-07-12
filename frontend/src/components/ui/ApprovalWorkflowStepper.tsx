import React from "react"
import { cn } from "@/utils/cn"
import { Check } from "lucide-react"

interface ApprovalWorkflowStepperProps {
  status: "Pending" | "Approved" | "In Progress" | "Resolved" | "Rejected" | string
}

export function ApprovalWorkflowStepper({ status }: ApprovalWorkflowStepperProps) {
  // Map various statuses to standard step indexes
  let activeIndex = 0
  const isRejected = status === "Rejected"

  const normalizedStatus = status.toLowerCase()
  if (normalizedStatus === "pending") {
    activeIndex = 0
  } else if (normalizedStatus === "approved" || normalizedStatus === "scheduled") {
    activeIndex = 1
  } else if (normalizedStatus === "in progress" || normalizedStatus === "ongoing") {
    activeIndex = 2
  } else if (normalizedStatus === "resolved" || normalizedStatus === "completed" || normalizedStatus === "returned") {
    activeIndex = 3
  }

  const steps = ["Requested", "Approved", "In Progress", isRejected ? "Rejected" : "Resolved"]

  return (
    <div className="w-full py-4 text-xs font-sans">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border/60 z-0" />
        
        {/* Active Line Progress */}
        {!isRejected && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 z-0"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        )}

        {steps.map((label, idx) => {
          const isCompleted = idx < activeIndex
          const isActive = idx === activeIndex
          const isCurrentRejected = isRejected && idx === 3

          return (
            <div key={label} className="flex flex-col items-center relative z-10 select-none">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isActive && !isRejected && "bg-background border-primary text-primary ring-2 ring-primary/20",
                  isCurrentRejected && "bg-destructive border-destructive text-destructive-foreground",
                  !isCompleted && !isActive && !isCurrentRejected && "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 font-bold tracking-tight text-[10px] uppercase",
                  (isCompleted || isActive) && !isRejected && "text-primary",
                  isCurrentRejected && "text-destructive",
                  !isCompleted && !isActive && !isCurrentRejected && "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
