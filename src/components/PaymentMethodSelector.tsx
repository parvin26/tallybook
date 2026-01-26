'use client'

import { Wallet, Building2, CreditCard, Smartphone, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'e_wallet'

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation()
  
  const methods: Array<{ value: PaymentMethod; labelKey: string; icon: typeof Wallet }> = [
    { value: 'cash', labelKey: 'paymentTypes.cash', icon: Wallet },
    { value: 'bank_transfer', labelKey: 'paymentTypes.bank_transfer', icon: Building2 },
    { value: 'card', labelKey: 'expense.paymentMethod.card', icon: CreditCard },
    { value: 'e_wallet', labelKey: 'expense.paymentMethod.eWallet', icon: Smartphone },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((method) => {
        const Icon = method.icon
        const isSelected = value === method.value
        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={`relative px-4 py-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'bg-[rgba(234,108,60,0.12)] border-[#EA6C3C] text-[#EA6C3C]'
                : 'bg-[var(--tally-surface)] border-[var(--tally-border)] text-[var(--tally-text)]'
            } hover:border-[var(--tally-text-muted)] active:scale-95`}
          >
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-[#EA6C3C] rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight">{t(method.labelKey)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
