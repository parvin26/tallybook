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
import { Minus, Plus } from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { EditTransactionModal } from '@/components/EditTransactionModal'
import type { Transaction } from '@/types'

export default function AppHomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [bannerAllowed, setBannerAllowed] = useState(false)
  const [activeRange, setActiveRange] = useState<'today' | 'week' | 'month'>('today')
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useTransactions()

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

  // Sort transactions: transaction_date (desc), then created_at (desc), then slice top 3 for Home
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
  const recentTransactions = sortedTransactions.slice(0, 3)

  if (!ready) {
    return null
  }

  return (
    <>
      <AppShell title="" showBack={false} showLogo={false} hideHeaderOnHome>
        <div className="max-w-[480px] mx-auto min-h-[50vh]">
          <HomeHeader />

          {/* PWA install banner: below header, above first content; not a modal; eligibility inside component */}
          <PWAInstallBanner showAfterDelay={bannerAllowed} />

          <div className="px-6 pb-40 space-y-6">
            <SummaryCardLovable />

            <div
              role="tablist"
              aria-label={t('report.common.period', { defaultValue: 'Time range' })}
              className="mx-auto w-full max-w-[320px] rounded-2xl bg-[hsl(var(--muted))] p-1 flex items-center gap-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeRange === 'today'}
                onClick={() => setActiveRange('today')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeRange === 'today'
                    ? 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
                style={activeRange === 'today' ? { boxShadow: 'var(--shadow-soft)' } : undefined}
              >
                {t('history.today', { defaultValue: 'Today' })}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRange === 'week'}
                onClick={() => setActiveRange('week')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeRange === 'week'
                    ? 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
                style={activeRange === 'week' ? { boxShadow: 'var(--shadow-soft)' } : undefined}
              >
                {t('report.common.thisWeek', { defaultValue: 'This Week' })}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRange === 'month'}
                onClick={() => setActiveRange('month')}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  activeRange === 'month'
                    ? 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
                style={activeRange === 'month' ? { boxShadow: 'var(--shadow-soft)' } : undefined}
              >
                {t('report.common.thisMonth', { defaultValue: 'This Month' })}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/sale"
                className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] px-4 py-5 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-[hsl(var(--accent))]/80"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary-soft-bg))] text-[hsl(var(--primary))]">
                  <Plus className="w-5 h-5" />
                </span>
                <span className="text-lg font-semibold text-[hsl(var(--foreground))]">{t('transaction.recordSale', { defaultValue: 'Record Sale' })}</span>
              </Link>
              <Link
                href="/expense"
                className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-5 flex flex-col items-center justify-center gap-2 transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--money-out-bg))] text-[hsl(var(--secondary))]">
                  <Minus className="w-5 h-5" />
                </span>
                <span className="text-lg font-semibold text-[hsl(var(--secondary))]">{t('transaction.recordExpense', { defaultValue: 'Record Expense' })}</span>
              </Link>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">{t('home.recentActivity')}</h2>
              {transactionsError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('home.loadingError')}</p>
                </div>
              ) : transactionsLoading ? (
                <div className="tally-card text-center py-8 text-muted-foreground">{t('common.loading')}</div>
              ) : (
                <TransactionListLovable
                  transactions={recentTransactions}
                  variant="home"
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
