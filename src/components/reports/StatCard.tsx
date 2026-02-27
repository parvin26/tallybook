'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export type StatCardType = 'revenue' | 'expense' | 'profit'

/** Unified KPI style with a compact accent bar. */
const typeStyles: Record<
  StatCardType,
  { accent: string; footerUp: string; footerDown: string; title: string }
> = {
  revenue: {
    accent: 'bg-emerald-500',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
    title: 'text-gray-700',
  },
  expense: {
    accent: 'bg-orange-400',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
    title: 'text-gray-700',
  },
  profit: {
    accent: 'bg-slate-500',
    footerUp: 'text-primary',
    footerDown: 'text-red-600',
    title: 'text-gray-700',
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
  icon: _Icon,
  currencyLabel,
  changeLabel,
  changeDirection,
}: StatCardProps) {
  const styles = typeStyles[type]
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm min-w-0">
      <div className={`h-1.5 w-full ${styles.accent}`} />
      <div className="px-4 pt-3 text-center">
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
      </div>
      <div className="p-4 text-center min-w-0 flex flex-col items-center justify-center gap-0.5">
        {currencyLabel != null && currencyLabel !== '' && (
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {currencyLabel}
          </span>
        )}
        <span className="text-tally-stat-number font-bold text-gray-900 whitespace-nowrap min-w-0">
          {amount}
        </span>
      </div>
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
