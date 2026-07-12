import * as React from "react"
import { cn } from "@/utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-[14px] font-normal shadow-sm transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[12px] font-medium text-destructive">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-[12px] text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
