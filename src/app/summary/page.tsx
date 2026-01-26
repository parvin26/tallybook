'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { generateBusinessReportPDF } from '@/lib/pdf-generator'
import { getBusinessProfile } from '@/lib/businessProfile'
import { Input } from '@/components/ui/input'

type PeriodPreset = 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'

export default function ProfitLossPage() {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  
  // Get Business Profile (single source of truth for identity)
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')
  
  const today = startOfToday()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('thisMonth')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [revenueExpanded, setRevenueExpanded] = useState(false)
  const [expensesExpanded, setExpensesExpanded] = useState(false)

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

  const { data: plData, isLoading } = useQuery({
    queryKey: ['profitLoss', currentBusiness?.id, queryStartDate, queryEndDate],
    queryFn: async () => {
      if (!currentBusiness?.id) return null
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', queryStartDate)
        .lte('transaction_date', queryEndDate)
        .order('transaction_date', { ascending: true })
      
      if (error) throw error
      
      // Calculate revenue by payment type
      const revenueByType: Record<string, number> = {
        cash: 0,
        bank_transfer: 0,
        duitnow: 0,
        other: 0
      }
      
      transactions?.filter(t => t.transaction_type === 'sale').forEach(t => {
        if (t.payment_type === 'cash') {
          revenueByType.cash += t.amount
        } else if (t.payment_type === 'bank_transfer') {
          revenueByType.bank_transfer += t.amount
        } else if (t.payment_type === 'duitnow' || t.payment_type === 'mobile_money') {
          revenueByType.duitnow += t.amount
        } else {
          revenueByType.other += t.amount
        }
      })
      
      const totalRevenue = Object.values(revenueByType).reduce((sum, val) => sum + val, 0)
      
      // Calculate expenses by category
      const expensesByCategory: Record<string, number> = {}
      
      transactions?.filter(t => t.transaction_type === 'expense').forEach(t => {
        const category = t.expense_category || 'other'
        expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount
      })
      
      const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0)
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      
      return {
        revenueByType,
        totalRevenue,
        expensesByCategory,
        totalExpenses,
        netProfit,
        profitMargin
      }
    },
    enabled: !!currentBusiness?.id
  })

  const handleExportPDF = async () => {
    if (!plData || !currentBusiness) return

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', currentBusiness.id)
      .gte('transaction_date', queryStartDate)
      .lte('transaction_date', queryEndDate)
      .order('transaction_date', { ascending: false })

    const businessName = enterpriseName || 'Business'
    const businessType = currentBusiness?.business_type || 'N/A'
    const businessState = businessProfile?.stateOrRegion || currentBusiness?.state || 'N/A'
    const businessCity = businessProfile?.area || currentBusiness?.city || ''
    
    generateBusinessReportPDF({
      business: {
        name: businessName,
        type: businessType,
        state: businessState,
        city: businessCity
      },
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      profitLoss: {
        revenue: {
          cash: plData.revenueByType.cash,
          credit: plData.revenueByType.other,
          total: plData.totalRevenue
        },
        expenses: plData.expensesByCategory,
        totalExpenses: plData.totalExpenses,
        netProfit: plData.netProfit,
        profitMargin: plData.profitMargin
      },
      transactions: transactions || []
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
          <p className="text-[var(--tally-text-muted)]">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('report.profitLoss.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">
        {/* Header Block */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('report.profitLoss.title')}</h1>
          <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
          <p className="text-sm text-[var(--tally-text-muted)]">{formatPeriod()}</p>
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

        {!plData ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
                <CardContent className="p-4">
                  <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('report.profitLoss.totalRevenue')}</p>
                  <p className="text-lg font-bold text-[var(--tally-text)]">{formatCurrency(plData.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
                <CardContent className="p-4">
                  <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('report.profitLoss.totalExpenses')}</p>
                  <p className="text-lg font-bold text-[var(--tally-text)]">{formatCurrency(plData.totalExpenses)}</p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
                <CardContent className="p-4">
                  <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('report.profitLoss.netProfit')}</p>
                  <p className={`text-lg font-bold ${plData.netProfit >= 0 ? 'text-[#2E7D5B]' : 'text-[#B94A3A]'}`}>
                    {formatCurrency(plData.netProfit)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
                <CardContent className="p-4">
                  <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('summary.profitMargin')}</p>
                  <p className="text-lg font-bold text-[var(--tally-text)]">{plData.profitMargin.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Card */}
            <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
              <CardContent className="p-6 space-y-6">
                {/* Revenue Section */}
                <div>
                  <button
                    onClick={() => setRevenueExpanded(!revenueExpanded)}
                    className="w-full flex items-center justify-between"
                  >
                    <h2 className="text-lg font-semibold text-[#2E7D5B]">{t('report.profitLoss.revenue')}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-[var(--tally-text)]">
                        {formatCurrency(plData.totalRevenue)}
                      </span>
                      {revenueExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--tally-text-muted)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--tally-text-muted)]" />
                      )}
                    </div>
                  </button>
                  {revenueExpanded && (
                    <div className="mt-4 space-y-2 pl-4">
                      {plData.revenueByType.cash > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--tally-text)]">{t('report.profitLoss.cash')}</span>
                          <span className="text-[var(--tally-text)]">{formatCurrency(plData.revenueByType.cash)}</span>
                        </div>
                      )}
                      {plData.revenueByType.bank_transfer > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--tally-text)]">{t('report.profitLoss.bankTransfer')}</span>
                          <span className="text-[var(--tally-text)]">{formatCurrency(plData.revenueByType.bank_transfer)}</span>
                        </div>
                      )}
                      {plData.revenueByType.duitnow > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--tally-text)]">{t('report.profitLoss.mobileMoney')}</span>
                          <span className="text-[var(--tally-text)]">{formatCurrency(plData.revenueByType.duitnow)}</span>
                        </div>
                      )}
                      {plData.revenueByType.other > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--tally-text)]">{t('report.profitLoss.other')}</span>
                          <span className="text-[var(--tally-text)]">{formatCurrency(plData.revenueByType.other)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expenses Section */}
                <div>
                  <button
                    onClick={() => setExpensesExpanded(!expensesExpanded)}
                    className="w-full flex items-center justify-between"
                  >
                    <h2 className="text-lg font-semibold text-[#B94A3A]">{t('report.profitLoss.expenses')}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-[var(--tally-text)]">
                        {formatCurrency(plData.totalExpenses)}
                      </span>
                      {expensesExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--tally-text-muted)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--tally-text-muted)]" />
                      )}
                    </div>
                  </button>
                  {expensesExpanded && (
                    <div className="mt-4 space-y-2 pl-4">
                      {Object.entries(plData.expensesByCategory).map(([category, amount]) => (
                        amount > 0 && (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="text-[var(--tally-text)]">
                              {t(`expenseCategories.${category}`) || category}
                            </span>
                            <span className="text-[var(--tally-text)]">{formatCurrency(amount)}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Net Profit Row */}
                <div className="pt-4 border-t border-[var(--tally-border)]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[var(--tally-text)]">{t('report.profitLoss.netProfit')}</h3>
                    <span className={`text-lg font-semibold ${
                      plData.netProfit >= 0 ? 'text-[#2E7D5B]' : 'text-[#B94A3A]'
                    }`}>
                      {formatCurrency(Math.abs(plData.netProfit))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Banner */}
            {plData.netProfit >= 0 ? (
              <div className="bg-[rgba(46,125,91,0.1)] border border-[#2E7D5B] rounded-lg p-4">
                <p className="text-sm text-[var(--tally-text)]">
                  {t('report.profitLoss.profitMessage', { amount: formatCurrency(plData.netProfit) })}
                </p>
              </div>
            ) : (
              <div className="bg-[rgba(185,74,58,0.1)] border border-[#B94A3A] rounded-lg p-4">
                <p className="text-sm text-[var(--tally-text)]">
                  {t('report.profitLoss.lossMessage', { amount: formatCurrency(Math.abs(plData.netProfit)) })}
                </p>
              </div>
            )}

            {/* Export Button */}
            <Button
              className="w-full h-14 bg-[#29978C] hover:bg-[#238579] text-white"
              size="lg"
              onClick={handleExportPDF}
            >
              <Download className="w-5 h-5 mr-2" />
              {t('report.common.exportPDF')}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
