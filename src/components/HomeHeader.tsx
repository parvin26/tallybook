'use client'

import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { getBusinessProfile } from '@/lib/businessProfile'

export function HomeHeader() {
  const { t } = useTranslation()
  const router = useRouter()
  const today = new Date()
  const dateStr = format(today, 'EEEE, MMMM d, yyyy')

  // Get enterprise name from Business Profile only (single source of truth)
  const profile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = profile?.businessName || t('home.businessFallback')

  // Business logo / profile entry: tap navigates to Edit Profile (same as Account → Edit Profile).
  // In future this circle will show the actual uploaded business logo.
  const handleProfileEntry = () => {
    router.push('/settings?editProfile=1')
  }

  return (
    <div className="max-w-[480px] mx-auto px-6 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--tally-text-muted)]">{dateStr}</p>
        <button
          type="button"
          onClick={handleProfileEntry}
          className="w-8 h-8 rounded-full bg-[var(--tally-surface)] border border-[var(--tally-border)] flex items-center justify-center hover:bg-[var(--tally-surface-2)] transition-colors active:scale-95"
          aria-label={t('account.editProfile', { defaultValue: 'Edit profile' })}
        >
          <span className="text-xs font-medium text-[var(--tally-text)]">MY</span>
        </button>
      </div>
      <p className="text-base font-medium text-[var(--tally-text)] mt-2 truncate">
        {enterpriseName}
      </p>
      <h1 className="text-2xl font-bold text-[var(--tally-text)] mt-1">{t('home.todaysSummary')}</h1>
    </div>
  )
}
