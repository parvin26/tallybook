'use client'

import { Package, Car, Zap, Home, Users, Utensils, Wrench, MoreHorizontal, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Category = 'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other'

interface CategorySelectorLovableProps {
  value: string
  onChange: (value: Category) => void
}

export function CategorySelectorLovable({ value, onChange }: CategorySelectorLovableProps) {
  const { t } = useTranslation()
  
  const categories: Array<{ value: Category; labelKey: string; icon: typeof Package }> = [
    { value: 'supplies', labelKey: 'expenseCategories.supplies', icon: Package },
    { value: 'transport', labelKey: 'expenseCategories.transport', icon: Car },
    { value: 'utilities', labelKey: 'expenseCategories.utilities', icon: Zap },
    { value: 'rent', labelKey: 'expenseCategories.rent', icon: Home },
    { value: 'wages', labelKey: 'expenseCategories.wages', icon: Users },
    { value: 'food', labelKey: 'expenseCategories.food', icon: Utensils },
    { value: 'maintenance', labelKey: 'expenseCategories.maintenance', icon: Wrench },
    { value: 'other', labelKey: 'expenseCategories.other', icon: MoreHorizontal },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = value === category.value
        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`relative px-3 py-4 rounded-lg border-2 transition-all ${
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
              <span className="text-xs font-medium text-center leading-tight">{t(category.labelKey)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
