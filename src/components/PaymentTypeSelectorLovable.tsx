'use client'

import { Wallet, Smartphone, Building2, MoreHorizontal, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type PaymentType = 'cash' | 'mobile_money' | 'bank_transfer' | 'other'

interface PaymentTypeSelectorLovableProps {
  value: string
  onChange: (value: PaymentType) => void
}

export function PaymentTypeSelectorLovable({ value, onChange }: PaymentTypeSelectorLovableProps) {
  const { t } = useTranslation()
  
  const paymentTypes: Array<{ value: PaymentType; labelKey: string; icon: typeof Wallet }> = [
    { value: 'cash', labelKey: 'paymentTypes.cash', icon: Wallet },
    { value: 'mobile_money', labelKey: 'paymentTypes.mobile_money', icon: Smartphone },
    { value: 'bank_transfer', labelKey: 'paymentTypes.bank_transfer', icon: Building2 },
    { value: 'other', labelKey: 'paymentTypes.other', icon: MoreHorizontal },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {paymentTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`relative px-4 py-3 rounded-lg border-2 transition-all ${
              isSelected
                ? 'bg-[rgba(41,151,140,0.12)] border-[#29978C] text-[#29978C]'
                : 'bg-[var(--tally-surface)] border-[var(--tally-border)] text-[var(--tally-text)]'
            } hover:border-[var(--tally-text-muted)] active:scale-95`}
          >
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-[#29978C] rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{t(type.labelKey)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
