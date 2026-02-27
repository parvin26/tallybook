'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { getBusinessProfile } from '@/lib/businessProfile'
import { Store, UserRound } from 'lucide-react'

export function HomeHeader() {
  const { t } = useTranslation()
  const router = useRouter()
  const today = new Date()
  const dateStr = format(today, 'EEEE, d MMM')

  // Get enterprise name from Business Profile only (single source of truth)
  const profile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = (profile?.businessName || t('home.businessFallback')).trim()

  // Business logo / profile entry: tap navigates to Edit Profile (same as Account → Edit Profile).
  // In future this circle will show the actual uploaded business logo.
  const handleProfileEntry = () => {
    router.push('/settings?editProfile=1')
  }

  return (
    <div className="max-w-[480px] mx-auto px-6 pt-5 pb-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Store className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs font-semibold uppercase tracking-[0.1em] truncate">
              {enterpriseName}
            </p>
          </div>
          <h1 className="text-5xl leading-none font-extrabold text-[hsl(var(--foreground))] mt-2">
            {t('history.today', { defaultValue: 'Today' })}
          </h1>
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mt-1">{dateStr}</p>
        </div>
        <button
          type="button"
          onClick={handleProfileEntry}
          className="w-12 h-12 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors active:scale-95"
          aria-label={t('account.editProfile', { defaultValue: 'Edit profile' })}
        >
          <UserRound className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>
    </div>
  )
}
