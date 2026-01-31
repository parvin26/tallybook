'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfToday } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { useReportsData } from '@/hooks/useReportsData'
import { useCurrency } from '@/hooks/useCurrency'
import { formatCurrency, formatCurrencyAmount } from '@/lib/utils'
import { StatCard } from '@/components/reports/StatCard'
import { ExpensePieChart } from '@/components/reports/ExpensePieChart'
import { SalesByItemPieChart } from '@/components/reports/SalesByItemPieChart'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, TrendingUp, Heart, Pencil } from 'lucide-react'

type PeriodMode = 'month' | 'year' | 'custom'

interface ReportPeriod {
  startDate: string
  endDate: string
  periodLabel: string
}

function getDefaultPeriod(): ReportPeriod {
  const today = startOfToday()
  const start = startOfMonth(today)
  const end = endOfMonth(today)
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    periodLabel: format(start, 'MMMM yyyy'),
  }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getYears(): number[] {
  const y = new Date().getFullYear()
  return [y + 1, y, y - 1, y - 2, y - 3]
}

export default function ReportsHubPage() {
  const { t } = useTranslation()

  const [period, setPeriod] = useState<ReportPeriod>(getDefaultPeriod)
  const [periodSelectorOpen, setPeriodSelectorOpen] = useState(false)
  const [selectorMode, setSelectorMode] = useState<PeriodMode>('month')
  const [selectorMonth, setSelectorMonth] = useState(() => new Date().getMonth())
  const [selectorYear, setSelectorYear] = useState(() => new Date().getFullYear())
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [snapshotTab, setSnapshotTab] = useState<'sales' | 'expenses'>('sales')

  const { symbol: currencySymbol } = useCurrency()
  const {
    isLoading,
    totalRevenue,
    totalExpenses,
    netProfit,
    expensesByCategory,
    salesByItem,
  } = useReportsData({ startDate: period.startDate, endDate: period.endDate })

  const safeRevenue = Number(totalRevenue) || 0
  const safeExpenses = Number(totalExpenses) || 0
  const safeProfit = Number(netProfit) || 0

  const applyPeriod = () => {
    const today = startOfToday()
    if (selectorMode === 'month') {
      const d = new Date(selectorYear, selectorMonth, 1)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      setPeriod({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        periodLabel: format(start, 'MMMM yyyy'),
      })
    } else if (selectorMode === 'year') {
      const y = selectorYear
      const start = startOfYear(new Date(y, 0, 1))
      const end = endOfYear(new Date(y, 0, 1))
      setPeriod({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        periodLabel: String(y),
      })
    } else {
      if (!customStart || !customEnd) return
      const startD = new Date(customStart)
      const endD = new Date(customEnd)
      if (startD > endD) return
      setPeriod({
        startDate: customStart,
        endDate: customEnd,
        periodLabel: `${format(startD, 'MMM d')} to ${format(endD, 'MMM d yyyy')}`,
      })
    }
    setPeriodSelectorOpen(false)
  }

  const openSelector = () => {
    setSelectorMonth(new Date(period.startDate).getMonth())
    setSelectorYear(new Date(period.startDate).getFullYear())
    setCustomStart(period.startDate)
    setCustomEnd(period.endDate)
    setPeriodSelectorOpen(true)
  }

  if (isLoading) {
    return (
      <AppShell title={t('nav.reports')} showBack showLogo>
        <div className="pt-20 pb-24 px-4 flex items-center justify-center min-h-[40vh]">
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('nav.reports')} showBack showLogo>
      <div className="pt-20 pb-24 px-4 space-y-4 sm:space-y-6 max-w-[480px] mx-auto">
        {/* Header: title exactly "Business Snapshot"; period as secondary with edit icon */}
        <div>
          <h1 className="text-tally-page-title font-bold text-gray-900">Business Snapshot</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-tally-caption text-gray-500">{period.periodLabel}</p>
            <button
              type="button"
              onClick={openSelector}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={t('common.edit') || 'Change period'}
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Big Cards: grid-cols-3 */}
        <div className="grid grid-cols-3 gap-3 min-w-0">
          <StatCard
            title={t('report.profitLoss.totalRevenue') || 'Total Revenue'}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeRevenue)}
            type="revenue"
          />
          <StatCard
            title={t('report.profitLoss.totalExpenses') || 'Total Expenses'}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeExpenses)}
            type="expense"
          />
          <StatCard
            title={t('report.profitLoss.netProfit') || 'Net Profit'}
            currencyLabel={currencySymbol}
            amount={formatCurrencyAmount(safeProfit)}
            type="profit"
          />
        </div>

        {/* Snapshot: one tabbed card — Sales | Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs: Sales | Expenses */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setSnapshotTab('sales')}
              className={`flex-1 py-3 px-4 text-tally-body font-semibold transition-colors ${
                snapshotTab === 'sales'
                  ? 'text-[#166556] border-b-2 border-[#166556] bg-[#166556]/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('report.snapshot.sales') || 'Sales'}
            </button>
            <button
              type="button"
              onClick={() => setSnapshotTab('expenses')}
              className={`flex-1 py-3 px-4 text-tally-body font-semibold transition-colors ${
                snapshotTab === 'expenses'
                  ? 'text-[#166556] border-b-2 border-[#166556] bg-[#166556]/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('report.snapshot.expenses') || 'Expenses'}
            </button>
          </div>

          {snapshotTab === 'sales' && (
            <div className="p-3 sm:p-4">
              {salesByItem.length > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {/* Donut + legend: hidden on mobile; min-width so legend percent is not clipped */}
                  <div className="hidden sm:block flex-shrink-0 min-w-[320px]">
                    <SalesByItemPieChart salesByItem={salesByItem} />
                  </div>
                  <div className="flex-1 min-w-0 overflow-x-auto">
                    <table className="w-full text-tally-body">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-3 font-medium">{t('report.salesByItem.item') || 'Item'}</th>
                          <th className="py-2 pr-3 font-medium text-right">{t('report.salesByItem.qty') || 'Qty'}</th>
                          <th className="py-2 font-medium text-right">{t('report.salesByItem.amount') || 'Amount'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesByItem.map((row) => (
                          <tr key={row.itemId} className="border-b border-gray-100">
                            <td className="py-2 pr-3 text-gray-900">{row.itemName}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{row.quantity}</td>
                            <td className="py-2 text-right tabular-nums font-medium text-[#166556]">
                              {formatCurrency(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-tally-caption text-gray-500 py-4 text-center">
                  {t('report.salesByItem.empty') || 'No sales by item for this period.'}
                </p>
              )}
            </div>
          )}

          {snapshotTab === 'expenses' && (
            <div className="p-3 sm:p-4">
              <ExpensePieChart
                expensesByCategory={expensesByCategory}
                layout="row"
                maxCategories={3}
                compact
                embedded
              />
            </div>
          )}
        </div>

        {/* Detailed Reports */}
        <div className="mt-4 sm:mt-6">
          <h2 className="text-tally-section-title font-semibold text-gray-900 mb-3">Detailed Reports</h2>
          <div className="grid grid-cols-3 gap-2 flex-nowrap">
            <Link
              href="/summary"
              className="flex flex-col items-center gap-1 rounded-lg p-2 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/80 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-white" aria-hidden />
              </div>
              <span className="text-tally-caption font-medium text-gray-800 text-center leading-tight">
                {t('report.profitLoss.title') || 'Profit & Loss'}
              </span>
            </Link>
            <Link
              href="/balance"
              className="flex flex-col items-center gap-1 rounded-lg p-2 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-white" aria-hidden />
              </div>
              <span className="text-tally-caption font-medium text-gray-800 text-center leading-tight">
                {t('report.balanceSheet.title') || 'Balance Sheet'}
              </span>
            </Link>
            <Link
              href="/health"
              className="flex flex-col items-center gap-1 rounded-lg p-2 border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                <Heart className="h-4 w-4 text-white" aria-hidden />
              </div>
              <span className="text-tally-caption font-medium text-gray-800 text-center leading-tight">
                {t('report.businessHealth.title') || 'Business Health'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Period selector dialog: Month | Year | Custom range */}
      <Dialog open={periodSelectorOpen} onOpenChange={setPeriodSelectorOpen}>
        <DialogContent className="max-w-[360px] bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-tally-section-title font-semibold text-gray-900">
              {t('report.periodSelector.title') || 'Reporting period'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => setSelectorMode('month')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectorMode === 'month' ? 'bg-[#29978C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('report.periodSelector.month') || 'Month'}
              </button>
              <button
                type="button"
                onClick={() => setSelectorMode('year')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectorMode === 'year' ? 'bg-[#29978C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('report.periodSelector.year') || 'Year'}
              </button>
              <button
                type="button"
                onClick={() => setSelectorMode('custom')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectorMode === 'custom' ? 'bg-[#29978C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('report.periodSelector.custom') || 'Custom'}
              </button>
            </div>

            {selectorMode === 'month' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('report.periodSelector.monthLabel') || 'Month'}</label>
                  <select
                    value={selectorMonth}
                    onChange={(e) => setSelectorMonth(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('report.periodSelector.yearLabel') || 'Year'}</label>
                  <select
                    value={selectorYear}
                    onChange={(e) => setSelectorYear(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  >
                    {getYears().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectorMode === 'year' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('report.periodSelector.yearLabel') || 'Year'}</label>
                <select
                  value={selectorYear}
                  onChange={(e) => setSelectorYear(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                >
                  {getYears().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {selectorMode === 'custom' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('report.periodSelector.startDate') || 'Start date'}</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{t('report.periodSelector.endDate') || 'End date'}</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPeriodSelectorOpen(false)}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                type="button"
                className="flex-1 bg-[#29978C] hover:bg-[#238579] text-white"
                onClick={applyPeriod}
                disabled={selectorMode === 'custom' && (!customStart || !customEnd)}
              >
                {t('common.apply') || 'Apply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
