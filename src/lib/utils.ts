import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, direction?: 'in' | 'out'): string {
  const formatted = new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount).replace('MYR', 'RM')
  
  if (direction === 'in') {
    return `+ ${formatted}`
  } else if (direction === 'out') {
    return `– ${formatted}`
  }
  
  return formatted
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
