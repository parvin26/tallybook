import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-cta-primary text-cta-text",
        variant === "secondary" && "bg-surface-secondary text-text-primary",
        variant === "outline" && "border border-divider",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
