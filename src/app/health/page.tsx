'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, startOfToday } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { AppShell } from '@/components/AppShell'
import { Calendar, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { getBusinessProfile } from '@/lib/businessProfile'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PeriodPreset = 'last7Days' | 'last30Days' | 'last90Days'

export default function BusinessHealthPage() {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  
  // Get Business Profile (single source of truth for identity)
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')
  
  const today = startOfToday()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last7Days')

  const getPeriodDays = () => {
    switch (periodPreset) {
      case 'last7Days':
        return 7
      case 'last30Days':
        return 30
      case 'last90Days':
        return 90
      default:
        return 7
    }
  }

  const periodDays = getPeriodDays()
  const periodStart = subDays(today, periodDays - 1)
  const queryStartDate = format(periodStart, 'yyyy-MM-dd')
  const queryEndDate = format(today, 'yyyy-MM-dd')

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['businessHealth', currentBusiness?.id, queryStartDate, queryEndDate],
    queryFn: async () => {
      if (!currentBusiness?.id) return null

      // Get transactions for the period
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('transaction_date, transaction_type, amount, payment_type, expense_category, deleted_at')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', queryStartDate)
        .lte('transaction_date', queryEndDate)
      
      // Filter out soft-deleted transactions
      const transactions = allTransactions?.filter(t => !t.deleted_at) || []

      // 1. Recording Consistency
      const daysWithRecords = new Set(transactions.map(t => t.transaction_date)).size
      const consistency = daysWithRecords

      // 2. Cashflow Balance
      const cashIn = transactions
        .filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const cashOut = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      // 3. Profit Trend
      const netProfit = cashIn - cashOut
      const previousPeriodStart = subDays(periodStart, periodDays)
      const previousPeriodEnd = subDays(periodStart, 1)
      const prevQueryStart = format(previousPeriodStart, 'yyyy-MM-dd')
      const prevQueryEnd = format(previousPeriodEnd, 'yyyy-MM-dd')
      
      const { data: prevTransactions } = await supabase
        .from('transactions')
        .select('transaction_type, amount, deleted_at')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', prevQueryStart)
        .lte('transaction_date', prevQueryEnd)
      
      const prevTransactionsFiltered = prevTransactions?.filter(t => !t.deleted_at) || []
      const prevCashIn = prevTransactionsFiltered
        .filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0)
      const prevCashOut = prevTransactionsFiltered
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      const prevNetProfit = prevCashIn - prevCashOut
      
      let profitTrend: 'up' | 'down' | 'stable' = 'stable'
      if (prevNetProfit !== 0) {
        const change = ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
        if (change > 5) profitTrend = 'up'
        else if (change < -5) profitTrend = 'down'
        else profitTrend = 'stable'
      } else if (netProfit > 0) {
        profitTrend = 'up'
      } else if (netProfit < 0) {
        profitTrend = 'down'
      }

      // 4. Top Expense Category
      const expensesByCategory: Record<string, number> = {}
      transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
          const category = t.expense_category || 'other'
          expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount
        })
      
      const topCategory = Object.entries(expensesByCategory).reduce((max, [cat, amt]) => 
        amt > max[1] ? [cat, amt] : max, ['', 0]
      )

      return {
        consistency,
        periodDays,
        cashIn,
        cashOut,
        netProfit,
        profitTrend,
        topCategory: topCategory[0] ? {
          name: topCategory[0],
          amount: topCategory[1]
        } : null,
        hasEnoughData: daysWithRecords >= 3
      }
    },
    enabled: !!currentBusiness?.id,
  })

  if (isLoading) {
    return (
      <AppShell title={t('report.businessHealth.title')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[var(--tally-text-muted)]">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  // Empty State
  if (!healthData || !healthData.hasEnoughData) {
    return (
      <AppShell title={t('report.businessHealth.title')} showBack showLogo>
        <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">
          {/* Header Block */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('report.businessHealth.title')}</h1>
            <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
            <p className="text-sm text-[var(--tally-text-muted)]">
              {t('report.businessHealth.period')}: {t(`report.businessHealth.${periodPreset}`)}
            </p>
          </div>

          {/* Period Controls */}
          <div className="flex gap-2 flex-wrap">
            {(['last7Days', 'last30Days', 'last90Days'] as PeriodPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setPeriodPreset(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodPreset === preset
                    ? 'bg-[#29978C] text-white'
                    : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
                }`}
              >
                {t(`report.businessHealth.${preset}`)}
              </button>
            ))}
          </div>

          {/* Empty State Card */}
          <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-[rgba(41,151,140,0.12)] flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-[#29978C]" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-[var(--tally-text)]">
                  {t('report.businessHealth.emptyStateTitle')}
                </p>
                <p className="text-sm text-[var(--tally-text-muted)]">
                  {t('report.businessHealth.emptyStateMessage')}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Link href="/sale" className="flex-1">
                  <Button className="w-full bg-[#29978C] hover:bg-[#238579] text-white">
                    {t('report.businessHealth.recordSale')}
                  </Button>
                </Link>
                <Link href="/expense" className="flex-1">
                  <Button className="w-full bg-[#EA6C3C] hover:bg-[#E56E44] text-white">
                    {t('report.businessHealth.recordExpense')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('report.businessHealth.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">
        {/* Header Block */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('report.businessHealth.title')}</h1>
          <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
          <p className="text-sm text-[var(--tally-text-muted)]">
            {t('report.businessHealth.period')}: {t(`report.businessHealth.${periodPreset}`)}
          </p>
        </div>

        {/* Period Controls */}
        <div className="flex gap-2 flex-wrap">
          {(['last7Days', 'last30Days', 'last90Days'] as PeriodPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setPeriodPreset(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodPreset === preset
                  ? 'bg-[#29978C] text-white'
                  : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
              }`}
            >
              {t(`report.businessHealth.${preset}`)}
            </button>
          ))}
        </div>

        {/* Health Cards */}
        <div className="space-y-4">
          {/* 1. Recording Consistency */}
          <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#29978C]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">
                      {t('report.businessHealth.recordingConsistency')}
                    </p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {t('report.businessHealth.daysRecorded', { 
                        count: healthData.consistency, 
                        total: healthData.periodDays 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Cashflow Balance */}
          <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--tally-text)]">
                  {t('report.businessHealth.cashflowBalance')}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--tally-text-muted)]">{t('report.businessHealth.cashIn')}</span>
                  <span className="text-[#2E7D5B] font-medium">{formatCurrency(healthData.cashIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--tally-text-muted)]">{t('report.businessHealth.cashOut')}</span>
                  <span className="text-[#B94A3A] font-medium">{formatCurrency(healthData.cashOut)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Profit Trend */}
          <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {healthData.profitTrend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-[#2E7D5B]" />
                  ) : healthData.profitTrend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-[#B94A3A]" />
                  ) : (
                    <Minus className="w-5 h-5 text-[var(--tally-text-muted)]" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">
                      {t('report.businessHealth.profitTrend')}
                    </p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {formatCurrency(Math.abs(healthData.netProfit))} ({t(`report.businessHealth.trend${healthData.profitTrend.charAt(0).toUpperCase() + healthData.profitTrend.slice(1)}`)})
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Top Expense Category */}
          {healthData.topCategory && (
            <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">
                      {t('report.businessHealth.topExpenseCategory')}
                    </p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {t(`expenseCategories.${healthData.topCategory.name}`) || healthData.topCategory.name}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--tally-text)]">
                    {formatCurrency(healthData.topCategory.amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
