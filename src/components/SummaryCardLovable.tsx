'use client'

import { formatCurrency } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useDashboardStats } from '@/hooks/useDashboardStats'

interface SummaryCardLovableProps {
  /** When provided, used instead of deriving from useDashboardStats (e.g. for static/SSR). */
  cashIn?: number
  cashOut?: number
  balance?: number
}

/**
 * Summary card for today's cash in/out/balance.
 * Uses useDashboardStats hook which derives stats from useTransactions (single source of truth).
 * Does not fetch data itself; receives data as props or derives from hook.
 */
export function SummaryCardLovable(props: SummaryCardLovableProps) {
  const { t } = useTranslation()
  const { cashIn: derivedCashIn, cashOut: derivedCashOut, balance: derivedBalance, isLoading } = useDashboardStats()

  const cashIn = props.cashIn ?? derivedCashIn
  const cashOut = props.cashOut ?? derivedCashOut
  const balance = props.balance ?? derivedBalance

  return (
    <div className="tally-card p-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t('home.cashIn')}</p>
          <p className="text-xl font-bold tabular-nums text-primary">
            {formatCurrency(cashIn)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">{t('home.cashOut')}</p>
          <p className="text-xl font-bold tabular-nums text-secondary">
            {formatCurrency(cashOut)}
          </p>
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-foreground">{t('home.todaysBalance')}</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
    </div>
  )
}
