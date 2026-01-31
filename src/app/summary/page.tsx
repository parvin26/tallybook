'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useBusiness } from '@/contexts/BusinessContext'
import { useReportsData } from '@/hooks/useReportsData'
import { useCurrency } from '@/hooks/useCurrency'
import { formatCurrency, formatCurrencyAmount } from '@/lib/utils'
import { format, subDays, startOfToday, startOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { RevenueExpenseBarChart } from '@/components/reports/RevenueExpenseBarChart'
import { StatCard } from '@/components/reports/StatCard'
import { generateBusinessReportPDF } from '@/lib/pdf-generator'
import { getBusinessProfile } from '@/lib/businessProfile'
import { Input } from '@/components/ui/input'

type PeriodPreset = 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'

export default function ProfitLossPage() {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  const { symbol: currencySymbol } = useCurrency()
  
  // Get Business Profile (single source of truth for identity)
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')
  
  const today = startOfToday()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('thisMonth')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Calculate date range based on preset
  const getDateRange = () => {
    switch (periodPreset) {
      case 'thisWeek':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: today }
      case 'thisMonth':
        return { start: startOfMonth(today), end: today }
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subDays(today, 30))
        const lastMonthEnd = endOfMonth(subDays(today, 30))
        return { start: lastMonthStart, end: lastMonthEnd }
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : subDays(today, 30),
          end: customEndDate ? new Date(customEndDate) : today
        }
      default:
        return { start: startOfMonth(today), end: today }
    }
  }

  const dateRange = getDateRange()
  const queryStartDate = format(dateRange.start, 'yyyy-MM-dd')
  const queryEndDate = format(dateRange.end, 'yyyy-MM-dd')

  const {
    isLoading,
    filteredTransactions,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    revenueByType,
    expensesByCategory,
  } = useReportsData({ startDate: queryStartDate, endDate: queryEndDate })

  const safeRevenue = Number(totalRevenue) || 0
  const safeExpenses = Number(totalExpenses) || 0
  const safeProfit = Number(netProfit) || 0
  const safeMargin = Number(profitMargin) || 0

  const handleExportPDF = () => {
    toast.info(t('report.common.generatingReport') || 'Generating Report...')
    const businessName = enterpriseName || 'Business'
    const business = currentBusiness
    const businessType = business?.business_type || 'N/A'
    const businessState = businessProfile?.stateOrRegion || business?.state || 'N/A'
    const businessCity = businessProfile?.area || business?.city || ''
    const logo = businessProfile?.logoDataUrl

    generateBusinessReportPDF({
      business: {
        name: businessName,
        type: businessType,
        state: businessState,
        city: businessCity,
        logo,
      },
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end,
      },
      profitLoss: {
        revenue: {
          cash: revenueByType.cash,
          credit: revenueByType.other,
          total: safeRevenue,
        },
        expenses: expensesByCategory,
        totalExpenses: safeExpenses,
        netProfit: safeProfit,
        profitMargin: safeMargin,
      },
      transactions: filteredTransactions.map((t) => ({
        id: t.id,
        transaction_type: t.transaction_type,
        amount: t.amount,
        payment_method: t.payment_method,
        expense_category: t.expense_category ?? undefined,
        notes: t.notes ?? undefined,
        transaction_date: t.transaction_date,
      })),
    })
  }

  const formatPeriod = () => {
    if (periodPreset === 'custom' && customStartDate && customEndDate) {
      return `${format(new Date(customStartDate), 'd MMM yyyy')} to ${format(new Date(customEndDate), 'd MMM yyyy')}`
    }
    return `${format(dateRange.start, 'd MMM yyyy')} to ${format(dateRange.end, 'd MMM yyyy')}`
  }

  if (isLoading) {
    return (
      <AppShell title={t('report.profitLoss.title')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse space-y-4 w-full max-w-[480px] px-6">
            <div className="h-8 bg-[var(--tally-surface)] rounded w-3/4" />
            <div className="h-4 bg-[var(--tally-surface)] rounded w-1/2" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-[var(--tally-surface)] rounded flex-1" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-[var(--tally-surface)] rounded-lg" />
              ))}
            </div>
            <div className="h-32 bg-[var(--tally-surface)] rounded-lg" />
          </div>
        </div>
      </AppShell>
    )
  }

  const expenseEntries = Object.entries(expensesByCategory).filter(([, amt]) => amt > 0)
  const totalExpensesForPct = safeExpenses > 0 ? safeExpenses : 1
  const highestExpense = expenseEntries.length > 0
    ? expenseEntries.reduce((a, b) => (a[1] >= b[1] ? a : b), ['other', 0])
    : null
  const highestPct = highestExpense ? ((highestExpense[1] / totalExpensesForPct) * 100).toFixed(0) : '0'
  const revenueByTypeEntries = Object.entries(revenueByType || {}).filter(([, amt]) => amt > 0)
  const highestCategoryLabel = highestExpense ? (t(`expenseCategories.${highestExpense[0]}`) || highestExpense[0]) : ''

  return (
    <AppShell title={t('report.profitLoss.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto pt-20 pb-24 px-4 space-y-6">
        {/* Header Block — mt-6 ensures spacing below header / above content */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('report.profitLoss.title')}</h1>
          <p className="text-base font-medium text-gray-700">{enterpriseName}</p>
          <p className="text-sm text-gray-500">{formatPeriod()}</p>
        </div>

        {/* Period Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPeriodPreset('thisWeek')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'thisWeek'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.thisWeek')}
          </button>
          <button
            onClick={() => setPeriodPreset('thisMonth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'thisMonth'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.thisMonth')}
          </button>
          <button
            onClick={() => setPeriodPreset('lastMonth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'lastMonth'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.lastMonth')}
          </button>
          <button
            onClick={() => setPeriodPreset('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'custom'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.custom')}
          </button>
        </div>

        {/* Custom Date Pickers */}
        {periodPreset === 'custom' && (
          <div className="space-y-3 bg-[var(--tally-surface)] rounded-lg p-4 border border-[var(--tally-border)]">
            <div>
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.startDate')}</label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('dateRange.endDate')}</label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Cards: Revenue vs Expense side-by-side */}
        <div className="grid grid-cols-2 gap-3 min-w-0">
          <StatCard
            title={t('report.profitLoss.totalRevenue')}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeRevenue)}
            type="revenue"
          />
          <StatCard
            title={t('report.profitLoss.totalExpenses')}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeExpenses)}
            type="expense"
          />
          <StatCard
            title={t('report.profitLoss.netProfit')}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeProfit)}
            type="profit"
          />
          <Card className="rounded-xl border border-[#2D5B85]/20 bg-[#F0F5FA] p-4">
            <CardContent className="p-0">
              <p className="text-xs font-medium text-[#2D5B85] opacity-90">{t('summary.profitMargin')}</p>
              <p className="text-lg md:text-2xl font-bold tabular-nums text-[#2D5B85]">{safeMargin.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart: Revenue vs Expense */}
        <RevenueExpenseBarChart totalRevenue={safeRevenue} totalExpenses={safeExpenses} />

        {/* Expenses by Category: rows with progress bar */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('report.profitLoss.expenses')} by category</h3>
          {expenseEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No expenses in this period.</p>
          ) : (
            <div className="space-y-2">
              {expenseEntries.map(([category, amount]) => {
                const pct = (amount / totalExpensesForPct) * 100
                return (
                  <div key={category} className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <div
                      className="absolute inset-y-0 left-0 bg-rose-100"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">
                        {t(`expenseCategories.${category}`) || category}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-gray-800">
                        {formatCurrency(amount)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sales by payment method */}
        {revenueByTypeEntries.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('report.profitLoss.salesByPayment') || 'Sales by payment method'}</h3>
            <div className="space-y-2">
              {revenueByTypeEntries.map(([method, amount]) => {
                const pct = safeRevenue > 0 ? (amount / safeRevenue) * 100 : 0
                const label = method === 'duitnow' ? 'e_wallet' : method
                return (
                  <div key={method} className="relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-100"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">
                        {t(`paymentTypes.${label}`) || label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-gray-800">
                        {formatCurrency(amount)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Coachmark: highest expense category */}
        {highestExpense && Number(highestPct) > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Your biggest cost is <strong>{highestCategoryLabel}</strong>. It makes up {highestPct}% of your spending.
            </p>
          </div>
        )}

        {/* Support Banner */}
        {safeProfit >= 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-900">
              {t('report.profitLoss.profitMessage', { amount: formatCurrency(safeProfit) })}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-900">
              {t('report.profitLoss.lossMessage', { amount: formatCurrency(Math.abs(safeProfit)) })}
            </p>
          </div>
        )}

        {/* Export Button */}
        <Button
          className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          size="lg"
          onClick={handleExportPDF}
        >
          <Download className="w-5 h-5 mr-2" />
          {t('report.common.exportPDF')}
        </Button>
      </div>
    </AppShell>
  )
}
