'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTodayProfit } from '@/hooks/useTodayProfit'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionListLovable } from '@/components/TransactionListLovable'
import { AppShell } from '@/components/AppShell'
import { HomeHeader } from '@/components/HomeHeader'
import { SummaryCardLovable } from '@/components/SummaryCardLovable'
import { ContinueChoice } from '@/components/ContinueChoice'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

export default function AppHomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: profitData, isLoading: profitLoading } = useTodayProfit()
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions()

  const revenue = profitData?.revenue || 0
  const expenses = profitData?.expenses || 0
  const balance = profitData?.profit || 0

  // On mount: check for country and language, route to onboarding if missing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      const language = localStorage.getItem('tally-language')
      
      if (!country) {
        router.replace('/onboarding/country')
        return
      }
      
      if (!language) {
        router.replace('/onboarding/language')
        return
      }
      
      // Both exist - let IntroOverlay auto-open based on storage rule
      // IntroOverlay will check for tally_intro_seen and tally-language
    }
  }, [router])

  return (
    <>
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
                className="tally-button-primary h-20 text-base flex items-center justify-center"
              >
                {t('home.recordSale')}
              </Link>
              <Link
                href="/expense"
                className="tally-button-secondary h-20 text-base flex items-center justify-center"
              >
                {t('home.recordExpense')}
              </Link>
            </div>

            {/* Recent Activity Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{t('home.recentActivity')}</h2>
                <Link 
                  href="/history"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  {t('home.viewAll')}
                </Link>
              </div>
              {transactionsError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('home.loadingError')}</p>
                </div>
              ) : transactionsLoading ? (
                <div className="tally-card text-center py-8 text-muted-foreground">{t('common.loading')}</div>
              ) : (
                <TransactionListLovable transactions={transactions || []} limit={5} />
              )}
            </div>
          </div>
        </div>
      </AppShell>
      <ContinueChoice />
    </>
  )
}
