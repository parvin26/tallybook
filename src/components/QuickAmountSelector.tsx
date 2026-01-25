'use client'

interface QuickAmountSelectorProps {
  onSelect: (amount: number) => void
  selectedAmount?: number
  variant?: 'sale' | 'expense'
}

const amounts = [5, 10, 20, 50, 100, 200, 500, 1000]

export function QuickAmountSelector({ onSelect, selectedAmount, variant = 'sale' }: QuickAmountSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {amounts.map((amount) => {
        const isSelected = selectedAmount === amount
        return (
          <button
            key={amount}
            onClick={() => onSelect(amount)}
            className={`py-3 px-6 rounded-[var(--tally-radius)] font-medium transition-all duration-150 ${
              isSelected
                ? variant === 'sale'
                  ? 'bg-[rgba(41,151,140,0.12)] border-2 border-[#29978C] text-[#29978C] shadow-[var(--tally-shadow)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29978C]/25 focus-visible:ring-offset-2'
                  : 'bg-[rgba(234,108,60,0.12)] border-2 border-[#EA6C3C] text-[#EA6C3C] shadow-[var(--tally-shadow)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA6C3C]/25 focus-visible:ring-offset-2'
                : 'bg-[var(--tally-surface)] border-2 border-[var(--tally-border)] text-[var(--tally-text)] shadow-sm hover:shadow-md hover:border-[var(--tally-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:ring-offset-2'
            } active:scale-[0.98]`}
          >
            {amount}
          </button>
        )
      })}
    </div>
  )
}
