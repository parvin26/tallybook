'use client'

import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value = '', onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  
  // Ensure context updates when value prop changes
  const contextValue = React.useMemo(() => ({
    value,
    onValueChange: onValueChange || (() => {}),
    open,
    onOpenChange: setOpen
  }), [value, onValueChange, open])

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      type="button"
      onClick={() => context.onOpenChange(!context.open)}
      className={cn(
        'select-trigger flex w-full items-center justify-between rounded-xl border-2 border-[var(--tally-border)] bg-[var(--tally-surface)] px-4 py-3 text-base text-[var(--tally-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(41,151,140,0.25)] focus:border-[#29978C] transition-all',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 text-[var(--tally-text-muted)] transition-transform', context.open && 'rotate-180')} />
    </button>
  )
}

export function SelectValue({ placeholder, displayValue }: { placeholder?: string; displayValue?: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  const valueToShow = displayValue || context.value || placeholder

  return <span className={context.value ? 'text-[var(--tally-text)]' : 'text-[var(--tally-text-muted)]'}>
    {valueToShow}
  </span>
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

export function SelectContent({ className, children }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within Select')
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!context.open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        const trigger = (e.target as Element).closest('button')
        if (!trigger || !trigger.classList.contains('select-trigger')) {
          context.onOpenChange(false)
        }
      }
    }
    
    // Use setTimeout to avoid immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context.open, context.onOpenChange])

  if (!context.open) return null

  return (
    <div 
      ref={contentRef}
      className="select-content absolute z-50 w-full mt-2 rounded-lg border border-[var(--tally-border)] bg-[var(--tally-surface)] shadow-lg max-h-[300px] overflow-y-auto"
    >
      <div className={cn('p-1', className)}>{children}</div>
    </div>
  )
}

interface SelectGroupProps {
  children: React.ReactNode
}

export function SelectGroup({ children }: SelectGroupProps) {
  return <div className="space-y-1">{children}</div>
}

interface SelectLabelProps {
  className?: string
  children: React.ReactNode
}

export function SelectLabel({ className, children }: SelectLabelProps) {
  return (
    <div className={cn('px-2 py-2 text-xs font-semibold text-[var(--tally-text-muted)] uppercase tracking-wide', className)}>
      {children}
    </div>
  )
}

interface SelectItemProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function SelectItem({ value, disabled = false, className, children }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  const isSelected = context.value === value

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          context.onValueChange(value)
          context.onOpenChange(false)
        }
      }}
      className={cn(
        'w-full flex items-center justify-between px-3 py-3 text-base rounded-lg transition-colors text-left',
        disabled
          ? 'opacity-50 cursor-not-allowed text-[var(--tally-text-muted)]'
          : 'cursor-pointer hover:bg-[var(--tally-surface-2)] text-[var(--tally-text)]',
        isSelected && !disabled && 'bg-[rgba(41,151,140,0.12)] text-[#29978C]',
        className
      )}
    >
      <span>{children}</span>
      {isSelected && !disabled && <Check className="h-4 w-4" />}
    </button>
  )
}
