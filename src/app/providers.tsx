'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import '@/i18n/config'
import { initPWAInstall } from '@/lib/pwa'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { normalizeCountryCode } from '@/lib/currency'
import { AuthProvider } from '@/contexts/AuthContext'
import { BusinessProvider } from '@/contexts/BusinessContext'
import { IntroProvider } from '@/contexts/IntroContext'
import { IntroGate } from '@/components/IntroGate'
import { AuthGuard } from '@/components/AuthGuard'
import { TelemetryConsent } from '@/components/TelemetryConsent'
import { GuestDataImport } from '@/components/GuestDataImport'
import { Toaster } from 'sonner'

/**
 * One-time migration of legacy keys to official keys
 * Runs on first client mount only
 */
function migrateLegacyKeys() {
  if (typeof window === 'undefined') return

  // Migrate country: tally-onboarding-country -> tally-country; normalize legacy slugs to codes (malaysia -> MY, sierra-leone -> SL)
  let countryValue = localStorage.getItem(STORAGE_KEYS.COUNTRY) ?? localStorage.getItem('tally-onboarding-country')
  if (countryValue) {
    const code = normalizeCountryCode(countryValue)
    if (code) {
      localStorage.setItem(STORAGE_KEYS.COUNTRY, code)
    }
    localStorage.removeItem('tally-onboarding-country')
  }

  // Migrate language: any old key -> tally-language
  if (!localStorage.getItem(STORAGE_KEYS.LANGUAGE)) {
    // Check for any legacy language keys
    const legacyLanguage = localStorage.getItem('tally-onboarding-language') ||
                          localStorage.getItem('tally_preferences') // Check if it's in preferences object
    if (legacyLanguage) {
      try {
        // If it's a JSON object, parse it
        const parsed = JSON.parse(legacyLanguage)
        if (parsed.language) {
          localStorage.setItem(STORAGE_KEYS.LANGUAGE, parsed.language)
        }
      } catch {
        // If it's a string, use it directly
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, legacyLanguage)
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

  useEffect(() => {
    initPWAInstall()
    migrateLegacyKeys()
  }, [])

  const handleIntroClose = () => setShowIntro(false)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessProvider>
          <IntroProvider
            forceShowIntro={showIntro}
            setForceShowIntro={setShowIntro}
            onIntroClose={handleIntroClose}
          >
            <IntroGate forceShowIntro={showIntro} onIntroClose={handleIntroClose}>
              <AuthGuard>
                {children}
                <TelemetryConsent />
                <GuestDataImport />
                <Toaster position="top-center" />
              </AuthGuard>
            </IntroGate>
          </IntroProvider>
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
