'use client'

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { migrateGuestData, hasGuestData } from '@/lib/data-migration'
import { toast } from 'sonner'

/**
 * When a guest user signs up or logs in, upload their LocalStorage data (transactions + inventory)
 * to Supabase so nothing is lost. Runs automatically when user is authenticated and guest data exists.
 * Mounted inside AuthGuard/Providers so it runs on every login.
 */
export function GuestDataImport() {
  const { t } = useTranslation()
  const { user, authMode } = useAuth()
  const { currentBusiness } = useBusiness()
  const migrationAttempted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (authMode !== 'authenticated' || !user || !currentBusiness?.id) return
    if (!hasGuestData()) return
    if (migrationAttempted.current) return

    migrationAttempted.current = true
    const toastId = toast.loading(t('guest.syncingData', { defaultValue: 'Syncing your data...' }))

    migrateGuestData(currentBusiness.id)
      .then(() => {
        toast.success(t('guest.syncSuccess', { defaultValue: 'Data synced successfully!' }), { id: toastId })
      })
      .catch((err) => {
        console.error('[GuestDataImport] Migration error:', err)
        toast.error(t('guest.syncFailed', { defaultValue: 'Sync failed, please try again' }), { id: toastId })
        migrationAttempted.current = false
      })
  }, [user?.id, currentBusiness?.id, authMode, t])

  return null
}
