'use client'

import { Wallet, Building2, Smartphone, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type PaymentType = 'cash' | 'bank_transfer' | 'duitnow' | 'tng' | 'boost' | 'grabpay' | 'shopeepay' | 'credit'

interface PaymentTypeSelectorProps {
  value: string
  onChange: (value: PaymentType) => void
  variant?: 'sale' | 'expense'
}

export function PaymentTypeSelector({ value, onChange, variant = 'sale' }: PaymentTypeSelectorProps) {
  const { t } = useTranslation()
  
  const paymentTypes: Array<{ value: PaymentType; label: string; icon: typeof Wallet }> = [
    { value: 'cash', label: t('paymentTypes.cash'), icon: Wallet },
    { value: 'bank_transfer', label: t('paymentTypes.bank_transfer'), icon: Building2 },
    { value: 'duitnow', label: t('paymentTypes.duitnow'), icon: Smartphone },
    { value: 'tng', label: t('paymentTypes.tng'), icon: Smartphone },
    { value: 'boost', label: t('paymentTypes.boost'), icon: Smartphone },
    { value: 'grabpay', label: t('paymentTypes.grabpay'), icon: Smartphone },
    { value: 'shopeepay', label: t('paymentTypes.shopeepay'), icon: Smartphone },
    { value: 'credit', label: t('paymentTypes.credit'), icon: CreditCard },
  ]
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {paymentTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.value
        const selectedColor = variant === 'sale' ? '#29978C' : '#EA6C3C'
        const selectedBg = variant === 'sale' ? 'rgba(41,151,140,0.12)' : 'rgba(234,108,60,0.12)'
        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-150 ${
              isSelected
                ? 'shadow-[var(--tally-shadow)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                : 'bg-[var(--tally-surface)] border-2 border-[var(--tally-border)] text-[var(--tally-text)] shadow-sm hover:shadow-md hover:border-[var(--tally-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:ring-offset-2'
            } active:scale-[0.98]`}
            style={isSelected ? {
              backgroundColor: selectedBg,
              borderColor: selectedColor,
              color: selectedColor,
              borderWidth: '2px',
            } : undefined}
          >
            <Icon 
              className="w-4 h-4" 
              style={isSelected ? { color: selectedColor } : { color: 'var(--tally-text-muted)' }}
            />
            <span className="text-sm font-medium">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
