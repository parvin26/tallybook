'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { canInstall, isStandalone, isIOSSafari, promptInstall } from '@/lib/pwa'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const DISMISS_DURATION_MS = 5 * 24 * 60 * 60 * 1000 // 5 days

interface PWAInstallBannerProps {
  /** Only show after Home has been visible and eligibility checks pass (e.g. after 10s + meaningful action). */
  showAfterDelay: boolean
}

export function PWAInstallBanner({ showAfterDelay }: PWAInstallBannerProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (!showAfterDelay || typeof window === 'undefined') return
    if (isStandalone()) return
    const installable = canInstall()
    const iosSafari = isIOSSafari()
    if (!installable && !iosSafari) return

    const raw = localStorage.getItem(STORAGE_KEYS.PWA_INSTALL_BANNER_DISMISSED_AT)
    if (raw) {
      const ts = parseInt(raw, 10)
      if (!isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS) return
    }

    setVisible(true)
  }, [showAfterDelay])

  const handleInstall = async () => {
    if (isIOSSafari() && !canInstall()) {
      setVisible(false)
      return
    }
    setInstalling(true)
    try {
      const accepted = await promptInstall()
      if (accepted) setVisible(false)
    } finally {
      setInstalling(false)
    }
  }

  const handleNotNow = () => {
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALL_BANNER_DISMISSED_AT, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  const isIOS = isIOSSafari() && !canInstall()

  return (
    <div className="mx-4 mb-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm max-w-[480px]">
      <h2 className="text-tally-section-title font-semibold text-gray-900">
        {t('pwa.installBanner.title') || 'Install Tally on your phone'}
      </h2>
      <p className="text-tally-body text-gray-600 mt-1">
        {t('pwa.installBanner.body') || 'Faster access works offline and feels like an app'}
      </p>
      {isIOS && (
        <p className="text-tally-caption text-gray-500 mt-2">
          {t('pwa.installBanner.iosHint') || 'Install Tally: Tap Share then Add to Home Screen'}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleNotNow}
          className="flex-1 py-2.5 text-tally-body font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          {t('pwa.installBanner.notNow') || 'Not now'}
        </button>
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="flex-1 py-2.5 text-tally-body font-medium rounded-lg bg-[#29978C] text-white hover:bg-[#238579] disabled:opacity-70"
        >
          {installing ? t('common.loading') : (t('pwa.install.button') || 'Install')}
        </button>
      </div>
    </div>
  )
}
