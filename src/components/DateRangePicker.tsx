'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { format, subDays, startOfToday, startOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DateRange {
  start: Date
  end: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(format(value.start, 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(value.end, 'yyyy-MM-dd'))
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const today = startOfToday()
  const yesterday = startOfYesterday()

  const predefinedRanges = [
    { label: t('dateRange.today'), getRange: () => ({ start: today, end: today }) },
    { label: t('dateRange.yesterday'), getRange: () => ({ start: yesterday, end: yesterday }) },
    { label: t('dateRange.last7days'), getRange: () => ({ start: subDays(today, 7), end: today }) },
    { label: t('dateRange.last14days'), getRange: () => ({ start: subDays(today, 14), end: today }) },
    { label: t('dateRange.last21days'), getRange: () => ({ start: subDays(today, 21), end: today }) },
    { label: t('dateRange.last30days'), getRange: () => ({ start: subDays(today, 30), end: today }) },
    { label: t('dateRange.last60days'), getRange: () => ({ start: subDays(today, 60), end: today }) },
    { label: t('dateRange.last90days'), getRange: () => ({ start: subDays(today, 90), end: today }) },
  ]

  const handleSelectRange = (range: DateRange) => {
    onChange(range)
    setIsOpen(false)
    setShowCustom(false)
  }

  const handleCustomApply = () => {
    const start = new Date(customStart)
    const end = new Date(customEnd)
    if (start <= end) {
      onChange({ start, end })
      setIsOpen(false)
      setShowCustom(false)
    }
  }

  const formatDisplayDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy')
  }

  const displayText = `${formatDisplayDate(value.start)} - ${formatDisplayDate(value.end)}`

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-surface border-divider text-text-primary hover:bg-surface-secondary whitespace-nowrap"
      >
        <span>{displayText}</span>
        <Calendar className="w-4 h-4 text-icon-default flex-shrink-0" />
        <ChevronDown className={`w-4 h-4 text-icon-default transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-divider rounded-lg shadow-xl z-[100] min-w-[280px] max-w-[320px] overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
          {!showCustom ? (
            <>
              <div className="p-2 max-h-64 overflow-y-auto bg-white" style={{ backgroundColor: '#FFFFFF' }}>
                {predefinedRanges.map((range, index) => {
                  const rangeValue = range.getRange()
                  const isSelected = 
                    format(rangeValue.start, 'yyyy-MM-dd') === format(value.start, 'yyyy-MM-dd') &&
                    format(rangeValue.end, 'yyyy-MM-dd') === format(value.end, 'yyyy-MM-dd')
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectRange(rangeValue)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[rgba(187,216,211,0.45)] text-[#29978C] font-medium'
                          : 'text-text-primary hover:bg-surface-secondary'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0 text-[#29978C]" />}
                      <span className="truncate">{range.label}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className="w-full text-left px-3 py-2 rounded text-sm text-text-primary hover:bg-surface-secondary mt-1 border-t border-divider pt-2"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {t('dateRange.customRange')}
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 space-y-3 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('dateRange.startDate')}</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full"
                    max={format(today, 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('dateRange.endDate')}</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full"
                    max={format(today, 'yyyy-MM-dd')}
                    min={customStart}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-divider">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustom(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleCustomApply}
                  className="flex-1 bg-cta-primary text-cta-text hover:bg-cta-hover"
                >
                  {t('dateRange.apply')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
