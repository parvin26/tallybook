'use client'

import { formatCurrency } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface SummaryCardLovableProps {
  cashIn: number
  cashOut: number
  balance: number
}

export function SummaryCardLovable({ cashIn, cashOut, balance }: SummaryCardLovableProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-[var(--tally-surface)] rounded-lg border border-[var(--tally-border)] p-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('home.cashIn')}</p>
          <p className="text-xl font-bold tabular-nums text-[#2E7D5B]">
            {formatCurrency(cashIn)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--tally-text-muted)] mb-1">{t('home.cashOut')}</p>
          <p className="text-xl font-bold tabular-nums text-[#B94A3A]">
            {formatCurrency(cashOut)}
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--tally-border)] pt-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-[var(--tally-text)]">{t('home.todaysBalance')}</p>
          <p className="text-2xl font-bold tabular-nums text-[var(--tally-text)]">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
    </div>
  )
}
