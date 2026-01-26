'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { useTranslation } from 'react-i18next'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  // This ensures hooks are always called in the same order on every render
  // NO EARLY RETURNS BEFORE ALL HOOKS ARE DECLARED
  
  const { user, isLoading: authLoading } = useAuth()
  const { currentBusiness, isLoading: businessLoading } = useBusiness()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [devModeBypass, setDevModeBypass] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)

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
  // Check for guest mode on mount and when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guest = isGuestMode()
      if (guest !== guestMode) {
        setGuestMode(guest)
      }
    }
  }, [pathname, guestMode])

  // Timeout for auth loading - if auth takes more than 3 seconds, allow redirect
  useEffect(() => {
    if (authLoading && !authTimeout) {
      const timer = setTimeout(() => {
        setAuthTimeout(true)
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthGuard] Auth loading timeout - allowing redirect')
        }
      }, 3000) // 3 second timeout
      return () => clearTimeout(timer)
    } else if (!authLoading) {
      setAuthTimeout(false)
    }
  }, [authLoading, authTimeout])

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

    // ALWAYS allow onboarding routes - skip all auth checks
    if (onboardingRoutes) {
      return
    }

    // Check country and language for all non-public, non-onboarding routes
    // This applies to both authenticated users, guest mode, and dev bypass
    if (!isPublicRoute && !onboardingRoutes) {
      const country = typeof window !== 'undefined' ? localStorage.getItem('tally-country') : null
      const language = typeof window !== 'undefined' ? localStorage.getItem('tally-language') : null
      
      if (!country) {
        router.replace('/onboarding/country')
        return
      }
      
      if (!language) {
        router.replace('/onboarding/language')
        return
      }
    }

    // Skip auth checks in dev mode or test mode if bypass is enabled
    if ((isDevMode || allowTestMode) && devModeBypass) {
      // Allow access to all routes except login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/')
      }
      return
    }

    // Check guest mode directly (not just state) to handle immediate navigation
    const isGuest = typeof window !== 'undefined' ? isGuestMode() : false
    
    // Allow guest mode access (but still requires country/language from check above)
    if (isGuest && !isPublicRoute) {
      // Guest mode can access most routes except login/verify
      if (pathname === '/login' || pathname === '/verify') {
        router.replace('/')
        return
      }
      // Allow access to app routes in guest mode (country/language already checked)
      return
    }

    // If auth is still loading, wait (but don't block if we're on a public route or timeout reached)
    if (authLoading && !authTimeout && !isPublicRoute && !devModeBypass && !isGuest) {
      // Only wait for auth if we're not on a public route and timeout hasn't been reached
      return
    }

    // If business is loading but we have a user, wait
    if (businessLoading && user && !isPublicRoute) {
      return
    }

    // If not logged in and not in guest mode, skip onboarding/welcome checks and redirect to login immediately
    if (!user && !isPublicRoute && !devModeBypass && !isGuest) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthGuard] Unauthenticated user on protected route, redirecting to /login', { pathname })
      }
      // Use replace to prevent redirect loops and avoid adding to history
      router.replace('/login')
      return
    }

    // Intro overlay handles onboarding - no redirect needed

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
  }, [user, currentBusiness, authLoading, businessLoading, pathname, router, isDevMode, devModeBypass, isPublicRoute, isStaticPath, allowTestMode, guestMode, onboardingRoutes, authTimeout, t])

  // NOW we can do early returns - all hooks have been declared
  // Early returns for static files - don't apply any auth logic
  if (isStaticPath) {
    return <>{children}</>
  }

  // Early return for onboarding routes - no auth needed
  if (onboardingRoutes) {
    return <>{children}</>
  }

  // Check guest mode directly for loading state
  const isGuestForLoading = typeof window !== 'undefined' ? isGuestMode() : false
  
  // Show loading only while auth is actually loading (not when redirecting)
  // Don't show loading if we're about to redirect - let the redirect happen
  if (!onboardingRoutes && !devModeBypass && !isGuestForLoading && authLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-muted">{t('common.loading')}</p>
      </div>
    )
  }

  return <>{children}</>
}
