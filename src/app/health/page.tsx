'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTransactions } from '@/hooks/useTransactions'
import { useReportsData } from '@/hooks/useReportsData'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, startOfToday, eachDayOfInterval } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { AppShell } from '@/components/AppShell'
import { Activity, Calendar, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Package, CreditCard, Wallet } from 'lucide-react'
import { getBusinessProfile } from '@/lib/businessProfile'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PeriodPreset = 'last7Days' | 'last30Days' | 'last90Days' | 'custom'

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

  // Get Business Profile (single source of truth for identity)
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')
  
  const today = startOfToday()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last7Days')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const getDateRange = () => {
    if (periodPreset === 'custom' && customStartDate && customEndDate) {
      return { start: new Date(customStartDate), end: new Date(customEndDate) }
    }
    const days = periodPreset === 'last7Days' ? 7 : periodPreset === 'last30Days' ? 30 : periodPreset === 'last90Days' ? 90 : 7
    return { start: subDays(today, days - 1), end: today }
  }

  const dateRange = getDateRange()
  const periodStart = dateRange.start
  const periodEnd = dateRange.end
  const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const queryStartDate = format(periodStart, 'yyyy-MM-dd')
  const queryEndDate = format(periodEnd, 'yyyy-MM-dd')

  const { data: allTransactions = [] } = useTransactions()
  const { filteredTransactions, isLoading, totalRevenue: cashIn, totalExpenses: cashOut, transactionCount: totalTransactionCount } = useReportsData({
    startDate: queryStartDate,
    endDate: queryEndDate,
  })

  const transactions = filteredTransactions

  const previousPeriodStart = subDays(periodStart, periodDays)
  const previousPeriodEnd = subDays(periodStart, 1)
  const isCustom = periodPreset === 'custom'
  const prevQueryStart = format(previousPeriodStart, 'yyyy-MM-dd')
  const prevQueryEnd = format(previousPeriodEnd, 'yyyy-MM-dd')
  const prevTransactionsFiltered = useMemo(() => {
    return allTransactions.filter((t) => {
      const d = t.transaction_date
      return d >= prevQueryStart && d <= prevQueryEnd
    })
  }, [allTransactions, prevQueryStart, prevQueryEnd])

  const healthData = useMemo(() => {
    if (totalTransactionCount === 0) {
      return { hasTransactions: false as const, insights: [] as Insight[] }
    }

    const insights: Insight[] = []

    const daysWithRecords = new Set(transactions.map((t) => t.transaction_date)).size
    const allDays = eachDayOfInterval({ start: periodStart, end: periodEnd })
    const gaps = allDays.length - daysWithRecords
    const consistencyRatio = daysWithRecords / allDays.length

    if (consistencyRatio >= 0.7) {
      insights.push({
        type: 'consistency',
        title: t('health.insights.consistencyGood'),
        message: t('health.insights.consistencyGoodMessage', { count: daysWithRecords, total: allDays.length }),
        icon: CheckCircle2,
        color: '#2E7D5B',
      })
    } else if (consistencyRatio >= 0.4) {
      insights.push({
        type: 'consistency',
        title: t('health.insights.consistencyModerate'),
        message: t('health.insights.consistencyModerateMessage', { count: daysWithRecords, total: allDays.length }),
        guidance: t('health.insights.consistencyGuidance'),
        icon: Calendar,
        color: '#29978C',
      })
    } else {
      insights.push({
        type: 'consistency',
        title: t('health.insights.consistencyLow'),
        message: t('health.insights.consistencyLowMessage', { count: daysWithRecords, total: allDays.length, gaps }),
        guidance: t('health.insights.consistencyGuidance'),
        icon: AlertCircle,
        color: '#B94A3A',
      })
    }

    const cashDirection = cashIn - cashOut
    const daysWithSales = new Set(transactions.filter((t) => t.transaction_type === 'sale').map((t) => t.transaction_date)).size
    const daysWithExpenses = new Set(transactions.filter((t) => t.transaction_type === 'expense').map((t) => t.transaction_date)).size

    if (cashDirection > 0 && daysWithSales >= daysWithExpenses) {
      insights.push({
        type: 'cashDirection',
        title: t('health.insights.cashDirectionPositive'),
        message: t('health.insights.cashDirectionPositiveMessage'),
        icon: TrendingUp,
        color: '#2E7D5B',
      })
    } else if (cashDirection < 0 && daysWithExpenses > daysWithSales) {
      insights.push({
        type: 'cashDirection',
        title: t('health.insights.cashDirectionNegative'),
        message: t('health.insights.cashDirectionNegativeMessage'),
        guidance: t('health.insights.cashDirectionGuidance'),
        icon: TrendingDown,
        color: '#B94A3A',
      })
    } else {
      insights.push({
        type: 'cashDirection',
        title: t('health.insights.cashDirectionMixed'),
        message: t('health.insights.cashDirectionMixedMessage'),
        icon: Minus,
        color: '#29978C',
      })
    }

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
          color: '#2E7D5B',
        })
      } else if (changePercent < -20) {
        insights.push({
          type: 'momentum',
          title: t('health.insights.momentumDown'),
          message: t('health.insights.momentumDownMessage', { change: Math.abs(Math.round(changePercent)) }),
          icon: TrendingDown,
          color: '#B94A3A',
        })
      } else {
        insights.push({
          type: 'momentum',
          title: t('health.insights.momentumStable'),
          message: t('health.insights.momentumStableMessage'),
          icon: Minus,
          color: '#29978C',
        })
      }
    }

    const expenseCount = transactions.filter((t) => t.transaction_type === 'expense').length
    const saleCount = transactions.filter((t) => t.transaction_type === 'sale').length
    const avgExpense = expenseCount ? cashOut / expenseCount : 1
    const largeExpenses = transactions.filter((t) => t.transaction_type === 'expense' && t.amount > avgExpense * 3).length
    const avgSale = saleCount ? cashIn / saleCount : 1
    const largeSales = transactions.filter((t) => t.transaction_type === 'sale' && t.amount > avgSale * 3).length

    if (largeExpenses === 0 && largeSales === 0) {
      insights.push({
        type: 'stability',
        title: t('health.insights.stabilityGood'),
        message: t('health.insights.stabilityGoodMessage'),
        icon: CheckCircle2,
        color: '#2E7D5B',
      })
    } else if (largeExpenses > 0) {
      insights.push({
        type: 'stability',
        title: t('health.insights.stabilityExpenseSpike'),
        message: t('health.insights.stabilityExpenseSpikeMessage', { count: largeExpenses }),
        guidance: t('health.insights.stabilityGuidance'),
        icon: AlertCircle,
        color: '#B94A3A',
      })
    }

    const salesByCategory: Record<string, { count: number; amount: number }> = {}
    transactions
      .filter((t) => t.transaction_type === 'sale')
      .forEach((t) => {
        const category = t.payment_method || 'other'
        if (!salesByCategory[category]) salesByCategory[category] = { count: 0, amount: 0 }
        salesByCategory[category].count += 1
        salesByCategory[category].amount += t.amount
      })
    const topSaleCategory = Object.entries(salesByCategory).reduce(
      (max, [cat, data]) => (data.amount > max[1].amount ? [cat, data] : max),
      ['', { count: 0, amount: 0 }]
    )
    if (topSaleCategory[0] && topSaleCategory[1].count > 0) {
      insights.push({
        type: 'heroProduct',
        title: t('health.insights.heroProduct'),
        message: t('health.insights.heroProductMessage', {
          category:
            t(
              `paymentTypes.${topSaleCategory[0] === 'e_wallet' ? 'mobile_money' : topSaleCategory[0] === 'card' ? 'credit' : topSaleCategory[0]}`
            ) || topSaleCategory[0],
          count: topSaleCategory[1].count,
        }),
        guidance: t('health.insights.heroProductGuidance'),
        icon: Package,
        color: '#2E7D5B',
      })
    }

    const expensesByCategoryMap: Record<string, { count: number; amount: number }> = {}
    transactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const category = t.expense_category || 'other'
        if (!expensesByCategoryMap[category]) expensesByCategoryMap[category] = { count: 0, amount: 0 }
        expensesByCategoryMap[category].count += 1
        expensesByCategoryMap[category].amount += t.amount
      })
    const allCategories = Object.entries(expensesByCategoryMap)
    if (allCategories.length > 1) {
      const sortedCategories = [...allCategories].sort((a, b) => a[1].amount - b[1].amount)
      const lowestCategory = sortedCategories[0]
      if (lowestCategory[1].count === 1 && lowestCategory[1].amount < cashOut * 0.1) {
        insights.push({
          type: 'weakProduct',
          title: t('health.insights.weakProduct'),
          message: t('health.insights.weakProductMessage', {
            category: t(`expenseCategories.${lowestCategory[0]}`) || lowestCategory[0],
          }),
          guidance: t('health.insights.weakProductGuidance'),
          icon: AlertCircle,
          color: '#B94A3A',
        })
      }
    }

    const paymentMethodCounts: Record<string, number> = {}
    transactions
      .filter((t) => t.transaction_type === 'expense')
      .forEach((t) => {
        const method = t.payment_method || 'cash'
        paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1
      })
    const totalExpenseTransactions = transactions.filter((t) => t.transaction_type === 'expense').length
    if (totalExpenseTransactions > 0) {
      const topPaymentMethod = Object.entries(paymentMethodCounts).reduce(
        (max, [method, count]) => (count > max[1] ? [method, count] : max),
        ['', 0]
      )
      if (topPaymentMethod[1] > 0) {
        const methodPercent = (topPaymentMethod[1] / totalExpenseTransactions) * 100
        const methodLabel =
          topPaymentMethod[0] === 'card'
            ? t('expense.paymentMethod.card')
            : topPaymentMethod[0] === 'e_wallet'
              ? t('expense.paymentMethod.eWallet')
              : topPaymentMethod[0] === 'bank_transfer'
                ? t('paymentTypes.bank_transfer')
                : t('paymentTypes.cash')
        if (methodPercent > 60) {
          insights.push({
            type: 'paymentMethod',
            title: t('health.insights.paymentMethodDominant'),
            message: t('health.insights.paymentMethodDominantMessage', {
              method: methodLabel,
              percent: Math.round(methodPercent),
            }),
            guidance:
              topPaymentMethod[0] === 'card'
                ? t('health.insights.paymentMethodCreditGuidance')
                : topPaymentMethod[0] === 'cash'
                  ? t('health.insights.paymentMethodCashGuidance')
                  : undefined,
            icon: topPaymentMethod[0] === 'card' ? CreditCard : Wallet,
            color: topPaymentMethod[0] === 'card' ? '#B94A3A' : '#29978C',
          })
        }
      }
    }

    return {
      hasTransactions: true as const,
      insights,
      summary: {
        totalTransactions: totalTransactionCount,
        daysWithRecords,
        cashIn,
        cashOut,
      },
    }
  }, [
    filteredTransactions,
    totalTransactionCount,
    cashIn,
    cashOut,
    periodStart,
    today,
    prevTransactionsFiltered,
    t,
  ])

  if (isLoading) {
    return (
      <AppShell title={t('report.businessHealth.title')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse space-y-4 w-full max-w-[480px] px-6">
            <div className="h-8 bg-[var(--tally-surface)] rounded w-3/4" />
            <div className="h-4 bg-[var(--tally-surface)] rounded w-1/2" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-[var(--tally-surface)] rounded flex-1" />
              ))}
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[var(--tally-surface)] rounded-lg" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  // True empty state - only if NO transactions exist
  if (!healthData || !healthData.hasTransactions) {
    return (
      <AppShell title={t('report.businessHealth.title')} showBack showLogo>
        <div className="max-w-[480px] mx-auto pt-20 pb-40 px-4 space-y-6">
          {/* Header Block */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('report.businessHealth.title')}</h1>
            <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
          <p className="text-sm text-[var(--tally-text-muted)]">
            {t('report.businessHealth.period')}: {isCustom && customStartDate && customEndDate ? `${customStartDate} – ${customEndDate}` : t(`report.businessHealth.${periodPreset}`)}
          </p>
        </div>

          {/* Period Controls */}
          <div className="flex gap-2 flex-wrap">
            {(['last7Days', 'last30Days', 'last90Days', 'custom'] as PeriodPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setPeriodPreset(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodPreset === preset
                    ? 'bg-[#29978C] text-white'
                    : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
                }`}
              >
                {preset === 'custom' ? (t('report.common.custom') || 'Custom') : t(`report.businessHealth.${preset}`)}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="space-y-3 bg-[var(--tally-surface)] rounded-lg p-4 border border-[var(--tally-border)]">
              <div>
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.startDate')}</label>
                <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.endDate')}</label>
                <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full" />
              </div>
            </div>
          )}

          {/* Empty State: friendly illustration + single CTA */}
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                <Activity className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  No health data yet.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                  Record at least 5 transactions to see patterns here.
                </p>
              </div>
              <Link href="/sale" className="block">
                <Button className="w-full max-w-[240px] mx-auto h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t('report.businessHealth.recordSale')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('report.businessHealth.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto pt-20 pb-40 px-4 space-y-6">
        {/* Header Block */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('report.businessHealth.title')}</h1>
          <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
          <p className="text-sm text-[var(--tally-text-muted)]">
            {t('report.businessHealth.period')}: {isCustom && customStartDate && customEndDate ? `${customStartDate} – ${customEndDate}` : t(`report.businessHealth.${periodPreset}`)}
          </p>
        </div>

        {/* Period Controls */}
        <div className="flex gap-2 flex-wrap">
          {(['last7Days', 'last30Days', 'last90Days', 'custom'] as PeriodPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setPeriodPreset(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodPreset === preset
                  ? 'bg-[#29978C] text-white'
                  : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
              }`}
            >
              {preset === 'custom' ? (t('report.common.custom') || 'Custom') : t(`report.businessHealth.${preset}`)}
            </button>
          ))}
        </div>

        {isCustom && (
          <div className="space-y-3 bg-[var(--tally-surface)] rounded-lg p-4 border border-[var(--tally-border)]">
            <div>
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.startDate')}</label>
              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.endDate')}</label>
              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full" />
            </div>
          </div>
        )}

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
