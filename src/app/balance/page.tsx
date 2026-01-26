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
import { Download, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react'
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

      // Calculate inventory value using Last Purchase Cost per Item method
      let inventoryValue = 0
      let isInventoryEstimated = false
      let hasManualOverride = false
      let manualOverrideValue = 0
      
      // Check for manual override
      if (typeof window !== 'undefined') {
        const override = localStorage.getItem('tally-inventory-manual-override')
        if (override) {
          try {
            const parsed = JSON.parse(override)
            if (parsed.value !== undefined && parsed.value !== null) {
              manualOverrideValue = parseFloat(parsed.value) || 0
              hasManualOverride = true
            }
          } catch (e) {
            // Invalid override, ignore
          }
        }
      }
      
      if (hasManualOverride) {
        inventoryValue = manualOverrideValue
      } else {
        try {
          const inventoryItems = await getInventoryItems(currentBusiness.id)
          
          // Get all inventory movements up to as at date
          // Handle both occurred_at (new schema) and created_at (old schema) for compatibility
          const { data: movements } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('business_id', currentBusiness.id)
            .order('created_at', { ascending: true })
          
          // Filter movements by date (use occurred_at if available, otherwise created_at)
          const filteredMovements = (movements || []).filter(m => {
            const movementDate = m.occurred_at || m.created_at
            if (!movementDate) return false
            const movementDateStr = new Date(movementDate).toISOString().split('T')[0]
            return movementDateStr <= asAtDateStr
          })
          
          // Get all stock purchase transactions (expenses with stock_purchase category)
          const stockPurchaseTransactions = transactions.filter(
            t => t.transaction_type === 'expense' && t.expense_category === 'stock_purchase'
          )
          
          // Create a map of transaction ID to transaction for quick lookup
          const transactionMap = new Map(stockPurchaseTransactions.map(t => [t.id, t]))
          
          // Calculate inventory value per item
          for (const item of inventoryItems) {
            // Step 1: Calculate unitsOnHand from movements
            const itemMovements = filteredMovements.filter(m => m.inventory_item_id === item.id)
            let unitsOnHand = 0
            
            for (const movement of itemMovements) {
              // Handle both quantity_delta (new schema) and quantity (old schema)
              const delta = movement.quantity_delta !== undefined ? movement.quantity_delta : movement.quantity
              unitsOnHand += delta || 0
            }
            
            // If unitsOnHand <= 0, inventory value is 0
            if (unitsOnHand <= 0) {
              continue
            }
            
            // Step 2: Find stock purchase transactions linked to this item via movements
            const purchaseMovements = itemMovements.filter(m => {
              const movementType = m.movement_type || ''
              return (movementType === 'expense_addition' || movementType === 'restock_add') && 
                     m.related_transaction_id
            })
            
            // Step 3: Sort purchase movements by transaction date (most recent first)
            const purchaseMovementsWithTransactions = purchaseMovements
              .map(m => {
                const transaction = transactionMap.get(m.related_transaction_id)
                if (!transaction) return null
                return {
                  movement: m,
                  transaction,
                  transactionDate: new Date(transaction.transaction_date)
                }
              })
              .filter(Boolean)
              .sort((a, b) => b!.transactionDate.getTime() - a!.transactionDate.getTime())
            
            // Step 4: Take the most recent purchase
            if (purchaseMovementsWithTransactions.length > 0) {
              const mostRecent = purchaseMovementsWithTransactions[0]!
              const movement = mostRecent.movement
              const purchaseTransaction = mostRecent.transaction
              
              // Step 5: Calculate unitCost
              const purchaseQuantity = Math.abs(movement.quantity_delta !== undefined ? movement.quantity_delta : movement.quantity)
              
              if (purchaseQuantity > 0) {
                const unitCost = purchaseTransaction.amount / purchaseQuantity
                
                // Step 6: Calculate itemInventoryValue
                const itemInventoryValue = unitsOnHand * unitCost
                inventoryValue += itemInventoryValue
              } else {
                // Invalid purchase quantity, mark as estimated
                isInventoryEstimated = true
              }
            } else {
              // No purchase record found for this item, mark as estimated
              isInventoryEstimated = true
            }
          }
        } catch (error) {
          console.error('[BalanceSheet] Error calculating inventory:', error)
          // On error, set to 0 and mark as estimated
          inventoryValue = 0
          isInventoryEstimated = true
        }
      }

      // Calculate Assets
      const startingCash = currentBusiness.starting_cash || 0
      const startingBank = currentBusiness.starting_bank || 0

      // Helper function to check if expense was paid with cash
      const isCashPayment = (t: any) => {
        // Check new payment_method field first, fallback to payment_type for backward compatibility
        if (t.payment_method === 'cash') return true
        if (t.payment_method) return false // If payment_method exists but not cash, it's not cash
        return t.payment_type === 'cash' // Backward compatibility
      }

      // Helper function to check if expense was paid with bank transfer
      const isBankPayment = (t: any) => {
        if (t.payment_method === 'bank_transfer') return true
        if (t.payment_method === 'e_wallet') return true // E-wallet treated as bank for now
        if (t.payment_method) return false
        return t.payment_type === 'bank_transfer' || t.payment_type === 'duitnow' // Backward compatibility
      }

      // Helper function to check if expense was paid with card (credit)
      const isCardPayment = (t: any) => {
        if (t.payment_method === 'card') return true
        if (t.payment_method) return false
        return t.payment_type === 'credit' // Backward compatibility
      }

      // Calculate Cash
      const cashSales = transactions
        .filter(t => t.transaction_type === 'sale' && t.payment_type === 'cash')
        .reduce((sum, t) => sum + t.amount, 0)

      const cashExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && isCashPayment(t))
        .reduce((sum, t) => sum + t.amount, 0)

      const currentCash = startingCash + cashSales - cashExpenses

      // Calculate Bank (includes bank transfers and e-wallets)
      const bankSales = transactions
        .filter(t => t.transaction_type === 'sale' && (t.payment_type === 'bank_transfer' || t.payment_type === 'duitnow'))
        .reduce((sum, t) => sum + t.amount, 0)

      const bankExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && isBankPayment(t))
        .reduce((sum, t) => sum + t.amount, 0)

      const currentBank = startingBank + bankSales - bankExpenses

      const receivables = transactions
        .filter(t => t.transaction_type === 'sale' && t.payment_type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)

      // Other Assets (placeholder - can be expanded)
      const otherAssets = 0

      // Calculate Liabilities
      // Card expenses increase credit balance (liability)
      const creditExpenses = transactions
        .filter(t => t.transaction_type === 'expense' && isCardPayment(t))
        .reduce((sum, t) => sum + t.amount, 0)

      // Other payables (for backward compatibility with old credit expenses)
      const otherPayables = transactions
        .filter(t => t.transaction_type === 'expense' && t.payment_type === 'credit' && !isCardPayment(t))
        .reduce((sum, t) => sum + t.amount, 0)

      const payables = creditExpenses + otherPayables

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
        inventory: {
          value: inventoryValue,
          isEstimated: isInventoryEstimated && !hasManualOverride,
          isManual: hasManualOverride,
        },
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
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--tally-text)]">
                      {balanceData.inventory?.isManual
                        ? t('balance.inventory.manualLabel')
                        : balanceData.inventory?.isEstimated
                        ? t('balance.inventory.estimatedLabel')
                        : t('balance.inventory.label')}
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
                        title={t('balance.inventory.manualInfo')}
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
                      ? t('balance.inventory.manualHelper')
                      : t('balance.inventory.estimatedHelper')}
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
