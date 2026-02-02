'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Home, Clock, Package, FileText, User } from 'lucide-react'

const NAV_HEIGHT = 88

export function BottomNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/history', label: t('nav.records'), icon: Clock },
    { href: '/stock', label: t('nav.stock'), icon: Package },
    { href: '/reports', label: t('nav.reports'), icon: FileText },
    { href: '/settings', label: t('nav.account'), icon: User },
  ]

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--tally-surface)] border-t border-tally-border"
      style={{
        height: '88px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors flex-1 min-w-0 ${
                isActive ? 'text-tally-sale' : 'text-tally-text-muted'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] leading-none whitespace-nowrap mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
