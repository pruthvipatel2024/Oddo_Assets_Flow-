import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        warning:
          "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        info:
          "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20",
        pending:
          "border-transparent bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
