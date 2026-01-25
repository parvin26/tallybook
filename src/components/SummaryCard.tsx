'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: number | string
  trend?: 'up' | 'down'
  subtitle?: string
}

export function SummaryCard({ label, value, trend, subtitle }: SummaryCardProps) {
  return (
    <div className="bg-tally-surface rounded-[var(--tally-radius)] p-4 shadow-[var(--tally-shadow)]">
      <p className="text-sm text-tally-text-muted mb-1 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold tabular-nums text-tally-text">
          {typeof value === 'number' ? `RM ${value.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </p>
        {trend && (
          <div className={trend === 'up' ? 'text-money-in' : 'text-money-out'}>
            {trend === 'up' ? (
              <ArrowUp className="w-5 h-5" />
            ) : (
              <ArrowDown className="w-5 h-5" />
            )}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  )
}
