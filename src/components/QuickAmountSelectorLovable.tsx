'use client'

interface QuickAmountSelectorLovableProps {
  amounts: number[]
  onSelect: (amount: number) => void
  variant?: 'sale' | 'expense'
}

export function QuickAmountSelectorLovable({ 
  amounts, 
  onSelect, 
  variant = 'sale' 
}: QuickAmountSelectorLovableProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {amounts.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
          className="px-4 py-2 rounded-full bg-[var(--tally-surface)] border border-[var(--tally-border)] text-sm font-medium text-[var(--tally-text)] whitespace-nowrap hover:bg-[var(--tally-surface-2)] transition-colors active:scale-95"
        >
          RM{amount}
        </button>
      ))}
    </div>
  )
}
