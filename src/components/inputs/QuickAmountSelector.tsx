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
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isSelected
                ? variant === 'sale'
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'bg-secondary/15 text-secondary border border-secondary/40'
                : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground'
              }
            `}
          >
            {amount}
          </button>
        )
      })}
    </div>
  )
}
