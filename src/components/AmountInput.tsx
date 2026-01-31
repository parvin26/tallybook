'use client'

import { InputHTMLAttributes } from 'react'

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export function AmountInput({ value, onChange, autoFocus, disabled, readOnly, onFocus, ...props }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const sanitized = input.replace(/[^0-9.]/g, '')
    const parts = sanitized.split('.')
    let formatted: string
    if (parts.length === 1) {
      formatted = sanitized
    } else if (parts.length === 2) {
      formatted = sanitized
    } else {
      formatted = `${parts[0]}.${parts[1] || ''}`
    }
    onChange(formatted)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    onFocus?.(e)
  }

  return (
    <div className="flex items-center justify-center gap-1 w-full">
      <span className="text-4xl font-bold text-gray-500 tabular-nums shrink-0">RM</span>
      <input
        type="text"
        inputMode="decimal"
        value={value || ''}
        onChange={handleChange}
        onFocus={handleFocus}
        autoFocus={autoFocus}
        disabled={false}
        readOnly={false}
        placeholder="0.00"
        className="text-6xl font-bold tabular-nums text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-auto min-w-[2ch] text-center p-0 [font-family:inherit]"
        style={{ caretColor: '#10B981' }}
        aria-label="Amount"
        {...props}
      />
    </div>
  )
}
