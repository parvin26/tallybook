'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionListLovable } from '@/components/TransactionListLovable'
import { EditTransactionModal } from '@/components/EditTransactionModal'
import { AppShell } from '@/components/AppShell'
import type { Transaction } from '@/types'
import { startOfMonth, endOfMonth, subDays, isWithinInterval, parseISO } from 'date-fns'
import { ChevronDown, Filter, Check } from 'lucide-react'

type TypeFilter = 'all' | 'sale' | 'expense'
type PaymentFilter = 'all' | 'cash' | 'bank_transfer' | 'e_wallet' | 'other'
type DateRangeFilter = 'this_month' | 'last_30' | 'custom'
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low'

const SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'amount_high', 'amount_low']

export default function HistoryPage() {
  const { t } = useTranslation()
  const { data: transactions, isLoading, error } = useTransactions()
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  const filteredAndSorted = useMemo(() => {
    let list = transactions ?? []
    if (list.length === 0) return list
    if (typeFilter !== 'all') list = list.filter((tx) => tx.transaction_type === typeFilter)
    if (paymentFilter !== 'all') list = list.filter((tx) => tx.payment_method === paymentFilter)
    if (dateRange === 'this_month') {
      const now = new Date()
      list = list.filter((tx) => isWithinInterval(parseISO(tx.transaction_date), { start: startOfMonth(now), end: endOfMonth(now) }))
    } else if (dateRange === 'last_30') {
      const end = new Date()
      list = list.filter((tx) => isWithinInterval(parseISO(tx.transaction_date), { start: subDays(end, 30), end }))
    } else if (dateRange === 'custom' && customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      if (start <= end) list = list.filter((tx) => isWithinInterval(parseISO(tx.transaction_date), { start, end }))
    }
    const sorted = [...list]
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sortBy === 'amount_high') sorted.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    else if (sortBy === 'amount_low') sorted.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount))
    return sorted
  }, [transactions, typeFilter, paymentFilter, dateRange, customStart, customEnd, sortBy])

  const totalCount = transactions?.length ?? 0
  const filteredCount = filteredAndSorted.length
  const hasCustomDateActive = dateRange === 'custom' && (customStart || customEnd)
  const hasActiveFilters = typeFilter !== 'all' || paymentFilter !== 'all' || dateRange !== 'this_month' || hasCustomDateActive

  const sortLabel = t(`history.sort_${sortBy}`, { defaultValue: SORT_OPTIONS.includes(sortBy) ? ['Newest', 'Oldest', 'Highest amount', 'Lowest amount'][SORT_OPTIONS.indexOf(sortBy)] : sortBy })

  return (
    <AppShell title={t('history.transactions')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-4 py-4 pb-48">
        {!isLoading && !error && totalCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className={`flex items-center gap-2 min-h-9 px-3 rounded-lg border text-sm font-medium transition-colors flex-1 min-w-0 justify-center ${hasActiveFilters ? 'border-gray-400 bg-gray-50 text-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4 shrink-0 text-gray-500" />
              <span>{t('history.filter', { defaultValue: 'Filter' })}</span>
            </button>
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setSortDropdownOpen((o) => !o)}
                className="flex items-center justify-between gap-2 w-full min-h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <span className="truncate">{t('history.sortBy', { defaultValue: 'Sort by' })}: {sortLabel}</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
              </button>
              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortDropdownOpen(false)} aria-hidden />
                  <div className="absolute right-0 left-0 top-full mt-1 z-20 py-1 rounded-lg border border-gray-200 bg-white shadow-sm min-w-[160px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setSortBy(opt); setSortDropdownOpen(false) }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 text-left"
                      >
                        <span>{t(`history.sort_${opt}`, { defaultValue: opt === 'newest' ? 'Newest' : opt === 'oldest' ? 'Oldest' : opt === 'amount_high' ? 'Highest amount' : 'Lowest amount' })}</span>
                        {sortBy === opt && <Check className="w-4 h-4 shrink-0 text-gray-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-tally-caption text-[var(--tally-text-muted)] mb-3">
          {filteredCount === totalCount ? t('history.transactionsCount', { count: totalCount }) : t('history.filteredCount', { count: filteredCount, total: totalCount })}
        </p>

        {error ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">
            <p>Could not load transactions</p>
            <p className="text-xs mt-2">{error.message}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">Loading...</div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]"><p>No transactions yet</p></div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]"><p>{t('history.filteredEmpty')}</p></div>
        ) : (
          <TransactionListLovable
            transactions={filteredAndSorted}
            onTransactionClick={(tx) => { setEditTransaction(tx); setEditModalOpen(true) }}
          />
        )}
      </div>

      {/* Filter bottom sheet */}
      {filterSheetOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setFilterSheetOpen(false)} aria-hidden />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl max-h-[85vh] overflow-y-auto shadow-lg border-t border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{t('history.filter', { defaultValue: 'Filter' })}</h2>
              <button type="button" onClick={() => setFilterSheetOpen(false)} className="p-2 -m-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Close">
                <ChevronDown className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('history.filterType', { defaultValue: 'Transaction type' })}</p>
                <ul className="border border-gray-200 rounded-lg overflow-hidden">
                  {(['all', 'sale', 'expense'] as const).map((v) => (
                    <li key={v}>
                      <button
                        type="button"
                        onClick={() => setTypeFilter(v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <span>{v === 'all' ? t('history.filterAll', { defaultValue: 'All' }) : v === 'sale' ? t('transaction.sale', { defaultValue: 'Sale' }) : t('transaction.expense', { defaultValue: 'Expense' })}</span>
                        {typeFilter === v && <Check className="w-4 h-4 shrink-0 text-gray-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('history.filterPayment', { defaultValue: 'Payment method' })}</p>
                <ul className="border border-gray-200 rounded-lg overflow-hidden">
                  {(['all', 'cash', 'bank_transfer', 'e_wallet', 'other'] as const).map((v) => (
                    <li key={v}>
                      <button
                        type="button"
                        onClick={() => setPaymentFilter(v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <span>{v === 'all' ? t('history.filterAll', { defaultValue: 'All' }) : t(`paymentTypes.${v === 'e_wallet' ? 'mobile_money' : v}`, { defaultValue: v === 'e_wallet' ? 'Mobile Money' : v === 'bank_transfer' ? 'Bank Transfer' : v === 'cash' ? 'Cash' : 'Other' })}</span>
                        {paymentFilter === v && <Check className="w-4 h-4 shrink-0 text-gray-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('history.filterDate', { defaultValue: 'Date range' })}</p>
                <ul className="border border-gray-200 rounded-lg overflow-hidden">
                  {(['this_month', 'last_30', 'custom'] as const).map((v) => (
                    <li key={v}>
                      <button
                        type="button"
                        onClick={() => setDateRange(v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <span>{v === 'this_month' ? t('history.thisMonth', { defaultValue: 'This month' }) : v === 'last_30' ? t('history.last30Days', { defaultValue: 'Last 30 days' }) : t('history.custom', { defaultValue: 'Custom' })}</span>
                        {dateRange === v && <Check className="w-4 h-4 shrink-0 text-gray-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
                {dateRange === 'custom' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="flex-1 min-h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-800"
                    />
                    <span className="text-sm text-gray-500">–</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="flex-1 min-h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {editTransaction && (
        <EditTransactionModal
          transaction={editTransaction}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onDelete={() => setEditTransaction(null)}
        />
      )}
    </AppShell>
  )
}
