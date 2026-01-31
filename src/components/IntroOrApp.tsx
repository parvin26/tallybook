'use client'

import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { IntroOverlay } from '@/components/IntroOverlay'

/**
 * Airport Principle: Intro sits at root, decoupled from Auth/Business.
 * If tally_intro_seen is missing → render IntroOverlay only (no AuthGuard/BusinessContext).
 * Otherwise render children (the full app tree).
 */
export function IntroOrApp({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)
    setShowIntro(!!seen)
  }, [])

  const handleIntroFinish = () => {
    if (typeof window === 'undefined') return
    setShowIntro(true)
    window.location.href = '/onboarding/country'
  }

  // Hydration: avoid flash until we know intro state
  if (showIntro === null) {
    return null
  }

  // First-time: show intro only, no app tree
  if (!showIntro) {
    return <IntroOverlay isFirstTime onClose={handleIntroFinish} />
  }

  return <>{children}</>
}
