'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { User, Session } from '@supabase/supabase-js'
import { disableGuestMode, isGuestMode } from '@/lib/guest-storage'
import { STORAGE_KEYS } from '@/lib/storage-keys'

export type AuthMode = 'authenticated' | 'guest' | 'unknown'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  authMode: AuthMode
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>('unknown')

  useEffect(() => {
    // Check guest mode first
    const checkGuestMode = () => {
      if (typeof window !== 'undefined' && isGuestMode()) {
        setAuthMode('guest')
        setUser(null)
        setSession(null)
        setIsLoading(false)
        return true
      }
      return false
    }

    if (checkGuestMode()) {
      return
    }

    const supabase = createBrowserSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check guest mode again before setting authenticated state
      if (checkGuestMode()) {
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      setAuthMode(session?.user ? 'authenticated' : 'unknown')
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Check guest mode on auth state change
      if (checkGuestMode()) {
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setAuthMode(session?.user ? 'authenticated' : 'unknown')
      setIsLoading(false)
    })

    // Listen for storage changes (guest mode toggles from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.GUEST_MODE) {
        if (checkGuestMode()) {
          return
        }
        // If guest mode was disabled, check auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setUser(session?.user ?? null)
          setAuthMode(session?.user ? 'authenticated' : 'unknown')
        })
      }
    }

    // Listen for custom events (guest mode toggles in same window)
    const handleGuestModeChange = (e: CustomEvent<{ enabled: boolean }>) => {
      if (e.detail.enabled) {
        checkGuestMode()
      } else {
        // If guest mode was disabled, check auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setUser(session?.user ?? null)
          setAuthMode(session?.user ? 'authenticated' : 'unknown')
        })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('guest-mode-changed', handleGuestModeChange as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('guest-mode-changed', handleGuestModeChange as EventListener)
    }
  }, [])

  const signOut = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Logout started')
    }

    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    
    // Clear all auth-related storage
    if (typeof window !== 'undefined') {
      // Clear dev bypass flag
      sessionStorage.removeItem('dev-bypass-auth')
      
      // Clear any auth-related localStorage keys that might cause re-entry
      // Note: We keep onboarding and language preferences as they're not auth-related
      // Only clear flags that could cause redirect loops
      localStorage.removeItem('tally-welcome-seen')
      
      // Clear intro session flag
      sessionStorage.removeItem('tally_intro_seen_session')
      
      // Clear guest mode
      disableGuestMode()
    }
    
    // Reset in-memory state
    setUser(null)
    setSession(null)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Logout completed, state reset')
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, authMode, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
