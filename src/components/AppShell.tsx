'use client'

import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { AppHeader } from './AppHeader'
import { OfflineIndicator } from './OfflineIndicator'

const NAV_HEIGHT = 88
/** Extra gap above the fixed nav so last content is never covered. */
const BOTTOM_GAP = 80
/** CSS variable for nav total height (88px + safe-area); used for main paddingBottom. */
const BOTTOM_NAV_TOTAL = `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`

export function AppShell({
  children,
  title,
  showBack = false,
  showLogo = true,
  hideBottomNav = false,
  hideHeaderOnHome = false,
}: {
  children: ReactNode
  title?: string
  showBack?: boolean
  showLogo?: boolean
  /** When true, hide bottom nav (e.g. Record Sale, Record Expense, Edit transaction, Setup). */
  hideBottomNav?: boolean
  /** When true, do not render AppHeader (home page: avoid empty sticky bar); OfflineIndicator still shown. */
  hideHeaderOnHome?: boolean
}) {
  return (
    <div className="min-h-[100dvh] bg-[var(--tally-bg)]">
      <div className="sticky top-0 z-40">
        {hideHeaderOnHome ? null : (
          <AppHeader title={title ?? ''} showBack={showBack} showLogo={showLogo} />
        )}
        <OfflineIndicator />
      </div>
      <main
        className="relative z-0 min-h-[calc(100dvh-4rem)]"
        style={
          {
            ['--bottom-nav-total' as string]: BOTTOM_NAV_TOTAL,
            paddingBottom: hideBottomNav ? `${BOTTOM_GAP}px` : `calc(var(--bottom-nav-total) + ${BOTTOM_GAP}px)`,
          } as React.CSSProperties
        }
      >
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  )
}
