'use client'

import { InputHTMLAttributes } from 'react'

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function AmountInput({ value, onChange, autoFocus, ...props }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // 1. Sanitize to digits and periods only
    const sanitized = input.replace(/[^0-9.]/g, '')
    
    // 2. Split by periods to handle multiple decimal points
    const parts = sanitized.split('.')
    
    // 3. If there is no period, keep digits only
    // 4. If there is one period, keep as is
    // 5. If there are multiple periods, keep integer part + first decimal part only
    let formatted: string
    if (parts.length === 1) {
      // No period: keep digits only
      formatted = sanitized
    } else if (parts.length === 2) {
      // One period: keep as is
      formatted = sanitized
    } else {
      // Multiple periods: keep integer part + first decimal part only
      const integerPart = parts[0]
      const decimalPart = parts[1] || ''
      formatted = `${integerPart}.${decimalPart}`
    }
    
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
