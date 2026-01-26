/**
 * Privacy-safe telemetry utilities
 * Only tracks non-sensitive events if user consents
 */

const TELEMETRY_CONSENT_KEY = 'tally-telemetry-consent'
const TELEMETRY_EVENTS_KEY = 'tally-telemetry-events'

export type TelemetryEvent = 
  | 'screen_view'
  | 'record_sale'
  | 'record_expense'
  | 'export_report'
  | 'language_change'
  | 'country_selected'

export interface TelemetryEventData {
  event: TelemetryEvent
  timestamp: number
  metadata?: {
    screen?: string
    language?: string
    country?: string
    amount_range?: string // Bucketed amount ranges, not exact amounts
  }
}

/**
 * Check if user has consented to telemetry
 */
export function hasTelemetryConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TELEMETRY_CONSENT_KEY) === 'true'
}

/**
 * Set telemetry consent
 */
export function setTelemetryConsent(consent: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TELEMETRY_CONSENT_KEY, consent ? 'true' : 'false')
}

/**
 * Track a telemetry event (only if consent is given)
 */
export function trackEvent(event: TelemetryEvent, metadata?: TelemetryEventData['metadata']): void {
  if (typeof window === 'undefined') return
  if (!hasTelemetryConsent()) return

  const eventData: TelemetryEventData = {
    event,
    timestamp: Date.now(),
    metadata,
  }

  // Store events locally (in production, you might send to analytics service)
  try {
    const existing = localStorage.getItem(TELEMETRY_EVENTS_KEY)
    const events: TelemetryEventData[] = existing ? JSON.parse(existing) : []
    events.push(eventData)
    
    // Keep only last 100 events to avoid storage bloat
    if (events.length > 100) {
      events.shift()
    }
    
    localStorage.setItem(TELEMETRY_EVENTS_KEY, JSON.stringify(events))
  } catch (error) {
    console.error('[Telemetry] Failed to track event:', error)
  }
}

/**
 * Get telemetry events (for debugging/export)
 */
export function getTelemetryEvents(): TelemetryEventData[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(TELEMETRY_EVENTS_KEY)
    if (!stored) return []
    return JSON.parse(stored) as TelemetryEventData[]
  } catch {
    return []
  }
}

/**
 * Clear telemetry events
 */
export function clearTelemetryEvents(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TELEMETRY_EVENTS_KEY)
}

/**
 * Bucket amount into privacy-safe ranges
 */
export function bucketAmount(amount: number): string {
  if (amount < 10) return '<10'
  if (amount < 50) return '10-50'
  if (amount < 100) return '50-100'
  if (amount < 500) return '100-500'
  if (amount < 1000) return '500-1000'
  if (amount < 5000) return '1000-5000'
  return '5000+'
}
