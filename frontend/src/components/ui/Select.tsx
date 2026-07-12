import * as React from "react"
import { cn } from "@/utils/cn"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  helperText?: string
  options?: Array<{ value: string; label: string }>
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, helperText, options = [], children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-[14px] font-normal shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 cursor-pointer",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
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
Select.displayName = "Select"

export { Select }
