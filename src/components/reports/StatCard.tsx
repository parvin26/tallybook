'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export type StatCardType = 'revenue' | 'expense' | 'profit'

/** Khatabook-style: Colored header bar (lighter/muted match to record sales & expense), white body, footer with change */
const typeStyles: Record<
  StatCardType,
  { headerBg: string; headerText: string; footerUp: string; footerDown: string }
> = {
  revenue: {
    headerBg: 'bg-primary/80',
    headerText: 'text-white',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
  },
  expense: {
    headerBg: 'bg-secondary/80',
    headerText: 'text-white',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
  },
  profit: {
    headerBg: 'bg-gray-500',
    headerText: 'text-white',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
  },
}

interface StatCardProps {
  title: string
  /** Numeric value only (use formatCurrencyAmount). Rendered in its own element with whitespace-nowrap. */
  amount: string
  type: StatCardType
  icon?: LucideIcon
  /** Currency label (e.g. symbol). Small text, allowed to wrap. Shown above the amount. */
  currencyLabel?: string
  /** Optional footer e.g. "Rp 1000" or "12%" */
  changeLabel?: string
  changeDirection?: 'up' | 'down'
}

export function StatCard({
  title,
  amount,
  type,
  icon: Icon,
  currencyLabel,
  changeLabel,
  changeDirection,
}: StatCardProps) {
  const styles = typeStyles[type]
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm min-w-0">
      {/* Header: full-width colored bar */}
      <div className={`${styles.headerBg} px-4 py-2.5 text-center`}>
        <p className={`text-sm font-semibold ${styles.headerText}`}>{title}</p>
      </div>
      {/* Body: currency (small, can wrap) + amount (single visual unit, never wrap) */}
      <div className="p-4 text-center min-w-0 flex flex-col items-center justify-center gap-0.5">
        {/* Currency element: small text, allowed to wrap if needed */}
        {currencyLabel != null && currencyLabel !== '' && (
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {currencyLabel}
          </span>
        )}
        {/* Amount element: numeric value only, single visual unit, never wrap */}
        <span className="text-tally-stat-number font-bold text-gray-900 whitespace-nowrap min-w-0">
          {amount}
        </span>
      </div>
      {/* Footer: arrow + change */}
      {changeLabel != null && changeLabel !== '' && (
        <div className="flex items-center justify-center gap-1 pb-3 text-sm">
          {changeDirection === 'up' && <TrendingUp className={`h-4 w-4 ${styles.footerUp}`} aria-hidden />}
          {changeDirection === 'down' && <TrendingDown className={`h-4 w-4 ${styles.footerDown}`} aria-hidden />}
          <span className={changeDirection === 'up' ? styles.footerUp : changeDirection === 'down' ? styles.footerDown : 'text-gray-600'}>
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  )
}
