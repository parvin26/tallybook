'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  showLogo?: boolean
  /** Compact home variant: business left, Tally right. */
  isHome?: boolean
  /** Business name for home header left side. */
  homeEntityLabel?: string
  /** Business logo data URL; only render img when present. */
  homeLogoDataUrl?: string
  /** When true, left side shows "Guest mode" (no logo). */
  isGuest?: boolean
}

export function AppHeader({ title, showBack = true, showLogo = true, isHome = false, homeEntityLabel, homeLogoDataUrl, isGuest = false }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const isHomeRoute = isHome || pathname === '/'

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  if (isHome) {
    const hasName = !!homeEntityLabel && homeEntityLabel.trim().length > 0
    const hasLogo = !!homeLogoDataUrl && homeLogoDataUrl.trim().length > 0
    const leftLabel = isGuest
      ? t('home.guestModeLabel', { defaultValue: 'Guest mode' })
      : !hasName && !hasLogo
        ? t('home.myBusiness', { defaultValue: 'My business' })
        : (homeEntityLabel ?? t('home.myBusiness', { defaultValue: 'My business' }))

    return (
      <header className="sticky top-0 z-40 bg-[#F9F9F7] border-b border-tally-border">
        <div className="max-w-md mx-auto px-3 h-12 flex items-center">
          {/* Left: business logo (if any) + business name or Guest mode / My business */}
          <div className="flex items-center justify-start min-w-0 flex-1 gap-2">
            {hasLogo && (
              <img src={homeLogoDataUrl} alt="" width={28} height={28} className="rounded-md flex-shrink-0 object-cover aspect-square" />
            )}
            <span className="text-sm font-medium text-tally-text truncate">{leftLabel}</span>
          </div>
          {/* Center: empty */}
          <div className="flex-shrink-0 flex-1 min-w-0" />
          {/* Right: Tally logo only */}
          <div className="flex items-center justify-end flex-shrink-0">
            <img src="/icon-192.png" width={28} height={28} alt="Tally" className="rounded-md flex-shrink-0" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-[#F9F9F7] border-b border-tally-border">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center">
        {/* Left: Back button or Logo */}
        <div className="flex items-center justify-start w-12 flex-shrink-0">
          {!isHomeRoute && showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-tally-surface-2 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-tally-text" />
            </button>
          ) : showLogo ? (
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center"
              aria-label="Go to home"
            >
              <img src="/icon-192.png" width={60} height={60} alt="Tally" className="mr-2 rounded-md" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 min-w-0 px-2 flex items-center justify-center">
          <h1 className="text-lg font-semibold text-tally-text text-center truncate">
            {title}
          </h1>
        </div>

        {/* Right: Logo or spacer */}
        <div className="flex items-center justify-end w-12 flex-shrink-0">
          {showLogo && !isHomeRoute ? (
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center"
              aria-label="Go to home"
            >
              <img src="/icon-192.png" width={60} height={60} alt="Tally" className="mr-2 rounded-md" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  )
}
