/**
 * Single source of truth for user preferences
 * Stores: country, language, currency
 */
import { STORAGE_KEYS } from './storage-keys'

export interface Preferences {
  country: string | null
  language: string | null
  currency: string | null
}

const PREFERENCES_KEY = 'tally-preferences'

const DEFAULT_PREFERENCES: Preferences = {
  country: null,
  language: null,
  currency: null,
}

/**
 * Get preferences from localStorage
 */
export function getPreferences(): Preferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (!stored) {
      return DEFAULT_PREFERENCES
    }
    const parsed = JSON.parse(stored) as Partial<Preferences>
    return {
      country: parsed.country ?? null,
      language: parsed.language ?? null,
      currency: parsed.currency ?? null,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: Partial<Preferences>): void {
  if (typeof window === 'undefined') return

  const current = getPreferences()
  const updated: Preferences = {
    country: preferences.country ?? current.country,
    language: preferences.language ?? current.language,
    currency: preferences.currency ?? current.currency,
  }

  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
}

/**
 * Get country preference
 */
export function getCountry(): string | null {
  return getPreferences().country
}

/**
 * Set country preference
 */
export function setCountry(country: string): void {
  savePreferences({ country })
}

/**
 * Get language preference
 */
export function getLanguage(): string | null {
  return getPreferences().language
}

/**
 * Set language preference
 */
export function setLanguage(language: string): void {
  savePreferences({ language })
}

/**
 * Get currency preference
 */
export function getCurrency(): string | null {
  return getPreferences().currency
}

/**
 * Set currency preference
 */
export function setCurrency(currency: string): void {
  savePreferences({ currency })
}

/**
 * Migrate legacy keys to new preferences format
 * Call this once on app init
 */
export function migrateLegacyPreferences(): void {
  if (typeof window === 'undefined') return

  const current = getPreferences()
  
  // Only migrate if preferences are empty
  if (current.country === null && current.language === null) {
    // Try legacy keys
    const legacyCountry = localStorage.getItem(STORAGE_KEYS.COUNTRY) || 
                          localStorage.getItem('tally-onboarding-country')
    const legacyLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    
    if (legacyCountry || legacyLanguage) {
      savePreferences({
        country: legacyCountry,
        language: legacyLanguage,
      })
      
      // Clean up legacy keys
      localStorage.removeItem(STORAGE_KEYS.COUNTRY)
      localStorage.removeItem('tally-onboarding-country')
      localStorage.removeItem(STORAGE_KEYS.LANGUAGE)
    }
  }
  
  // Remove old onboarding completion flag (no longer needed)
  localStorage.removeItem('tally_onboarding_completed')
}
