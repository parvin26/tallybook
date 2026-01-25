'use client'

import { useTranslation } from 'react-i18next'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionListLovable } from '@/components/TransactionListLovable'
import { AppShell } from '@/components/AppShell'

export default function HistoryPage() {
  const { t } = useTranslation()
  const { data: transactions, isLoading, error } = useTransactions()

  const totalCount = transactions?.length || 0

  return (
    <AppShell title={t('history.transactions')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6">
        <p className="text-sm text-[var(--tally-text-muted)] mb-6">{t('history.transactionsCount', { count: totalCount })}</p>

        {/* Transaction List */}
        {error ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">
            <p>Could not load transactions</p>
            <p className="text-xs mt-2">{error.message}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">Loading...</div>
        ) : totalCount === 0 ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">
            <p>No transactions yet</p>
          </div>
        ) : (
          <TransactionListLovable transactions={transactions || []} />
        )}
      </div>
    </AppShell>
  )
}
