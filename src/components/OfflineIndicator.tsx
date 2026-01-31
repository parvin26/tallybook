'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Small status bar shown when the user is offline.
 * Copy is conservative: "new records are saved on this device" (no promise of sync unless we have a queue).
 */
export function OfflineIndicator() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center">
      <p className="text-xs font-medium text-amber-900">
        {t('pwa.offlineIndicator', { defaultValue: 'Offline – new records are saved on this device.' })}
      </p>
    </div>
  )
}
