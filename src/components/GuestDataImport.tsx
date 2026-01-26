'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useBusiness } from '@/contexts/BusinessContext'
import { getGuestTransactions, clearGuestTransactions, disableGuestMode, type GuestTransaction } from '@/lib/guest-storage'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function GuestDataImport() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentBusiness } = useBusiness()
  const [showDialog, setShowDialog] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [guestTransactionCount, setGuestTransactionCount] = useState(0)

  useEffect(() => {
    // Check if there's guest data to import
    const transactions = getGuestTransactions()
    if (transactions.length > 0 && currentBusiness?.id) {
      setGuestTransactionCount(transactions.length)
      setShowDialog(true)
    }
  }, [currentBusiness])

  const handleImport = async () => {
    if (!currentBusiness?.id) {
      toast.error(t('guest.importError'))
      return
    }

    setIsImporting(true)
    const transactions = getGuestTransactions()

    try {
      // Import transactions to Supabase
      const transactionsToInsert = transactions.map((t: GuestTransaction) => ({
        business_id: currentBusiness.id,
        transaction_type: t.transaction_type,
        amount: t.amount,
        payment_type: t.payment_type,
        payment_method: t.payment_method || null,
        payment_provider: t.payment_provider || null,
        payment_reference: t.payment_reference || null,
        expense_category: t.expense_category || null,
        notes: t.notes || null,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
      }))

      // Insert in batches to avoid payload size issues
      const batchSize = 50
      for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
        const batch = transactionsToInsert.slice(i, i + batchSize)
        const { error } = await supabase
          .from('transactions')
          .insert(batch)

        if (error) {
          throw error
        }
      }

      // Clear guest data
      clearGuestTransactions()
      disableGuestMode()

      toast.success(t('guest.importSuccess', { count: transactions.length }))
      setShowDialog(false)
      
      // Refresh the page to show imported transactions
      router.refresh()
    } catch (error: any) {
      console.error('[GuestDataImport] Import error:', error)
      toast.error(t('guest.importError'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleDiscard = () => {
    clearGuestTransactions()
    disableGuestMode()
    setShowDialog(false)
    toast.info(t('guest.noDataToImport'))
  }

  if (!showDialog) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full border border-divider shadow-lg">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          {t('guest.importTitle')}
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {t('guest.importDescription', { count: guestTransactionCount })}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleDiscard}
            variant="outline"
            className="flex-1"
            disabled={isImporting}
          >
            {t('guest.discardButton')}
          </Button>
          <Button
            onClick={handleImport}
            className="flex-1"
            disabled={isImporting}
          >
            {isImporting ? t('common.loading') : t('guest.importButton')}
          </Button>
        </div>
      </div>
    </div>
  )
}
