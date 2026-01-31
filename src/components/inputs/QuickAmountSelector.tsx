'use client'

interface QuickAmountSelectorProps {
  onSelect: (amount: number) => void
  selectedAmount?: number
  variant?: 'sale' | 'expense'
  /** Dynamic preset values; defaults to [5, 10, 20, 50, 100, 200, 500, 1000] if not provided. */
  presets?: number[]
}

const DEFAULT_AMOUNTS = [5, 10, 20, 50, 100, 200, 500, 1000]

/**
 * Small pills/buttons below the amount input for quick selection.
 */
export function QuickAmountSelector({
  onSelect,
  selectedAmount,
  variant = 'sale',
  presets = DEFAULT_AMOUNTS,
}: QuickAmountSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {presets.map((amount) => {
        const isSelected = selectedAmount === amount
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-[#E5F7EE] text-[#1DB36B] border border-[#1DB36B]'
                : 'bg-white border border-gray-300 text-[var(--tally-text)] hover:bg-gray-50'
            }`}
          >
            {amount}
          </button>
        )
      })}
    </div>
  )
}
