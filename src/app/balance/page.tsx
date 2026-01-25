'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { format, subDays, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { generateBalanceSheetPDF } from '@/lib/pdf-generator'
import { getBusinessProfile } from '@/lib/businessProfile'
import { getInventoryItems } from '@/lib/inventory'

type PeriodPreset = 'thisWeek' | 'thisMonth' | 'last6Months' | 'thisYear' | 'custom'

export default function BalanceSheetPage() {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  
  // Get Business Profile (single source of truth for identity)
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')
  
  const today = startOfToday()
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('thisMonth')
  const [customAsAtDate, setCustomAsAtDate] = useState<string>('')

  // Calculate as at date based on preset
  const getAsAtDate = () => {
    switch (periodPreset) {
      case 'thisWeek':
      case 'thisMonth':
      case 'last6Months':
      case 'thisYear':
        return today
      case 'custom':
        return customAsAtDate ? new Date(customAsAtDate) : today
      default:
        return today
    }
  }

  const asAtDate = getAsAtDate()
  const asAtDateStr = format(asAtDate, 'yyyy-MM-dd')

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['balanceSheet', currentBusiness?.id, asAtDateStr],
    queryFn: async () => {
      if (!currentBusiness?.id) return null

      // Get all transactions up to and including as at date
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .lte('transaction_date', asAtDateStr)
        .order('transaction_date', { ascending: true })

      if (!transactions) return null

      // Get inventory items and calculate total inventory value
      let inventoryValue = 0
      try {
        const inventoryItems = await getInventoryItems(currentBusiness.id)
        // For MVP, calculate inventory value as sum of (quantity * estimated unit cost)
        // We'll use a simple approach: assume average cost from stock purchase transactions
        const stockPurchases = transactions.filter(
          t => t.transaction_type === 'expense' && t.expense_category === 'stock_purchase'
        )
        const totalStockPurchases = stockPurchases.reduce((sum, t) => sum + t.amount, 0)
        const totalStockQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
        
        // Simple valuation: if we have stock purchases, use average cost per unit
        // Otherwise, use a placeholder calculation
        if (totalStockQuantity > 0 && stockPurchases.length > 0) {
          const avgCostPerUnit = totalStockPurchases / (totalStockQuantity + stockPurchases.length)
          inventoryValue = totalStockQuantity * avgCostPerUnit
        } else {
          // Fallback: use 50% of stock purchases as inventory value
          inventoryValue = totalStockPurchases * 0.5
        }
      } catch (error) {
        console.error('[BalanceSheet] Error calculating inventory:', error)
        // Fallback to transaction-based calculation
        const stockPurchases = transactions.filter(
          t => t.transaction_type === 'expense' && t.expense_category === 'stock_purchase'
        )
        inventoryValue = stockPurchases.reduce((sum, t) => sum + t.amount, 0) * 0.5
      }

      // Calculate Assets
      const startingCash = currentBusiness.starting_cash || 0
      const startingBank = currentBusiness.starting_bank || 0

      const cashSales = transactions
        .filter(t => t.transaction_type === 'sale' && t.payment_type === 'cash')
        .reduce((sum, t) => sum + t.amount, 0)

      const cashExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && t.payment_type === 'cash')
        .reduce((sum, t) => sum + t.amount, 0)

      const currentCash = startingCash + cashSales - cashExpenses

      const bankSales = transactions
        .filter(t => t.transaction_type === 'sale' && (t.payment_type === 'bank_transfer' || t.payment_type === 'duitnow'))
        .reduce((sum, t) => sum + t.amount, 0)

      const bankExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && (t.payment_type === 'bank_transfer' || t.payment_type === 'duitnow'))
        .reduce((sum, t) => sum + t.amount, 0)

      const currentBank = startingBank + bankSales - bankExpenses

      const receivables = transactions
        .filter(t => t.transaction_type === 'sale' && t.payment_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)

      // Other Assets (placeholder - can be expanded)
      const otherAssets = 0

      // Calculate Liabilities
      const payables = transactions
        .filter(t => t.transaction_type === 'expense' && t.payment_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)

      const loans = 0

      // Calculate Equity
      const startingCapital = startingCash + startingBank

      const totalRevenue = transactions
        .filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const retainedEarnings = totalRevenue - totalExpenses
      const ownersEquity = startingCapital + retainedEarnings

      // Calculate totals
      const totalAssets = currentCash + currentBank + receivables + inventoryValue + otherAssets
      const totalLiabilities = payables + loans
      const totalEquity = ownersEquity

      // Balance check
      const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity))
      const isBalanced = balanceCheck < 0.01

      return {
        assets: {
          cash: currentCash,
          bank: currentBank,
          receivables,
          inventory: inventoryValue,
          total: totalAssets,
        },
        liabilities: {
          payables,
          loans,
          total: totalLiabilities,
        },
        equity: {
          startingCapital,
          retainedEarnings,
          total: totalEquity,
        },
        balanceCheck,
        isBalanced,
      }
    },
    enabled: !!currentBusiness?.id,
  })

  const handleExportPDF = async () => {
    if (!balanceData || !currentBusiness) return

    const businessName = enterpriseName || 'Business'
    const businessType = currentBusiness?.business_type || 'N/A'
    const businessState = businessProfile?.stateOrRegion || currentBusiness?.state || 'N/A'
    const businessCity = businessProfile?.area || currentBusiness?.city || ''

    generateBalanceSheetPDF({
      business: {
        name: businessName,
        type: businessType,
        state: businessState,
        city: businessCity
      },
      asAtDate: asAtDate,
      balanceSheet: balanceData,
    })
  }

  if (isLoading || !balanceData) {
    return (
      <AppShell title={t('report.balanceSheet.title')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[var(--tally-text-muted)]">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t('report.balanceSheet.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">
        {/* Header Block */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('report.balanceSheet.title')}</h1>
          <p className="text-base font-medium text-[var(--tally-text)]">{enterpriseName}</p>
          <p className="text-sm text-[var(--tally-text-muted)]">
            {t('report.balanceSheet.asAt')} {format(asAtDate, 'd MMM yyyy')}
          </p>
        </div>

        {/* Period Selector */}
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
            onClick={() => setPeriodPreset('last6Months')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'last6Months'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.last6Months')}
          </button>
          <button
            onClick={() => setPeriodPreset('thisYear')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodPreset === 'thisYear'
                ? 'bg-[#29978C] text-white'
                : 'bg-[var(--tally-surface)] border border-[var(--tally-border)] text-[var(--tally-text)]'
            }`}
          >
            {t('report.common.thisYear')}
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

        {/* Custom Date Picker */}
        {periodPreset === 'custom' && (
          <div className="bg-[var(--tally-surface)] rounded-lg p-4 border border-[var(--tally-border)]">
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2">{t('report.balanceSheet.asAt')}</label>
            <Input
              type="date"
              value={customAsAtDate}
              onChange={(e) => setCustomAsAtDate(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Assets Card */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#2E7D5B]">{t('report.balanceSheet.totalAssets')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.cashOnHand')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.assets.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.bankAccount')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.assets.bank)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.inventoryValue')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.assets.inventory)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--tally-border)]">
              <div className="flex justify-between font-bold">
                <span className="text-[#2E7D5B]">{t('report.balanceSheet.totalAssets')}</span>
                <span className="text-[#2E7D5B]">{formatCurrency(balanceData.assets.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities Card */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#B94A3A]">{t('report.balanceSheet.totalLiabilities')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.payables')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.liabilities.payables)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.loans')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.liabilities.loans)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--tally-border)]">
              <div className="flex justify-between font-bold">
                <span className="text-[#B94A3A]">{t('report.balanceSheet.totalLiabilities')}</span>
                <span className="text-[#B94A3A]">{formatCurrency(balanceData.liabilities.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equity Card */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)]">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--tally-text)]">{t('report.balanceSheet.totalEquity')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.ownersEquity')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.equity.total)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--tally-border)]">
              <div className="flex justify-between font-bold">
                <span className="text-[var(--tally-text)]">{t('report.balanceSheet.totalEquity')}</span>
                <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.equity.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balanced Banner */}
        {balanceData.isBalanced ? (
          <div className="bg-[rgba(46,125,91,0.1)] border border-[#2E7D5B] rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D5B]" />
            <div>
              <p className="text-sm font-medium text-[var(--tally-text)]">{t('report.balanceSheet.balanced')}</p>
              <p className="text-xs text-[var(--tally-text-muted)]">Assets = Liabilities + Equity</p>
            </div>
          </div>
        ) : (
          <div className="bg-[rgba(185,74,58,0.1)] border border-[#B94A3A] rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#B94A3A]" />
            <div>
              <p className="text-sm font-medium text-[var(--tally-text)]">{t('report.balanceSheet.notBalanced')}</p>
              <p className="text-xs text-[var(--tally-text-muted)]">{t('report.balanceSheet.balanceHint')}</p>
            </div>
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
      </div>
    </AppShell>
  )
}
