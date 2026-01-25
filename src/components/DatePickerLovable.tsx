'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

interface DatePickerLovableProps {
  value: Date
  onChange: (date: Date) => void
}

export function DatePickerLovable({ value, onChange }: DatePickerLovableProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    onChange(newDate)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border border-[var(--tally-border)] bg-[var(--tally-surface)] text-left flex items-center justify-between text-[var(--tally-text)] hover:border-[var(--tally-text-muted)] transition-colors"
      >
        <span>{format(value, 'dd MMM yyyy')}</span>
        <Calendar className="w-5 h-5 text-[var(--tally-text-muted)]" />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-[var(--tally-surface)] border border-[var(--tally-border)] rounded-lg shadow-lg p-2">
            <input
              type="date"
              value={format(value, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="w-full px-3 py-2 rounded border border-[var(--tally-border)] bg-white text-[var(--tally-text)]"
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  )
}
