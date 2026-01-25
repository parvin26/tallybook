'use client'

import { InputHTMLAttributes } from 'react'

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function AmountInput({ value, onChange, autoFocus, ...props }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Only allow numbers and one decimal point
    const sanitized = input.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = sanitized.split('.')
    const formatted = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : sanitized
    onChange(formatted)
  }

  const displayValue = value || '0.00'

  return (
    <div className="relative w-full text-center">
      <div className="text-5xl font-bold tabular-nums text-[var(--tally-text)]">
        RM {displayValue}
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        autoFocus={autoFocus}
        className="absolute inset-0 w-full text-5xl font-bold tabular-nums bg-transparent border-none outline-none text-transparent caret-[var(--tally-text)]"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        {...props}
      />
    </div>
  )
}
