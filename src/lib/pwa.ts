/**
 * PWA Installation Utilities
 * Handles Progressive Web App installation prompts and detection
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Initialize PWA install prompt listener
 * Call this once when the app loads
 */
export function initPWAInstall() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Store the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] Install prompt event captured')
    }
  })

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] App was installed')
    }
  })
}

/**
 * Check if app is running in standalone mode (installed)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for standalone display mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true
  }
  
  return false
}

/**
 * Check if device is iOS (iPhone or iPad)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Check if running in iOS Safari (browser, not standalone).
 * Used for PWA install banner to show "Share → Add to Home Screen" instructions.
 * Relies on: iOS UA, not standalone, and platform touch (iOS has maxTouchPoints).
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandalone()) return false
  const ua = navigator.userAgent
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isSafari = ua.includes('Safari') && !ua.includes('Chrome')
  return isIOSDevice && (isSafari || !ua.includes('CriOS'))
}

/**
 * Check if app can be installed (has prompt available and not already installed)
 */
export function canInstall(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandalone()) return false
  return deferredPrompt !== null
}

/**
 * Trigger the install prompt
 * Returns true if prompt was shown, false otherwise
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] No install prompt available')
    }
    return false
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt()
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] User choice:', outcome)
    }
    
    // Clear the deferred prompt
    deferredPrompt = null
    
    return outcome === 'accepted'
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error)
    deferredPrompt = null
    return false
  }
}
