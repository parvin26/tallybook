/**
 * Currency helpers — single source for symbol/code from stored country.
 * Use getCurrencyFromStorage() in non-React code (e.g. formatCurrency);
 * use useCurrency() in components so UI updates when country changes.
 */

import { STORAGE_KEYS } from '@/lib/storage-keys'
import { COUNTRIES, type Country } from '@/lib/countries'

const LEGACY_TO_CODE: Record<string, string> = {
  malaysia: 'MY',
  'sierra-leone': 'SL',
}

const DEFAULT_COUNTRY: Country = COUNTRIES[0] // Malaysia

/** Normalize stored value to country code (e.g. 'malaysia' -> 'MY'). */
export function normalizeCountryCode(stored: string | null): string | null {
  if (!stored?.trim()) return null
  const lower = stored.trim().toLowerCase()
  if (LEGACY_TO_CODE[lower]) return LEGACY_TO_CODE[lower]
  // Already a code (e.g. IN, MY)?
  if (COUNTRIES.some((c) => c.code === stored.trim())) return stored.trim()
  return null
}

export function getCountryByCode(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null
}

/** Get display string for currency from country name or code (e.g. "Malaysia" → "MYR (RM)"). */
export function getCurrencyFromCountry(countryNameOrCode: string | null | undefined): string {
  const trimmed = countryNameOrCode?.trim() || ''
  if (!trimmed) return ''
  let country = getCountryByCode(trimmed) ?? COUNTRIES.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ?? null
  if (!country) return trimmed
  return `${country.currency} (${country.symbol})`
}

/** Get currency code and symbol from localStorage (SSR-safe: returns default when no window). */
export function getCurrencyFromStorage(): {
  code: string
  symbol: string
  country: Country | null
} {
  if (typeof window === 'undefined') {
    return {
      code: DEFAULT_COUNTRY.currency,
      symbol: DEFAULT_COUNTRY.symbol,
      country: DEFAULT_COUNTRY,
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.COUNTRY)
  const code = normalizeCountryCode(raw)
  const country = code ? getCountryByCode(code) : null
  const c = country ?? DEFAULT_COUNTRY
  return { code: c.currency, symbol: c.symbol, country: c }
}
