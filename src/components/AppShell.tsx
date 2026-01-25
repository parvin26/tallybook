'use client'

import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { AppHeader } from './AppHeader'

const NAV_HEIGHT = 88

export function AppShell({
  children,
  title,
  showBack = false,
  showLogo = true,
}: {
  children: ReactNode
  title?: string
  showBack?: boolean
  showLogo?: boolean
}) {
  return (
    <div className="min-h-screen bg-[var(--tally-bg)]">
      <div className="sticky top-0 z-40">
        <AppHeader title={title ?? ''} showBack={showBack} showLogo={showLogo} />
      </div>
      <main
        style={{
          paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + 24px)`,
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
