'use client'

import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { AppHeader } from './AppHeader'
import { OfflineIndicator } from './OfflineIndicator'

const NAV_HEIGHT = 88
/** Extra gap so the last content (e.g. Save button) is clearly above the fixed nav when scrolled to bottom. */
const BOTTOM_GAP = 48
/** When bottom nav is visible, main content gets this padding so it never overlaps the nav. */
const MAIN_PADDING_BOTTOM_WITH_NAV = `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + ${BOTTOM_GAP}px)`

export function AppShell({
  children,
  title,
  showBack = false,
  showLogo = true,
  hideBottomNav = false,
}: {
  children: ReactNode
  title?: string
  showBack?: boolean
  showLogo?: boolean
  /** When true, hide bottom nav (e.g. Record Sale, Record Expense, Edit transaction, Setup). */
  hideBottomNav?: boolean
}) {
  return (
    <div className="min-h-screen bg-[var(--tally-bg)]">
      <div className="sticky top-0 z-40">
        <AppHeader title={title ?? ''} showBack={showBack} showLogo={showLogo} />
        <OfflineIndicator />
      </div>
      <main
        className="min-h-[60vh]"
        style={{
          paddingBottom: hideBottomNav ? `${BOTTOM_GAP}px` : MAIN_PADDING_BOTTOM_WITH_NAV,
        }}
      >
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  )
}
