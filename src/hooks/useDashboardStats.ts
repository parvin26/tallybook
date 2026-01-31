import { useTransactions } from './useTransactions'
import { format } from 'date-fns'

/**
 * Derived hook for dashboard stats.
 * Single source of truth for "today" in the app: format(new Date(), 'yyyy-MM-dd').
 * Uses useTransactions; filters for today's transactions (local time).
 * Calculates cashIn (sales), cashOut (expenses), balance, and count.
 */
export function useDashboardStats() {
  const { data: transactions = [], isLoading } = useTransactions()

  // Canonical "today" for Today's Summary (local YYYY-MM-DD)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Filter transactions for today (match transaction_date string)
  const todayTransactions = transactions.filter(
    (t) => t.transaction_date === today || t.transaction_date?.startsWith?.(today)
  )

  // Calculate stats
  const cashIn = todayTransactions
    .filter((t) => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const cashOut = todayTransactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = cashIn - cashOut
  const count = todayTransactions.length

  return {
    cashIn,
    cashOut,
    balance,
    count,
    isLoading,
  }
}
