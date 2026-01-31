import { useTransactions } from './useTransactions'
import { format } from 'date-fns'

/**
 * Derived hook for dashboard stats.
 * Uses useTransactions as single source of truth — filters for today's transactions (local time).
 * Calculates cashIn (sales), cashOut (expenses), balance, and count.
 */
export function useDashboardStats() {
  const { data: transactions = [], isLoading } = useTransactions()

  // Get today's date in local timezone (YYYY-MM-DD format)
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
