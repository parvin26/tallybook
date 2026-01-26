'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
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

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 }
    }
  }))
  const [forceShowIntro, setForceShowIntro] = useState(false)
  
  useEffect(() => {
    // Initialize PWA install prompt listener
    initPWAInstall()
  }, [])

  // Check if we should auto-show intro on first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && !forceShowIntro) {
      const introSeen = localStorage.getItem('tally_intro_seen')
      
      // Auto-show if intro hasn't been seen (no country/language requirement)
      if (!introSeen) {
        setForceShowIntro(true)
      }
    }
  }, [forceShowIntro])

  const handleIntroClose = useCallback(() => {
    setForceShowIntro(false)
    // After intro closes, redirect to onboarding if country/language missing
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      const language = localStorage.getItem('tally-language')
      if (!country) {
        window.location.href = '/onboarding/country'
      } else if (!language) {
        window.location.href = '/onboarding/language'
      }
    }
  }, [])
  
  // Always render the same component tree in the same order
  // This ensures hooks are always called in the same order
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessProvider>
          <IntroProvider 
            forceShowIntro={forceShowIntro}
            setForceShowIntro={setForceShowIntro}
            onIntroClose={handleIntroClose}
          >
            <AuthGuard>
              {children}
              <TelemetryConsent />
              <GuestDataImport />
              <IntroOverlay forceOpen={forceShowIntro} onClose={handleIntroClose} />
              <Toaster position="top-center" />
            </AuthGuard>
          </IntroProvider>
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
