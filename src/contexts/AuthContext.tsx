'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { User, Session } from '@supabase/supabase-js'
import { disableGuestMode } from '@/lib/guest-storage'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Logout started')
    }
    
    // Sign out from Supabase
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
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
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
