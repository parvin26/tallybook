'use client'

import { InputHTMLAttributes } from 'react'
import { useCurrency } from '@/hooks/useCurrency'

export interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  value: string
  onChange: (value: string) => void
  /** Override currency symbol; defaults to useCurrency() from stored country */
  currency?: string
  /** Smaller size for quantity etc. Uses text-3xl instead of text-5xl/6xl */
  size?: 'default' | 'sm'
}

export function AmountInput({ value, onChange, currency, autoFocus, disabled, readOnly, onFocus, size = 'default', ...props }: AmountInputProps) {
  const { symbol: storedSymbol } = useCurrency()
  const symbol = currency ?? storedSymbol

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const sanitized = input.replace(/[^0-9.]/g, '')
    const parts = sanitized.split('.')
    let formatted: string
    if (parts.length <= 2) {
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

  const isSm = size === 'sm'
  const symbolSize = isSm ? 'text-2xl' : 'text-4xl'
  const inputSize = isSm ? 'text-3xl' : 'text-6xl'

  return (
    <div className="flex items-center justify-center gap-1 w-full">
      <span className={`${symbolSize} font-bold text-gray-500 tabular-nums shrink-0`}>{symbol}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value || ''}
        onChange={handleChange}
        onFocus={handleFocus}
        autoFocus={autoFocus}
        disabled={false}
        readOnly={false}
        placeholder={isSm ? '0' : '0.00'}
        className={`${inputSize} font-bold tabular-nums text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-auto min-w-[2ch] text-center p-0 [font-family:inherit]`}
        style={{ caretColor: '#10B981' }}
        aria-label="Amount"
        {...props}
      />
    </div>
  )
}
