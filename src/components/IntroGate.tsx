'use client'

import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { IntroOverlay } from '@/components/IntroOverlay'

/**
 * Gate that wraps the app. Only checks STORAGE_KEYS.INTRO_SEEN.
 * If missing → render IntroOverlay. If present → render children.
 * Does NOT depend on Auth or Country.
 * Optional forceShowIntro (e.g. from Settings "Replay intro") shows overlay regardless.
 */
export function IntroGate({
  children,
  forceShowIntro = false,
  onIntroClose,
}: {
  children: React.ReactNode
  forceShowIntro?: boolean
  onIntroClose?: () => void
}) {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = !!localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)
    setIntroSeen(seen)
  }, [])

  const handleIntroClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, '1')
      setIntroSeen(true)
      onIntroClose?.()
      // First-time flow: go to app
      if (!forceShowIntro) {
        window.location.href = '/app'
        return
      }
    }
    setIntroSeen(true)
    onIntroClose?.()
  }

  // Single gate: pass through when unknown so only IntroOrApp gates (audit fix: remove double null)
  if (introSeen === null && !forceShowIntro) {
    return <>{children}</>
  }

  if (!introSeen || forceShowIntro) {
    return (
      <IntroOverlay
        forceOpen
        isFirstTime={!forceShowIntro}
        onClose={handleIntroClose}
      />
    )
  }

  return <>{children}</>
}
