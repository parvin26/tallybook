export interface BusinessProfile {
  ownerName: string
  businessName: string
  businessCategory: string
  country: string
  stateOrRegion?: string
  area?: string
  logoDataUrl?: string
}

const PROFILE_STORAGE_KEY = 'tally-business-profile'

export function getBusinessProfile(): BusinessProfile | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as BusinessProfile
  } catch (error) {
    console.error('[BusinessProfile] Error reading profile:', error)
    return null
  }
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.error('[BusinessProfile] Error saving profile:', error)
    throw error
  }
}

export function clearBusinessProfile(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch (error) {
    console.error('[BusinessProfile] Error clearing profile:', error)
  }
}
