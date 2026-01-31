import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          // Default/Primary variant: Always visible with white text on emerald background
          variant === "default" && "bg-emerald-600 text-white hover:bg-emerald-700 rounded-[var(--tally-radius)]",
          variant === "outline" && "border-2 border-tally-border bg-tally-surface text-tally-text hover:bg-tally-surface-2 rounded-[var(--tally-radius)]",
          // Ghost variant: Transparent background with muted text
          variant === "ghost" && "text-gray-500 hover:text-gray-700 hover:bg-tally-surface-2 rounded-[var(--tally-radius)]",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 text-sm",
          size === "lg" && "h-12 px-6 text-lg",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
