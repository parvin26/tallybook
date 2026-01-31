import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getCurrencyFromStorage } from "@/lib/currency"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, direction?: 'in' | 'out'): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  const { code, symbol } = getCurrencyFromStorage()
  const formatted = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(safe).replace(code, symbol)
  if (direction === 'in') return `+ ${formatted}`
  if (direction === 'out') return `– ${formatted}`
  return formatted
}

/** Formatted numeric value only (no symbol), for StatCard amount element. */
export function formatCurrencyAmount(amount: number): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
