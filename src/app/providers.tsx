'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import '@/i18n/config'
import { initPWAInstall } from '@/lib/pwa'
import { AuthProvider } from '@/contexts/AuthContext'
import { BusinessProvider } from '@/contexts/BusinessContext'
import { AuthGuard } from '@/components/AuthGuard'
import { TelemetryConsent } from '@/components/TelemetryConsent'
import { GuestDataImport } from '@/components/GuestDataImport'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 }
    }
  }))
  
  useEffect(() => {
    // Initialize PWA install prompt listener
    initPWAInstall()
  }, [])
  
  // Always render the same component tree in the same order
  // This ensures hooks are always called in the same order
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessProvider>
          <AuthGuard>
            {children}
            <TelemetryConsent />
            <GuestDataImport />
            <Toaster position="top-center" />
          </AuthGuard>
        </BusinessProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
