'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const { currentBusiness, isLoading: businessLoading } = useBusiness()
  const router = useRouter()
  const pathname = usePathname()
  const [devModeBypass, setDevModeBypass] = useState(false)

  // Static file paths that should never be intercepted
  const isStaticPath = pathname?.startsWith('/_next') ||
    pathname?.startsWith('/favicon.ico') ||
    pathname?.startsWith('/icons') ||
    pathname?.startsWith('/brand') ||
    pathname?.startsWith('/manifest.json') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot)$/i.test(pathname || '')

  const publicRoutes = ['/login', '/verify', '/welcome', '/about']
  const isPublicRoute = publicRoutes.includes(pathname || '')
  const isDevMode = process.env.NODE_ENV === 'development'

  // Early return for static files - don't apply any auth logic
  if (isStaticPath) {
    return <>{children}</>
  }

  // In dev mode, allow bypassing auth
  useEffect(() => {
    if (isDevMode && !devModeBypass) {
      // Check if user wants to bypass auth
      const bypassAuth = sessionStorage.getItem('dev-bypass-auth') === 'true'
      if (bypassAuth) {
        // Use requestAnimationFrame to avoid synchronous setState in effect
        requestAnimationFrame(() => {
          setDevModeBypass(true)
          console.log('Dev bypass mode enabled')
        })
      }
    }
  }, [isDevMode, devModeBypass])

  useEffect(() => {
    // Skip auth checks for static paths (shouldn't reach here, but safety check)
    if (isStaticPath) {
      return
    }

    // Skip auth checks in dev mode if bypass is enabled
    if (isDevMode && devModeBypass) {
      // Check if welcome has been seen
      const welcomeSeen = localStorage.getItem('tally-welcome-seen')
      if (!welcomeSeen && pathname !== '/welcome') {
        router.push('/welcome')
        return
      }
      // Allow access to all routes except login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.push('/')
      }
      return
    }

    if (authLoading || businessLoading) return

    // Check if welcome has been seen (only for authenticated users with business)
    if (user && currentBusiness && pathname !== '/welcome' && !isPublicRoute) {
      const welcomeSeen = localStorage.getItem('tally-welcome-seen')
      if (!welcomeSeen) {
        router.push('/welcome')
        return
      }
    }

    // If not logged in and trying to access protected route
    if (!user && !isPublicRoute && !devModeBypass) {
      router.push('/login')
      return
    }

    // If logged in but no business and not on setup/login
    if (user && !currentBusiness && pathname !== '/setup' && !isPublicRoute) {
      router.push('/setup')
      return
    }

    // If logged in with business but on login/setup, redirect to home
    if (user && currentBusiness && (pathname === '/login' || pathname === '/verify' || pathname === '/setup')) {
      router.push('/')
      return
    }
  }, [user, currentBusiness, authLoading, businessLoading, pathname, router, isDevMode, devModeBypass, isPublicRoute, isStaticPath])

  // Show nothing while checking auth (unless bypass is enabled)
  if (!devModeBypass && (authLoading || (!user && !isPublicRoute))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-muted">Memuatkan...</p>
      </div>
    )
  }

  return <>{children}</>
}
