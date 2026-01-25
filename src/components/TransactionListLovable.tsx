'use client'

import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Wallet, Building2, Smartphone, CreditCard, Package, Car, Zap, Home, Users, Utensils, Wrench, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseISO, isToday, isYesterday, format, isSameDay } from 'date-fns'
import { useTranslation } from 'react-i18next'

const paymentIcons: Record<string, typeof Wallet> = {
  cash: Wallet,
  bank_transfer: Building2,
  duitnow: Smartphone,
  tng: Smartphone,
  boost: Smartphone,
  grabpay: Smartphone,
  shopeepay: Smartphone,
  credit: CreditCard,
}

const categoryIcons: Record<string, typeof Package> = {
  stock_purchase: Package,
  transport: Car,
  utilities: Zap,
  rent: Home,
  salaries: Users,
  food: Utensils,
  maintenance: Wrench,
  other: MoreHorizontal,
}

interface TransactionListLovableProps {
  transactions: Transaction[]
  limit?: number
}

export function TransactionListLovable({ transactions, limit }: TransactionListLovableProps) {
  const { t } = useTranslation()
  const router = useRouter()

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--tally-text-muted)]">
        <p>{t('home.noTransactions')}</p>
      </div>
    )
  }

  // Filter out soft-deleted transactions
  const activeTransactions = transactions.filter(t => !t.deleted_at || t.deleted_at === null)
  const displayTransactions = limit ? activeTransactions.slice(0, limit) : activeTransactions

  // Group transactions by day
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return isToday(txDate)
  })

  const yesterdayTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return isYesterday(txDate)
  })

  const otherTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return !isToday(txDate) && !isYesterday(txDate)
  })

  const renderTransaction = (transaction: Transaction) => {
    const isSale = transaction.transaction_type === 'sale' || transaction.transaction_type === 'payment_received'
    
    // Determine icon
    let Icon = Wallet
    if (transaction.expense_category) {
      Icon = categoryIcons[transaction.expense_category] || MoreHorizontal
    } else {
      Icon = paymentIcons[transaction.payment_type] || Wallet
    }

    // Determine label
    let label = transaction.expense_category || transaction.payment_type || 'Transaction'
    if (transaction.expense_category) {
      label = t(`expenseCategories.${transaction.expense_category}`) || label
    } else {
      label = t(`paymentTypes.${transaction.payment_type}`) || label
    }

    // Secondary label (note or time)
    const txDate = parseISO(transaction.transaction_date)
    const timeStr = format(txDate, 'h:mm a')
    const secondaryLabel = transaction.notes || timeStr

    return (
      <div
        key={transaction.id}
        onClick={() => router.push(`/transaction/${transaction.id}`)}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors cursor-pointer"
      >
        <div className="w-10 h-10 rounded-lg bg-[var(--tally-surface)] border border-[var(--tally-border)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[var(--tally-text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--tally-text)] truncate">{label}</p>
          <p className="text-xs text-[var(--tally-text-muted)] truncate">{secondaryLabel}</p>
        </div>
        <div className={`text-base font-bold tabular-nums ${
          isSale ? 'text-[#2E7D5B]' : 'text-[#B94A3A]'
        }`}>
          {isSale ? '+' : '–'}{formatCurrency(transaction.amount)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {todayTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">{t('history.today')}</h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{todayTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {todayTransactions.map(renderTransaction)}
          </div>
        </div>
      )}

      {yesterdayTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">{t('history.yesterday')}</h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{yesterdayTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {yesterdayTransactions.map(renderTransaction)}
          </div>
        </div>
      )}

      {otherTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">
              {format(parseISO(otherTransactions[0].transaction_date), 'MMMM d, yyyy')}
            </h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{otherTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {otherTransactions.map(renderTransaction)}
          </div>
        </div>
      )}
    </div>
  )
}
