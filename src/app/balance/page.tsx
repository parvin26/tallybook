'use client'

import { useState, useMemo } from 'react'
import { useBusiness } from '@/contexts/BusinessContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useTransactions } from '@/hooks/useTransactions'
import { useInventory } from '@/hooks/useInventory'
import { formatCurrency } from '@/lib/utils'
import { format, startOfToday } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { generateBalanceSheetPDF } from '@/lib/pdf-generator'
import { getBusinessProfile } from '@/lib/businessProfile'
import { getGuestBusiness, isGuestMode } from '@/lib/guest-storage'

type PeriodPreset = 'thisWeek' | 'thisMonth' | 'last6Months' | 'thisYear' | 'custom'

/** Resolve translation; if key is returned unchanged (missing), use fallback so raw keys never show. */
function tr(key: string, fallback: string, t: (k: string) => string): string {
  const v = t(key)
  return v === key ? fallback : v
}

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

  const { data: transactions = [], isLoading } = useTransactions()
  const { items: inventoryItems = [] } = useInventory()

  const balanceData = useMemo(() => {
    const manualOverride =
      typeof window !== 'undefined'
        ? (() => {
            try {
              const raw = localStorage.getItem('tally-inventory-manual-override')
              if (!raw) return null
              const parsed = JSON.parse(raw) as { value?: number }
              return typeof parsed?.value === 'number' ? parsed.value : null
            } catch {
              return null
            }
          })()
        : null

    const filtered = (transactions || []).filter(
      (t) => t.transaction_date && t.transaction_date <= asAtDateStr
    )

    const startingCash =
      currentBusiness != null
        ? (currentBusiness.starting_cash ?? 0)
        : (typeof window !== 'undefined' && isGuestMode()
            ? (getGuestBusiness()?.starting_cash ?? 0)
            : 0)
    const startingBank =
      currentBusiness != null
        ? (currentBusiness.starting_bank ?? 0)
        : (typeof window !== 'undefined' && isGuestMode()
            ? (getGuestBusiness()?.starting_bank ?? 0)
            : 0)

    const isCashPayment = (t: { payment_method: string }) => t.payment_method === 'cash'
    const isBankPayment = (t: { payment_method: string }) =>
      t.payment_method === 'bank_transfer' || t.payment_method === 'e_wallet'
    const isCardPayment = (t: { payment_method: string }) => t.payment_method === 'card'

    const cashSales = filtered
      .filter((t) => t.transaction_type === 'sale' && t.payment_method === 'cash')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const cashExpenses = filtered
      .filter((t) => t.transaction_type === 'expense' && isCashPayment(t))
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const currentCash = startingCash + cashSales - cashExpenses

    const bankSales = filtered
      .filter(
        (t) =>
          t.transaction_type === 'sale' &&
          (t.payment_method === 'bank_transfer' || t.payment_method === 'e_wallet')
      )
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const bankExpenses = filtered
      .filter((t) => t.transaction_type === 'expense' && isBankPayment(t))
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const currentBank = startingBank + bankSales - bankExpenses

    const receivables = filtered
      .filter((t) => t.transaction_type === 'sale' && t.payment_method === 'card')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const calculatedInventoryValue = inventoryItems.reduce((sum, item) => {
      return sum + item.quantity * (item.cost_price ?? 0)
    }, 0)
    const inventoryValue = manualOverride ?? calculatedInventoryValue

    const creditExpenses = filtered
      .filter((t) => t.transaction_type === 'expense' && isCardPayment(t))
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const payables = creditExpenses
    const loans = 0

    const startingCapital = startingCash + startingBank
    const totalRevenue = filtered
      .filter((t) => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = filtered
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const retainedEarnings = totalRevenue - totalExpenses
    const totalEquity = startingCapital + retainedEarnings

    const totalAssets = currentCash + currentBank + receivables + inventoryValue
    const totalLiabilities = payables + loans
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
      liabilities: { payables, loans, total: totalLiabilities },
      equity: { startingCapital, retainedEarnings, total: totalEquity },
      balanceCheck,
      isBalanced,
      inventory: {
        value: inventoryValue,
        isEstimated: false,
        isManual: manualOverride != null,
      },
    }
  }, [transactions, asAtDateStr, currentBusiness?.starting_cash, currentBusiness?.starting_bank, inventoryItems])

  const handleExportPDF = () => {
    if (!balanceData) return
    toast.info(t('report.common.generatingReport') || 'Generating Report...')
    const businessName =
      enterpriseName ||
      (typeof window !== 'undefined' && isGuestMode() ? getGuestBusiness()?.name : null) ||
      'Business'
    const businessType = currentBusiness?.business_type ?? businessProfile?.businessCategory ?? 'N/A'
    const businessState = businessProfile?.stateOrRegion ?? currentBusiness?.state ?? 'N/A'
    const businessCity = businessProfile?.area ?? currentBusiness?.city ?? ''
    const logo = businessProfile?.logoDataUrl

    try {
      generateBalanceSheetPDF({
        business: {
          name: businessName,
          type: businessType,
          state: businessState,
          city: businessCity,
          logo,
        },
        asAtDate: asAtDate,
        balanceSheet: {
          assets: balanceData.assets,
          liabilities: balanceData.liabilities,
          equity: balanceData.equity,
          balanceCheck: balanceData.balanceCheck,
          isBalanced: balanceData.isBalanced,
        },
      })
      toast.success(t('report.common.exportSuccess') || 'PDF downloaded')
    } catch (err) {
      console.error('[Balance] PDF export error:', err)
      toast.error(t('common.couldntSave') || "Couldn't download PDF")
    }
  }

  if (isLoading) {
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
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--tally-text)]">
                      {balanceData.inventory?.isManual
                        ? tr('report.balance.inventory.manualLabel', 'Inventory (Manual)', t)
                        : balanceData.inventory?.isEstimated
                        ? tr('report.balance.inventory.estimatedLabel', 'Inventory (Estimated)', t)
                        : tr('report.balance.inventory.label', 'Inventory', t)}
                    </span>
                    {balanceData.inventory?.isManual && (
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && confirm('Remove manual override and use calculated value?')) {
                            localStorage.removeItem('tally-inventory-manual-override')
                            window.location.reload()
                          }
                        }}
                        className="p-1 hover:bg-[var(--tally-surface-2)] rounded"
                        title={tr('report.balance.inventory.manualInfo', 'Manual values override calculated inventory for this report only.', t)}
                      >
                        <Edit2 className="w-3 h-3 text-[var(--tally-text-muted)]" />
                      </button>
                    )}
                    {!balanceData.inventory?.isManual && (
                      <button
                        onClick={() => {
                          const value = prompt('Enter manual inventory value:', balanceData.assets.inventory.toString())
                          if (value !== null) {
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue)) {
                              localStorage.setItem('tally-inventory-manual-override', JSON.stringify({ value: numValue }))
                              window.location.reload()
                            }
                          }
                        }}
                        className="p-1 hover:bg-[var(--tally-surface-2)] rounded"
                        title="Set manual inventory value"
                      >
                        <Edit2 className="w-3 h-3 text-[var(--tally-text-muted)]" />
                      </button>
                    )}
                  </div>
                  <span className="text-[var(--tally-text)]">{formatCurrency(balanceData.assets.inventory)}</span>
                </div>
                {(balanceData.inventory?.isEstimated || balanceData.inventory?.isManual) && (
                  <p className="text-xs text-[var(--tally-text-muted)] pl-0">
                    {balanceData.inventory.isManual
                      ? tr('report.balance.inventory.manualHelper', 'This value was manually adjusted.', t)
                      : tr('report.balance.inventory.estimatedHelper', 'Inventory value is estimated until stock purchase costs are recorded.', t)}
                  </p>
                )}
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
