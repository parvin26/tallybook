'use client'

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
  const { cashIn: derivedCashIn, cashOut: derivedCashOut, balance: derivedBalance } = useDashboardStats()

  const cashIn = props.cashIn ?? derivedCashIn
  const cashOut = props.cashOut ?? derivedCashOut
  const balance = props.balance ?? derivedBalance
  const isPositive = balance >= 0
  const formatRM = (value: number) => `RM ${Math.abs(value).toFixed(2)}`
  const netColor = isPositive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'

  return (
    <div
      className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-6 overflow-hidden"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: netColor }} />
      <div className="border-b border-[hsl(var(--border))] pb-4 mb-4 pl-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))] mb-2">
          {t('home.todaysNet', { defaultValue: "TODAY'S NET" })}
        </p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold tabular-nums text-[hsl(var(--muted-foreground))]">RM</span>
          <span className="text-[54px] leading-[0.9] font-extrabold tabular-nums" style={{ color: netColor }}>
            {Math.abs(balance).toFixed(2)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pl-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))] mb-1">
            {t('home.cashIn')}
          </p>
          <p className="text-3xl font-bold tabular-nums text-[hsl(var(--primary))]">
            {formatRM(cashIn)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))] mb-1">
            {t('home.cashOut')}
          </p>
          <p className="text-3xl font-bold tabular-nums text-[hsl(var(--secondary))]">
            {formatRM(cashOut)}
          </p>
        </div>
      </div>
    </div>
  )
}
