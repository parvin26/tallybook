'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface IntroContextType {
  openIntro: () => void
}

const IntroContext = createContext<IntroContextType | undefined>(undefined)

export function IntroProvider({ children, forceShowIntro, setForceShowIntro, onIntroClose }: { 
  children: React.ReactNode
  forceShowIntro: boolean
  setForceShowIntro: (show: boolean) => void
  onIntroClose: () => void
}) {
  const openIntro = useCallback(() => {
    // Remove intro seen flag to allow replay
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tally_intro_seen')
    }
    setForceShowIntro(true)
  }, [setForceShowIntro])

  return (
    <IntroContext.Provider value={{ openIntro }}>
      {children}
    </IntroContext.Provider>
  )
}

export function useIntroContext() {
  const context = useContext(IntroContext)
  if (!context) {
    throw new Error('useIntroContext must be used within IntroProvider')
  }
  return context
}
