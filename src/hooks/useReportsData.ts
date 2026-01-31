import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfToday } from 'date-fns'
import { useTransactions } from './useTransactions'
import { useInventory, useSaleMovements } from './useInventory'
import type { Transaction } from '@/types'

export interface UseReportsDataParams {
  startDate?: string
  endDate?: string
}

export interface HealthInsights {
  hasData: boolean
  topPaymentMethod: string
}

export interface SalesByItemEntry {
  itemId: string
  itemName: string
  quantity: number
  amount: number
}

export interface UseReportsDataResult {
  isLoading: boolean
  filteredTransactions: Transaction[]
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  transactionCount: number
  revenueByType: Record<string, number>
  expensesByCategory: Record<string, number>
  salesByItem: SalesByItemEntry[]
  healthInsights: HealthInsights
}

export function useReportsData(params: UseReportsDataParams = {}): UseReportsDataResult {
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions()
  const { items: inventoryItems = [] } = useInventory()
  const { data: saleMovements = [], isLoading: saleMovementsLoading } = useSaleMovements()
  const isLoading = transactionsLoading || saleMovementsLoading

  const { startDate: paramStart, endDate: paramEnd } = params
  const today = startOfToday()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const startDate = paramStart ?? format(monthStart, 'yyyy-MM-dd')
  const endDate = paramEnd ?? format(monthEnd, 'yyyy-MM-dd')

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return []
    return transactions.filter((t) => {
      const d = t.transaction_date
      return d >= startDate && d <= endDate
    })
  }, [transactions, startDate, endDate])

  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => {
      return t.transaction_type === 'sale' ? sum + t.amount : sum
    }, 0)
  }, [filteredTransactions])

  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => {
      return t.transaction_type === 'expense' ? sum + t.amount : sum
    }, 0)
  }, [filteredTransactions])

  const netProfit = useMemo(() => totalRevenue - totalExpenses, [totalRevenue, totalExpenses])

  const transactionCount = useMemo(() => filteredTransactions.length, [filteredTransactions])

  const revenueByType = useMemo(() => {
    const out: Record<string, number> = {
      cash: 0,
      bank_transfer: 0,
      duitnow: 0,
      other: 0,
    }
    filteredTransactions
      .filter((t) => t.transaction_type === 'sale')
      .forEach((t) => {
        if (t.payment_method === 'cash') out.cash += t.amount
        else if (t.payment_method === 'bank_transfer') out.bank_transfer += t.amount
        else if (t.payment_method === 'e_wallet') out.duitnow += t.amount
        else out.other += t.amount
      })
    return out
  }, [filteredTransactions])

  const profitMargin = useMemo(() => {
    const rev = Number(totalRevenue) || 0
    return rev > 0 ? ((Number(netProfit) || 0) / rev) * 100 : 0
  }, [totalRevenue, netProfit])

  const expensesByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    filteredTransactions.forEach((t) => {
      if (t.transaction_type === 'expense') {
        const category = t.expense_category || 'other'
        categoryTotals[category] = (categoryTotals[category] || 0) + t.amount
      }
    })
    return categoryTotals
  }, [filteredTransactions])

  const salesByItem = useMemo((): SalesByItemEntry[] => {
    const saleTxIds = filteredTransactions.filter((t) => t.transaction_type === 'sale').map((t) => t.id)
    const saleIds = new Set(saleTxIds)
    const txAmountById = new Map(
      filteredTransactions.filter((t) => t.transaction_type === 'sale').map((t) => [t.id, t.amount])
    )
    const movementsInRange = saleMovements.filter((m) => m.transaction_id && saleIds.has(m.transaction_id))
    const movementCountByTx = new Map<string, number>()
    movementsInRange.forEach((m) => {
      const tid = m.transaction_id!
      movementCountByTx.set(tid, (movementCountByTx.get(tid) ?? 0) + 1)
    })
    const itemNameById = new Map(inventoryItems.map((i) => [i.id, i.name]))
    const byItem = new Map<string, { quantity: number; amount: number }>()
    movementsInRange.forEach((m) => {
      const qtySold = Math.abs(m.quantity_change)
      const txAmount = txAmountById.get(m.transaction_id!) ?? 0
      const movesForTx = movementCountByTx.get(m.transaction_id!) ?? 1
      const amountAttributed = movesForTx > 0 ? txAmount / movesForTx : 0
      const cur = byItem.get(m.item_id) ?? { quantity: 0, amount: 0 }
      byItem.set(m.item_id, {
        quantity: cur.quantity + qtySold,
        amount: cur.amount + amountAttributed,
      })
    })
    const fromInventory = Array.from(byItem.entries())
      .map(([itemId, { quantity, amount }]) => ({
        itemId,
        itemName: itemNameById.get(itemId) ?? itemId,
        quantity,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)

    const inventoryRevenue = fromInventory.reduce((sum, e) => sum + e.amount, 0)
    const generalSales = Number(totalRevenue) - inventoryRevenue
    if (generalSales > 0) {
      fromInventory.push({
        itemId: 'general',
        itemName: 'General Sales',
        amount: generalSales,
        quantity: 1,
      })
      fromInventory.sort((a, b) => b.amount - a.amount)
    }
    return fromInventory
  }, [filteredTransactions, saleMovements, inventoryItems, totalRevenue])

  const healthInsights = useMemo((): HealthInsights => {
    const hasData = transactionCount > 0
    const paymentMethods = filteredTransactions.map((t) => t.payment_method).filter(Boolean) as string[]
    let topPaymentMethod = ''
    if (paymentMethods.length > 0) {
      const counts: Record<string, number> = {}
      paymentMethods.forEach((m) => {
        const key = m || 'other'
        counts[key] = (counts[key] || 0) + 1
      })
      topPaymentMethod =
        Object.entries(counts).reduce((max, [method, count]) => (count > max[1] ? [method, count] : max), ['', 0])[0] ||
        ''
    }
    return { hasData, topPaymentMethod }
  }, [filteredTransactions, transactionCount])

  return {
    isLoading,
    filteredTransactions,
    totalRevenue: Number(totalRevenue) || 0,
    totalExpenses: Number(totalExpenses) || 0,
    netProfit: Number(netProfit) || 0,
    profitMargin: Number(profitMargin) || 0,
    transactionCount,
    revenueByType,
    expensesByCategory,
    salesByItem,
    healthInsights,
  }
}
