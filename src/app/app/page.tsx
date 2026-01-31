'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionListLovable } from '@/components/TransactionListLovable'
import { AppShell } from '@/components/AppShell'
import { HomeHeader } from '@/components/HomeHeader'
import { SummaryCardLovable } from '@/components/SummaryCardLovable'
import { ContinueChoice } from '@/components/ContinueChoice'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { EditTransactionModal } from '@/components/EditTransactionModal'
import type { Transaction } from '@/types'

export default function AppHomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [bannerAllowed, setBannerAllowed] = useState(false)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useTransactions()
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Resolve redirect before painting app home (audit fix: prevent /app flash before onboarding)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const country = localStorage.getItem(STORAGE_KEYS.COUNTRY)
    const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    if (!country) {
      router.replace('/onboarding/country')
      return
    }
    if (!language) {
      router.replace('/onboarding/language')
      return
    }
    setReady(true)
  }, [router])

  // PWA install banner: only after onboarding + at least one meaningful action + 10s delay (Home only)
  useEffect(() => {
    if (!ready || transactionsLoading) return
    const hasMeaningfulAction = (transactions?.length ?? 0) >= 1
    if (!hasMeaningfulAction) return
    bannerTimeoutRef.current = setTimeout(() => setBannerAllowed(true), 10000)
    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
    }
  }, [ready, transactionsLoading, transactions?.length])

  // Sort transactions: transaction_date (desc), then created_at (desc), then slice top 5
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transaction_date).getTime()
    const dateB = new Date(b.transaction_date).getTime()
    if (dateA !== dateB) {
      return dateB - dateA // Descending by date
    }
    const createdA = new Date(a.created_at).getTime()
    const createdB = new Date(b.created_at).getTime()
    return createdB - createdA // Descending by created_at
  })
  const recentTransactions = sortedTransactions.slice(0, 5)

  if (!ready) {
    return null
  }

  return (
    <>
      <AppShell title="" showBack={false} showLogo={false}>
        <div className="max-w-[480px] mx-auto">
          <HomeHeader />

          {/* PWA install banner: below header, above first content; not a modal; eligibility inside component */}
          <PWAInstallBanner showAfterDelay={bannerAllowed} />

          <div className="px-6 pb-6 space-y-6">
            {/* Summary Card — derives today's totals from useTransactions (single source of truth) */}
            <SummaryCardLovable />

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
                <TransactionListLovable
                  transactions={recentTransactions}
                  onTransactionClick={(tx) => {
                    setEditTransaction(tx)
                    setEditModalOpen(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </AppShell>
      {editTransaction && (
        <EditTransactionModal
          transaction={editTransaction}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onDelete={() => setEditTransaction(null)}
        />
      )}
      <ContinueChoice />
    </>
  )
}
