'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { AppShell } from '@/components/AppShell'
import { Calendar, TrendingUp, TrendingDown, Minus, ArrowRight, AlertCircle, CheckCircle2, Package, CreditCard, Wallet } from 'lucide-react'
import { getBusinessProfile } from '@/lib/businessProfile'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PeriodPreset = 'last7Days' | 'last30Days' | 'last90Days'

interface Insight {
  type: 'consistency' | 'cashDirection' | 'momentum' | 'stability' | 'heroProduct' | 'weakProduct' | 'paymentMethod'
  title: string
  message: string
  guidance?: string
  icon: typeof Calendar
  color: string
}

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
        .select('transaction_date, transaction_type, amount, payment_type, payment_method, expense_category, deleted_at')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', queryStartDate)
        .lte('transaction_date', queryEndDate)
      
      // Filter out soft-deleted transactions
      const transactions = allTransactions?.filter(t => !t.deleted_at) || []

      // Check if we have ANY transactions at all
      const totalTransactionCount = transactions.length
      if (totalTransactionCount === 0) {
        return {
          hasTransactions: false,
          insights: []
        }
      }

      const insights: Insight[] = []

      // 1. Recording Consistency
      const daysWithRecords = new Set(transactions.map(t => t.transaction_date)).size
      const allDays = eachDayOfInterval({ start: periodStart, end: today })
      const gaps = allDays.length - daysWithRecords
      const consistencyRatio = daysWithRecords / allDays.length

      if (consistencyRatio >= 0.7) {
        insights.push({
          type: 'consistency',
          title: t('health.insights.consistencyGood'),
          message: t('health.insights.consistencyGoodMessage', { count: daysWithRecords, total: allDays.length }),
          icon: CheckCircle2,
          color: '#2E7D5B'
        })
      } else if (consistencyRatio >= 0.4) {
        insights.push({
          type: 'consistency',
          title: t('health.insights.consistencyModerate'),
          message: t('health.insights.consistencyModerateMessage', { count: daysWithRecords, total: allDays.length }),
          guidance: t('health.insights.consistencyGuidance'),
          icon: Calendar,
          color: '#29978C'
        })
      } else {
        insights.push({
          type: 'consistency',
          title: t('health.insights.consistencyLow'),
          message: t('health.insights.consistencyLowMessage', { count: daysWithRecords, total: allDays.length, gaps }),
          guidance: t('health.insights.consistencyGuidance'),
          icon: AlertCircle,
          color: '#B94A3A'
        })
      }

      // 2. Cash Direction
      const cashIn = transactions
        .filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const cashOut = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const cashDirection = cashIn - cashOut
      const daysWithSales = new Set(transactions.filter(t => t.transaction_type === 'sale').map(t => t.transaction_date)).size
      const daysWithExpenses = new Set(transactions.filter(t => t.transaction_type === 'expense').map(t => t.transaction_date)).size

      if (cashDirection > 0 && daysWithSales >= daysWithExpenses) {
        insights.push({
          type: 'cashDirection',
          title: t('health.insights.cashDirectionPositive'),
          message: t('health.insights.cashDirectionPositiveMessage'),
          icon: TrendingUp,
          color: '#2E7D5B'
        })
      } else if (cashDirection < 0 && daysWithExpenses > daysWithSales) {
        insights.push({
          type: 'cashDirection',
          title: t('health.insights.cashDirectionNegative'),
          message: t('health.insights.cashDirectionNegativeMessage'),
          guidance: t('health.insights.cashDirectionGuidance'),
          icon: TrendingDown,
          color: '#B94A3A'
        })
      } else {
        insights.push({
          type: 'cashDirection',
          title: t('health.insights.cashDirectionMixed'),
          message: t('health.insights.cashDirectionMixedMessage'),
          icon: Minus,
          color: '#29978C'
        })
      }

      // 3. Activity Momentum
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
      const prevCount = prevTransactionsFiltered.length
      const currentCount = transactions.length

      if (prevCount > 0) {
        const changePercent = ((currentCount - prevCount) / prevCount) * 100
        if (changePercent > 20) {
          insights.push({
            type: 'momentum',
            title: t('health.insights.momentumUp'),
            message: t('health.insights.momentumUpMessage', { change: Math.round(changePercent) }),
            icon: TrendingUp,
            color: '#2E7D5B'
          })
        } else if (changePercent < -20) {
          insights.push({
            type: 'momentum',
            title: t('health.insights.momentumDown'),
            message: t('health.insights.momentumDownMessage', { change: Math.abs(Math.round(changePercent)) }),
            icon: TrendingDown,
            color: '#B94A3A'
          })
        } else {
          insights.push({
            type: 'momentum',
            title: t('health.insights.momentumStable'),
            message: t('health.insights.momentumStableMessage'),
            icon: Minus,
            color: '#29978C'
          })
        }
      }

      // 4. Stability (detect large spikes)
      const avgExpense = cashOut / transactions.filter(t => t.transaction_type === 'expense').length || 1
      const largeExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && t.amount > avgExpense * 3)
        .length

      const avgSale = cashIn / transactions.filter(t => t.transaction_type === 'sale').length || 1
      const largeSales = transactions
        .filter(t => t.transaction_type === 'sale' && t.amount > avgSale * 3)
        .length

      if (largeExpenses === 0 && largeSales === 0) {
        insights.push({
          type: 'stability',
          title: t('health.insights.stabilityGood'),
          message: t('health.insights.stabilityGoodMessage'),
          icon: CheckCircle2,
          color: '#2E7D5B'
        })
      } else if (largeExpenses > 0) {
        insights.push({
          type: 'stability',
          title: t('health.insights.stabilityExpenseSpike'),
          message: t('health.insights.stabilityExpenseSpikeMessage', { count: largeExpenses }),
          guidance: t('health.insights.stabilityGuidance'),
          icon: AlertCircle,
          color: '#B94A3A'
        })
      }

      // 5. Hero Products (top selling categories)
      const salesByCategory: Record<string, { count: number; amount: number }> = {}
      transactions
        .filter(t => t.transaction_type === 'sale')
        .forEach(t => {
          // For sales, use payment_type as category proxy, or group by amount ranges
          const category = t.payment_type || 'other'
          if (!salesByCategory[category]) {
            salesByCategory[category] = { count: 0, amount: 0 }
          }
          salesByCategory[category].count += 1
          salesByCategory[category].amount += t.amount
        })

      const topSaleCategory = Object.entries(salesByCategory).reduce((max, [cat, data]) => 
        data.amount > max[1].amount ? [cat, data] : max, ['', { count: 0, amount: 0 }]
      )

      if (topSaleCategory[0] && topSaleCategory[1].count > 0) {
        insights.push({
          type: 'heroProduct',
          title: t('health.insights.heroProduct'),
          message: t('health.insights.heroProductMessage', { 
            category: t(`paymentTypes.${topSaleCategory[0]}`) || topSaleCategory[0],
            count: topSaleCategory[1].count
          }),
          guidance: t('health.insights.heroProductGuidance'),
          icon: Package,
          color: '#2E7D5B'
        })
      }

      // 6. Weak Products (low activity categories)
      const expensesByCategory: Record<string, { count: number; amount: number }> = {}
      transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
          const category = t.expense_category || 'other'
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = { count: 0, amount: 0 }
          }
          expensesByCategory[category].count += 1
          expensesByCategory[category].amount += t.amount
        })

      const allCategories = Object.entries(expensesByCategory)
      if (allCategories.length > 1) {
        const sortedCategories = allCategories.sort((a, b) => a[1].amount - b[1].amount)
        const lowestCategory = sortedCategories[0]
        if (lowestCategory[1].count === 1 && lowestCategory[1].amount < cashOut * 0.1) {
          insights.push({
            type: 'weakProduct',
            title: t('health.insights.weakProduct'),
            message: t('health.insights.weakProductMessage', {
              category: t(`expenseCategories.${lowestCategory[0]}`) || lowestCategory[0]
            }),
            guidance: t('health.insights.weakProductGuidance'),
            icon: AlertCircle,
            color: '#B94A3A'
          })
        }
      }

      // 7. Payment Method Behavior
      const paymentMethodCounts: Record<string, number> = {}
      transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
          const method = t.payment_method || t.payment_type || 'cash'
          paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1
        })

      const totalExpenseTransactions = transactions.filter(t => t.transaction_type === 'expense').length
      if (totalExpenseTransactions > 0) {
        const topPaymentMethod = Object.entries(paymentMethodCounts).reduce((max, [method, count]) => 
          count > max[1] ? [method, count] : max, ['', 0]
        )

        if (topPaymentMethod[1] > 0) {
          const methodPercent = (topPaymentMethod[1] / totalExpenseTransactions) * 100
          const methodLabel = topPaymentMethod[0] === 'card' ? t('expense.paymentMethod.card') :
                            topPaymentMethod[0] === 'e_wallet' ? t('expense.paymentMethod.eWallet') :
                            topPaymentMethod[0] === 'bank_transfer' ? t('paymentTypes.bank_transfer') :
                            t('paymentTypes.cash')

          if (methodPercent > 60) {
            insights.push({
              type: 'paymentMethod',
              title: t('health.insights.paymentMethodDominant'),
              message: t('health.insights.paymentMethodDominantMessage', { 
                method: methodLabel,
                percent: Math.round(methodPercent)
              }),
              guidance: topPaymentMethod[0] === 'card' ? t('health.insights.paymentMethodCreditGuidance') :
                       topPaymentMethod[0] === 'cash' ? t('health.insights.paymentMethodCashGuidance') :
                       undefined,
              icon: topPaymentMethod[0] === 'card' ? CreditCard : Wallet,
              color: topPaymentMethod[0] === 'card' ? '#B94A3A' : '#29978C'
            })
          }
        }
      }

      return {
        hasTransactions: true,
        insights,
        summary: {
          totalTransactions: totalTransactionCount,
          daysWithRecords,
          cashIn,
          cashOut
        }
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

  // True empty state - only if NO transactions exist
  if (!healthData || !healthData.hasTransactions) {
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
                  {t('health.emptyState.title')}
                </p>
                <p className="text-sm text-[var(--tally-text-muted)]">
                  {t('health.emptyState.message')}
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

        {/* Insights Cards */}
        <div className="space-y-4">
          {healthData.insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <Card key={index} className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${insight.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: insight.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--tally-text)] mb-1">
                        {insight.title}
                      </p>
                      <p className="text-xs text-[var(--tally-text-muted)] mb-2">
                        {insight.message}
                      </p>
                      {insight.guidance && (
                        <p className="text-xs font-medium" style={{ color: insight.color }}>
                          {insight.guidance}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
