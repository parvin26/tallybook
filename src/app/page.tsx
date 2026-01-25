'use client'

import { useTodayProfit } from '@/hooks/useTodayProfit'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionListLovable } from '@/components/TransactionListLovable'
import { AppShell } from '@/components/AppShell'
import { HomeHeader } from '@/components/HomeHeader'
import { SummaryCardLovable } from '@/components/SummaryCardLovable'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

export default function MainPage() {
  const { t } = useTranslation()
  const { data: profitData, isLoading: profitLoading } = useTodayProfit()
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions()

  const revenue = profitData?.revenue || 0
  const expenses = profitData?.expenses || 0
  const balance = profitData?.profit || 0

  return (
    <AppShell title="" showBack={false} showLogo={false}>
      <div className="max-w-[480px] mx-auto">
        <HomeHeader />
        
        <div className="px-6 pb-6 space-y-6">
          {/* Summary Card */}
          <SummaryCardLovable 
            cashIn={revenue} 
            cashOut={expenses} 
            balance={balance} 
          />

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/sale"
              className="h-20 bg-[#29978C] hover:bg-[#238579] text-white text-base font-bold rounded-lg flex items-center justify-center shadow-md transition-colors active:scale-95"
            >
              {t('home.recordSale')}
            </Link>
            <Link
              href="/expense"
              className="h-20 bg-[#EA6C3C] hover:bg-[#E56E44] text-white text-base font-bold rounded-lg flex items-center justify-center shadow-md transition-colors active:scale-95"
            >
              {t('home.recordExpense')}
            </Link>
          </div>

          {/* Recent Activity Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--tally-text)]">{t('home.recentActivity')}</h2>
              <Link 
                href="/history"
                className="text-sm text-[#29978C] font-medium hover:underline"
              >
                {t('home.viewAll')}
              </Link>
            </div>
            {transactionsError ? (
              <div className="text-center py-8 text-[var(--tally-text-muted)]">
                <p>{t('home.loadingError')}</p>
              </div>
            ) : transactionsLoading ? (
              <div className="text-center py-8 text-[var(--tally-text-muted)]">{t('common.loading')}</div>
            ) : (
              <TransactionListLovable transactions={transactions || []} limit={5} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
