'use client'

interface QuickAmountSelectorLovableProps {
  amounts: number[]
  onSelect: (amount: number) => void
  /** Currently selected amount (e.g. the one that filled the amount field); shown with green highlight */
  selectedAmount?: number
  variant?: 'sale' | 'expense'
}

/** Selected chip: bg #E5F7EE, text #1DB36B, border 1px #1DB36B. Unselected: white bg, light grey border. */
export function QuickAmountSelectorLovable({
  amounts,
  onSelect,
  selectedAmount,
  variant = 'sale',
}: QuickAmountSelectorLovableProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {amounts.map((amount) => {
        const isSelected = selectedAmount === amount
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors active:scale-95 ${
              isSelected
                ? 'bg-[#E5F7EE] text-[#1DB36B] border border-[#1DB36B]'
                : 'bg-white border border-gray-300 text-[var(--tally-text)] hover:bg-gray-50'
            }`}
          >
            RM{amount}
          </button>
        )
      })}
    </div>
  )
}
