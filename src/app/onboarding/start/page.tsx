'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function StartTallyPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleStart = () => {
    // Mark onboarding as completed
    localStorage.setItem('tally_onboarding_completed', 'true')
    // Clear session flag to allow fresh start
    sessionStorage.removeItem('tally_intro_seen_session')
    // Redirect to home
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[var(--tally-surface,#FAF9F7)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--tally-text-muted)] hover:text-[var(--tally-text)]"
        >
          <span>‹</span>
          <span>{t('common.back')}</span>
        </button>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#29978C]">TALLY</h1>
          <p className="text-sm text-[var(--tally-text-muted)]">{t('onboarding.tagline')}</p>
        </div>

        {/* Start Content */}
        <div className="space-y-6">
          <div className="bg-[var(--tally-surface)] border border-[var(--tally-border)] rounded-lg p-6 text-center space-y-4">
            <p className="text-base text-[var(--tally-text)]">
              {t('onboarding.start.message')}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          className="w-full h-12 bg-[#29978C] hover:bg-[#238579] text-white text-lg font-semibold"
        >
          {t('onboarding.start.button')}
        </Button>
      </div>
    </div>
  )
}
