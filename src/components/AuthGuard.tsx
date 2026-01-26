'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  // This ensures hooks are always called in the same order on every render
  // NO EARLY RETURNS BEFORE ALL HOOKS ARE DECLARED
  
  const { user, isLoading: authLoading } = useAuth()
  const { currentBusiness, isLoading: businessLoading } = useBusiness()
  const router = useRouter()
  const pathname = usePathname()
  const [devModeBypass, setDevModeBypass] = useState(false)
  const [guestMode, setGuestMode] = useState(false)

  // Compute derived values (not hooks, so safe to compute)
  const isStaticPath = pathname?.startsWith('/_next') ||
    pathname?.startsWith('/favicon.ico') ||
    pathname?.startsWith('/icons') ||
    pathname?.startsWith('/brand') ||
    pathname?.startsWith('/manifest.json') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot)$/i.test(pathname || '')

  const publicRoutes = ['/login', '/verify', '/welcome', '/about']
  const onboardingRoutes = pathname?.startsWith('/onboarding') || false
  const isPublicRoute = publicRoutes.includes(pathname || '') || onboardingRoutes
  const isDevMode = process.env.NODE_ENV === 'development'
  const allowTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_MODE === 'true'

  // ALL useEffect hooks must be declared before any early returns
  // Check for guest mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guest = isGuestMode()
      if (guest !== guestMode) {
        setGuestMode(guest)
      }
    }
  }, [guestMode])

  // In dev mode or test mode, allow bypassing auth
  useEffect(() => {
    if ((isDevMode || allowTestMode) && !devModeBypass) {
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
  }, [isDevMode, allowTestMode, devModeBypass])

  useEffect(() => {
    // Skip auth checks for static paths (shouldn't reach here, but safety check)
    if (isStaticPath) {
      return
    }

    // Skip auth checks in dev mode or test mode if bypass is enabled
    if ((isDevMode || allowTestMode) && devModeBypass) {
      // Check onboarding completion
      const onboardingCompleted = typeof window !== 'undefined' && localStorage.getItem('tally_onboarding_completed') === 'true'
      if (!onboardingCompleted && pathname !== '/onboarding/country') {
        router.replace('/onboarding/country')
        return
      }
      // Check if welcome has been seen
      const welcomeSeen = localStorage.getItem('tally-welcome-seen')
      if (!welcomeSeen && pathname !== '/welcome') {
        router.replace('/welcome')
        return
      }
      // Allow access to all routes except login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/')
      }
      return
    }

    // Allow guest mode access
    if (guestMode && !isPublicRoute) {
      // Guest mode can access most routes except login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/')
        return
      }
      // Allow access to app routes in guest mode
      return
    }

    if (authLoading || businessLoading) return

    // If not logged in and not in guest mode, skip onboarding/welcome checks and redirect to login immediately
    if (!user && !isPublicRoute && !devModeBypass && !guestMode) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthGuard] Unauthenticated user on protected route, redirecting to /login', { pathname })
      }
      // Use replace to prevent redirect loops and avoid adding to history
      router.replace('/login')
      return
    }

    // Check onboarding completion (only for authenticated users or bypass mode)
    const onboardingCompleted = typeof window !== 'undefined' && localStorage.getItem('tally_onboarding_completed') === 'true'
    
    // If onboarding not completed, redirect to onboarding
    if (!onboardingCompleted && !isPublicRoute && !isStaticPath) {
      router.replace('/onboarding/country')
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

    // If logged in with business but on login/setup, redirect to home
    if (user && currentBusiness && (pathname === '/login' || pathname === '/verify' || pathname === '/setup')) {
      router.replace('/')
      return
    }
  }, [user, currentBusiness, authLoading, businessLoading, pathname, router, isDevMode, devModeBypass, isPublicRoute, isStaticPath, allowTestMode, guestMode])

  // NOW we can do early returns - all hooks have been declared
  // Early returns for static files - don't apply any auth logic
  if (isStaticPath) {
    return <>{children}</>
  }

  // Early return for onboarding routes - no auth needed
  if (onboardingRoutes) {
    return <>{children}</>
  }

  // Show nothing while checking auth (unless bypass/guest is enabled or on onboarding)
  if (!onboardingRoutes && !devModeBypass && !guestMode && (authLoading || (!user && !isPublicRoute))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-muted">Memuatkan...</p>
      </div>
    )
  }

  return <>{children}</>
}
