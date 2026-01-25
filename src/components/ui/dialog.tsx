'use client'

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) }}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => onOpenChange?.(false)}
          />
          <div className="relative z-50 w-full max-w-md mx-4">
            {children}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ 
  asChild, 
  children, 
  ...props 
}: { asChild?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used within Dialog")
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: () => context.onOpenChange(true),
    } as React.ButtonHTMLAttributes<HTMLButtonElement>)
  }
  
  return (
    <button {...props} onClick={() => context.onOpenChange(true)}>
      {children}
    </button>
  )
}

export function DialogContent({ 
  className, 
  children 
}: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")
  
  return (
    <div className={cn(
      "bg-[var(--tally-surface)] rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto border border-[var(--tally-border)]",
      className
    )}>
      <button
        onClick={() => context.onOpenChange(false)}
        className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 text-[var(--tally-text-muted)]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}
