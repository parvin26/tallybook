'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { TallyLogo } from '@/components/TallyLogo'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const { user, isLoading: authLoading, authMode } = useAuth()
  const { currentBusiness, isLoading: businessLoading } = useBusiness()
  const router = useRouter()
  const pathname = usePathname()
  const [devModeBypass, setDevModeBypass] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)

  // Compute derived values (not hooks, so safe to compute)
  const isStaticPath = pathname?.startsWith('/_next') ||
    pathname?.startsWith('/favicon.ico') ||
    pathname?.startsWith('/icons') ||
    pathname?.startsWith('/brand') ||
    pathname?.startsWith('/manifest.json') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot)$/i.test(pathname || '')

  const publicRoutes = ['/about', '/privacy', '/terms']
  const onboardingRoutes = pathname?.startsWith('/onboarding') || false // Country/language selection only
  const isPublicRoute = publicRoutes.includes(pathname || '') || onboardingRoutes
  const isDevMode = process.env.NODE_ENV === 'development'
  const allowTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_MODE === 'true'

  // Timeout for auth loading - if auth takes more than 3 seconds, allow redirect
  useEffect(() => {
    if (authLoading && !authTimeout) {
      const timer = setTimeout(() => {
        setAuthTimeout(true)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (!authLoading) {
      setAuthTimeout(false)
    }
  }, [authLoading, authTimeout])

  // In dev mode or test mode, allow bypassing auth
  useEffect(() => {
    if ((isDevMode || allowTestMode) && !devModeBypass) {
      const bypassAuth = sessionStorage.getItem('dev-bypass-auth') === 'true'
      if (bypassAuth) {
        requestAnimationFrame(() => {
          setDevModeBypass(true)
        })
      }
    }
  }, [isDevMode, allowTestMode, devModeBypass])

  useEffect(() => {
    // Skip auth checks for static paths
    if (isStaticPath) {
      return
    }

    // If intro is not yet seen, do not redirect. Let the IntroOverlay control first.
    const introSeen = typeof window !== 'undefined' ? localStorage.getItem('tally_intro_seen') : null
    if (!introSeen) {
      return // Don't redirect, let IntroOverlay handle first
    }

    // ALWAYS allow onboarding routes - skip all auth checks
    if (onboardingRoutes) {
      return
    }

    // Check guest mode - if true, do not redirect to /login for protected routes
    const isGuest = typeof window !== 'undefined' ? localStorage.getItem('tally-guest-mode') === 'true' : false
    if (isGuest) {
      // Guest mode: allow access to app routes, block login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/app')
      }
      return
    }

    // Skip auth checks in dev mode or test mode if bypass is enabled
    if ((isDevMode || allowTestMode) && devModeBypass) {
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/app')
      }
      return
    }

    // Handle three explicit states: unknown, guest, authenticated
    
    // Unknown state - show nothing (waiting for auth to resolve)
    if (authMode === 'unknown' && authLoading) {
      return
    }

    // Guest state - route to app home, block login/verify
    if (authMode === 'guest') {
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/app')
        return
      }
      // Allow access to app routes in guest mode
      return
    }

    // Authenticated state - route to app home, block login/verify
    if (authMode === 'authenticated') {
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/app')
        return
      }
    }

    // If auth is still loading, wait (but don't block if we're on a public route or timeout reached)
    if (authLoading && !authTimeout && !isPublicRoute && !devModeBypass) {
      return
    }

    // If business is loading but we have a user, wait
    if (businessLoading && user && !isPublicRoute) {
      return
    }

    // Unknown state after loading - do NOT redirect to login if on Home or /app
    // AuthGuard must not block access to / (marketing) or /app (product)
    // Only redirect to login if not on Home/app and not authenticated and not guest
    const isAppRoute = pathname === '/' || pathname?.startsWith('/app')
    if (authMode === 'unknown' && !authLoading && !isPublicRoute && !devModeBypass && !isAppRoute) {
      router.replace('/login')
      return
    }

    // Check if welcome has been seen (only for authenticated users with business)
    if (user && currentBusiness && pathname !== '/welcome' && !isPublicRoute) {
      const welcomeSeen = localStorage.getItem('tally-welcome-seen')
      if (!welcomeSeen) {
        router.replace('/welcome')
        return
      }
    }

    // If logged in but no business and not on setup/login
    if (user && !currentBusiness && pathname !== '/setup' && !isPublicRoute) {
      router.replace('/setup')
      return
    }

    // If logged in with business but on login/setup, redirect to app
    if (user && currentBusiness && (pathname === '/login' || pathname === '/verify' || pathname === '/setup')) {
      router.replace('/app')
      return
    }
  }, [user, currentBusiness, authLoading, businessLoading, pathname, router, isDevMode, devModeBypass, isPublicRoute, isStaticPath, allowTestMode, authMode, onboardingRoutes, authTimeout])

  // Early returns for static files
  if (isStaticPath) {
    return <>{children}</>
  }

  // Early return for onboarding routes
  if (onboardingRoutes) {
    return <>{children}</>
  }

  // Show "Preparing Tally…" while auth is loading (short message, cannot hang forever)
  // Replace long loading state with short neutral message
  if (authMode === 'unknown' && authLoading && !isPublicRoute && !authTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <TallyLogo size={72} />
          <p className="text-sm text-muted-foreground">Preparing Tally…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
