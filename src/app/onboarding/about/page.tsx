'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function AboutTallyPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleContinue = () => {
    router.push('/onboarding/start')
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

        {/* About Content */}
        <div className="space-y-6">
          <div className="bg-[var(--tally-surface)] border border-[var(--tally-border)] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--tally-text)]">{t('onboarding.about.title')}</h2>
            <p className="text-sm text-[var(--tally-text-muted)] leading-relaxed">
              {t('onboarding.about.description')}
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full h-12 bg-[#29978C] hover:bg-[#238579] text-white"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
