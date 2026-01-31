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
      {/* Today's Balance: dominant (~36sp Bold); label 15sp Medium muted */}
      <div className="border-b border-border pb-4 mb-4">
        <p className="text-[15px] font-medium text-muted-foreground mb-1">{t('home.todaysBalance')}</p>
        <p className="text-[36px] font-bold leading-tight tabular-nums text-foreground">
          {formatCurrency(balance)}
        </p>
      </div>
      {/* Cash In / Cash Out: values ~20sp SemiBold; labels 14sp Medium muted */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t('home.cashIn')}</p>
          <p className="text-[20px] font-semibold tabular-nums text-[#2E7D5B]">
            {formatCurrency(cashIn)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground mb-1">{t('home.cashOut')}</p>
          <p className="text-[20px] font-semibold tabular-nums text-[#B94A3A]">
            {formatCurrency(cashOut)}
          </p>
        </div>
      </div>
    </div>
  )
}
