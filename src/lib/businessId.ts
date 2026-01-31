/**
 * Get the active business ID from BusinessContext or localStorage
 * This provides a single source of truth for businessId across the app
 */
export function getActiveBusinessId(): string | null {
  // Try to read from localStorage first (for SSR compatibility)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tally-business-id')
    if (stored) {
      return stored
    }
  }
  
  // If no localStorage value, return null
  // The BusinessContext should be the primary source, but we can't access it here
  // Components should use useBusiness() hook and fall back to this helper
  return null
}

/**
 * Set the active business ID in localStorage
 */
export function setActiveBusinessId(businessId: string | null): void {
  if (typeof window !== 'undefined') {
    if (businessId) {
      localStorage.setItem('tally-business-id', businessId)
    } else {
      localStorage.removeItem('tally-business-id')
    }
  }
}
