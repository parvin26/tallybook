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
  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) }}>
      {open && (
        <>
          {/* Backdrop: fixed full screen, blocks interaction with page content */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={() => onOpenChange?.(false)}
            onPointerDown={(e) => e.preventDefault()}
            aria-hidden
          />
          {/* Content: centered card floating on top; z-[51] so content sits above backdrop (z-50) */}
          <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </>
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
      "bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 max-h-[90vh] overflow-y-auto relative",
      className
    )}>
      <button
        onClick={() => context.onOpenChange(false)}
        className="absolute top-4 right-4 rounded-full w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-accent text-muted-foreground transition-colors"
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
