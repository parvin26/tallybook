'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import '@/i18n/config'
import { initPWAInstall } from '@/lib/pwa'
import { AuthProvider } from '@/contexts/AuthContext'
import { BusinessProvider } from '@/contexts/BusinessContext'
import { IntroProvider } from '@/contexts/IntroContext'
import { AuthGuard } from '@/components/AuthGuard'
import { IntroOverlay } from '@/components/IntroOverlay'
import { TelemetryConsent } from '@/components/TelemetryConsent'
import { GuestDataImport } from '@/components/GuestDataImport'
import { Toaster } from 'sonner'

const INTRO_SEEN_KEY = 'tally_intro_seen'

/**
 * One-time migration of legacy keys to official keys
 * Runs on first client mount only
 */
function migrateLegacyKeys() {
  if (typeof window === 'undefined') return

  // Migrate country: tally-onboarding-country -> tally-country
  if (!localStorage.getItem('tally-country')) {
    const legacyCountry = localStorage.getItem('tally-onboarding-country')
    if (legacyCountry) {
      localStorage.setItem('tally-country', legacyCountry)
      localStorage.removeItem('tally-onboarding-country')
    }
  }

  // Migrate language: any old key -> tally-language
  if (!localStorage.getItem('tally-language')) {
    // Check for any legacy language keys
    const legacyLanguage = localStorage.getItem('tally-onboarding-language') ||
                          localStorage.getItem('tally_preferences') // Check if it's in preferences object
    if (legacyLanguage) {
      try {
        // If it's a JSON object, parse it
        const parsed = JSON.parse(legacyLanguage)
        if (parsed.language) {
          localStorage.setItem('tally-language', parsed.language)
        }
      } catch {
        // If it's a string, use it directly
        localStorage.setItem('tally-language', legacyLanguage)
      }
      localStorage.removeItem('tally-onboarding-language')
    }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 }
    }
  }))
  const [showIntro, setShowIntro] = useState(false)
  const [introDecisionMade, setIntroDecisionMade] = useState(false)
  
  useEffect(() => {
    // Initialize PWA install prompt listener
    initPWAInstall()
    
    // Migrate legacy keys to official keys (one-time)
    migrateLegacyKeys()
  }, [])

  // Check intro status on mount - this happens BEFORE AuthGuard
  // ONLY check: if tally_intro_seen is missing, show intro
  // Do NOT depend on country or language
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const introSeen = localStorage.getItem(INTRO_SEEN_KEY)
      if (!introSeen) {
        // First run - show intro overlay
        setShowIntro(true)
        // Don't set introDecisionMade yet - wait for user to close intro
      } else {
        // Intro already seen - allow rendering to proceed immediately
        setIntroDecisionMade(true)
      }
    } else {
      // Server-side: allow rendering (intro check happens client-side)
      setIntroDecisionMade(true)
    }
  }, [])

  const handleIntroClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(INTRO_SEEN_KEY, '1')
      
      // After intro closes, route based on what's missing:
      // if no tally-country go /onboarding/country
      // else if no tally-language go /onboarding/language
      // else go /
      const country = localStorage.getItem('tally-country')
      const language = localStorage.getItem('tally-language')
      
      if (!country) {
        window.location.href = '/onboarding/country'
        return
      } else if (!language) {
        window.location.href = '/onboarding/language'
        return
      } else {
        window.location.href = '/'
        return
      }
    }
    setShowIntro(false)
    setIntroDecisionMade(true)
  }

  // Render IntroOverlay ABOVE AuthGuard so redirects cannot prevent it from appearing
  // Don't render AuthGuard until intro decision is made (on first run)
  if (!introDecisionMade) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BusinessProvider>
            <IntroProvider
              forceShowIntro={showIntro}
              setForceShowIntro={setShowIntro}
              onIntroClose={handleIntroClose}
            >
              <IntroOverlay forceOpen={showIntro} onClose={handleIntroClose} />
              <div className="min-h-screen bg-background" />
            </IntroProvider>
          </BusinessProvider>
        </AuthProvider>
      </QueryClientProvider>
    )
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessProvider>
          <IntroProvider
            forceShowIntro={showIntro}
            setForceShowIntro={setShowIntro}
            onIntroClose={handleIntroClose}
          >
            <AuthGuard>
              {children}
              <TelemetryConsent />
              <GuestDataImport />
              <Toaster position="top-center" />
            </AuthGuard>
          </IntroProvider>
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
