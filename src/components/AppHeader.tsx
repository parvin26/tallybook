'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TallyLogo } from './TallyLogo'
import { useTranslation } from 'react-i18next'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  showLogo?: boolean
}

export function AppHeader({ title, showBack = true, showLogo = true }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-tally-border">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center">
        {/* Left: Back button or Logo */}
        <div className="flex items-center justify-start w-12 flex-shrink-0">
          {!isHome && showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-tally-surface-2 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-tally-text" />
            </button>
          ) : showLogo ? (
            <TallyLogo size={28} />
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
          {showLogo && !isHome ? (
            <TallyLogo size={28} />
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  )
}
