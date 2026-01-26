'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { setTelemetryConsent, hasTelemetryConsent } from '@/lib/telemetry'
import { Button } from '@/components/ui/button'

interface TelemetryConsentProps {
  onConsentChange?: (consented: boolean) => void
}

export function TelemetryConsent({ onConsentChange }: TelemetryConsentProps) {
  const { t } = useTranslation()
  const [consented, setConsented] = useState<boolean | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    // Check if consent has been given before
    const hasConsent = hasTelemetryConsent()
    if (hasConsent === null || hasConsent === undefined) {
      // First time - show dialog
      setShowDialog(true)
    } else {
      setConsented(hasConsent)
    }
  }, [])

  const handleAccept = () => {
    setTelemetryConsent(true)
    setConsented(true)
    setShowDialog(false)
    onConsentChange?.(true)
  }

  const handleDecline = () => {
    setTelemetryConsent(false)
    setConsented(false)
    setShowDialog(false)
    onConsentChange?.(false)
  }

  if (!showDialog) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full border border-divider shadow-lg">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          {t('telemetry.title')}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {t('telemetry.description')}
        </p>
        <div className="space-y-2 mb-6">
          <p className="text-xs text-text-muted">
            {t('telemetry.whatWeTrack')}
          </p>
          <ul className="text-xs text-text-muted list-disc list-inside space-y-1">
            <li>{t('telemetry.trackScreenViews')}</li>
            <li>{t('telemetry.trackActions')}</li>
            <li>{t('telemetry.trackPreferences')}</li>
          </ul>
          <p className="text-xs text-text-muted mt-2">
            {t('telemetry.whatWeDontTrack')}
          </p>
          <ul className="text-xs text-text-muted list-disc list-inside space-y-1">
            <li>{t('telemetry.noPersonalData')}</li>
            <li>{t('telemetry.noExactAmounts')}</li>
            <li>{t('telemetry.noNotes')}</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1"
          >
            {t('telemetry.decline')}
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
          >
            {t('telemetry.accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
