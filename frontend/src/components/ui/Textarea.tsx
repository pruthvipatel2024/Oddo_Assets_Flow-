import * as React from "react"
import { cn } from "@/utils/cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-[14px] font-normal shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-relaxed",
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
Textarea.displayName = "Textarea"

export { Textarea }
