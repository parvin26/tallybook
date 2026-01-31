'use client'

import { useState, useEffect } from 'react'
import { getCurrencyFromStorage } from '@/lib/currency'

const DEFAULT_CURRENCY = { symbol: 'RM', code: 'MYR', country: null as ReturnType<typeof getCurrencyFromStorage>['country'] }

function getStoredCurrency() {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY
  return getCurrencyFromStorage()
}

/** Use current currency everywhere so Sales/Reports stay in sync (e.g. RM vs ₹). Updates when country changes via storage or tally-country-change event. */
export function useCurrency() {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorageChange = () => setCurrency(getStoredCurrency())
    handleStorageChange() // initial sync
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('tally-country-change', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tally-country-change', handleStorageChange)
    }
  }, [])

  return currency
}
