'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '@/components/AmountInput'
import { QuickAmountSelector } from '@/components/inputs/QuickAmountSelector'
import { CategorySelectorLovable } from '@/components/CategorySelectorLovable'
import { PaymentMethodSelector, PaymentMethod } from '@/components/PaymentMethodSelector'
import { AttachmentInputLovable } from '@/components/AttachmentInputLovable'
import { DatePickerLovable } from '@/components/DatePickerLovable'
import { AppShell } from '@/components/AppShell'
import { Input } from '@/components/ui/input'
import { useBusiness } from '@/contexts/BusinessContext'
import { useQuickAmounts } from '@/hooks/useQuickAmounts'
import { supabase } from '@/lib/supabase/supabaseClient'
import { format } from 'date-fns'
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments'
import { isGuestMode, saveGuestTransaction, fileToGuestAttachment } from '@/lib/guest-storage'
import { trackEvent } from '@/lib/telemetry'

// Map Lovable categories to database categories
const categoryMap: Record<string, string> = {
  'supplies': 'stock_purchase',
  'transport': 'transport',
  'utilities': 'utilities',
  'rent': 'rent',
  'wages': 'salaries',
  'food': 'other',
  'maintenance': 'other',
  'other': 'other',
}

export default function RecordExpensePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  
  // Draft key
  const draftKey = currentBusiness?.id ? `expense-draft-${currentBusiness.id}` : null
  
  // Load draft on mount
  const loadDraft = () => {
    if (typeof window !== 'undefined' && draftKey) {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed
          }
        } catch (e) {}
      }
    }
    return null
  }

  const draft = loadDraft()
  
  const [amount, setAmount] = useState(draft?.amount || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(draft?.paymentMethod || 'cash')
  const [paymentProvider, setPaymentProvider] = useState(draft?.paymentProvider || '')
  const [paymentReference, setPaymentReference] = useState(draft?.paymentReference || '')
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState(draft?.notes || '')

  const [otherText, setOtherText] = useState(draft?.otherText || '')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [category, setCategory] = useState<'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other'>(draft?.category || 'other')
  const { expensePresets } = useQuickAmounts()

  // Auto-save draft
  useEffect(() => {
    if (draftKey && (amount || notes || otherText)) {
      const draft = {
        amount,
        paymentMethod,
        paymentProvider,
        paymentReference,
        category,
        otherText,
        notes,
        timestamp: Date.now(),
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }
  }, [amount, paymentMethod, paymentProvider, paymentReference, category, otherText, notes, draftKey])

  const mutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(t('transaction.invalidAmount'))
      }

      const dbCategory = categoryMap[category] || 'other'
      let combinedNotes =
        category === 'other' && otherText.trim()
          ? `[Other: ${otherText.trim()}] ${notes}`.trim()
          : notes

      // Notes without attachment metadata (attachments stored separately)
      const finalNotes = combinedNotes || null

      // Guest mode: save to local storage (with attachments as base64)
      if (isGuestMode()) {
        const attachments =
          attachmentFiles.length > 0
            ? await Promise.all(attachmentFiles.map((f) => fileToGuestAttachment(f)))
            : undefined
        const transactionId = saveGuestTransaction({
          transaction_type: 'expense',
          amount: amountNum,
          payment_type: paymentMethod,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || undefined,
          expense_category: dbCategory,
          notes: finalNotes || undefined,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
          attachments,
        })
        
        trackEvent('record_expense')
        return { id: transactionId }
      }

      // Authenticated mode: save to Supabase
      if (!currentBusiness?.id) {
        throw new Error(t('transaction.noBusiness'))
      }

      // Save transaction first
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          business_id: currentBusiness.id,
          transaction_type: 'expense',
          amount: amountNum,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || null,
          expense_category: dbCategory,
          notes: finalNotes,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
        })
        .select()
        .single()

      if (error) throw error

      // Upload attachments if any
      if (attachmentFiles.length > 0 && transaction) {
        for (const file of attachmentFiles) {
          try {
            const uploadResult = await uploadAttachment(file, transaction.id, currentBusiness.id)
            if (uploadResult.success && uploadResult.storagePath) {
              await saveAttachmentMetadata(
                transaction.id,
                currentBusiness.id,
                uploadResult.storagePath,
                file.name,
                file.type,
                file.size
              )
            } else {
              console.warn('[Expense] Attachment upload failed:', uploadResult.error)
              // Don't fail the transaction if attachment upload fails
            }
          } catch (error) {
            console.error('[Expense] Attachment upload error:', error)
            // Don't fail the transaction if attachment upload fails
          }
        }
      }
    },
    onSuccess: () => {
      // Clear draft on successful save
      if (draftKey) {
        localStorage.removeItem(draftKey)
      }
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      queryClient.refetchQueries({ queryKey: ['transactions'] })
      queryClient.refetchQueries({ queryKey: ['todayProfit'] })
      toast.success(t('common.saved'))
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      setTimeout(() => router.push('/'), 500)
    },
    onError: (error: Error) => {
      toast.error(t('common.couldntSave'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  const handleQuickSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString())
    setSelectedQuickAmount(selectedAmount)
  }

  return (
    <AppShell title={t('transaction.recordExpense')} showBack showLogo hideBottomNav>
      <div className="max-w-[480px] mx-auto px-6 py-6 pb-48 space-y-6">
        {/* 1. Amount — text-5xl, font-bold, text-center, no borders, transparent; currency from stored country */}
        <div className="p-6">
          <AmountInput
            value={amount}
            onChange={(value) => {
              setAmount(value)
              setSelectedQuickAmount(undefined)
            }}
            autoFocus
          />
        </div>

        {/* 2. Quick Amounts — small pills below input */}
        <div>
          <QuickAmountSelector
            presets={expensePresets}
            onSelect={handleQuickSelect}
            selectedAmount={selectedQuickAmount}
            variant="expense"
          />
        </div>

        {/* 3. Category Grid */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-3 font-medium">{t('transaction.category')}</label>
          <CategorySelectorLovable value={category} onChange={setCategory} />
          {category === 'other' && (
            <div className="mt-3">
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                {t('transaction.otherDescription')}
              </label>
              <Input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={t('transaction.otherDescriptionPlaceholder')}
              />
            </div>
          )}
        </div>

        {/* 4. Payment Method */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-3 font-medium">{t('expense.paymentMethod.title')}</label>
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          
          {/* Conditional fields based on payment method */}
          {(paymentMethod === 'bank_transfer' || paymentMethod === 'card') && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                  {t('expense.paymentMethod.providerName')} <span className="text-xs">({t('common.optional')})</span>
                </label>
                <Input
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                  placeholder={t('expense.paymentMethod.providerNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                  {t('expense.paymentMethod.reference')} <span className="text-xs">({t('common.optional')})</span>
                </label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={t('expense.paymentMethod.referencePlaceholder')}
                />
              </div>
            </div>
          )}
          
          {paymentMethod === 'e_wallet' && (
            <div className="mt-4">
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                {t('expense.paymentMethod.walletName')} <span className="text-xs">({t('common.optional')})</span>
              </label>
              <Input
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
                placeholder={t('expense.paymentMethod.walletNamePlaceholder')}
              />
            </div>
          )}
        </div>

        {/* 5. Date */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">{t('transaction.date')}</label>
          <DatePickerLovable value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* 6. Attachment (optional) */}
        <div>
          <AttachmentInputLovable onFilesChange={setAttachmentFiles} variant="expense" />
        </div>

        {/* 7. Notes (optional) */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
            {t('transaction.notes')} <span className="text-xs">({t('common.optional')})</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('transaction.addNotesPlaceholder')}
            className="w-full p-3 border border-[var(--tally-border)] rounded-lg bg-[var(--tally-surface)] placeholder:text-[var(--tally-text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(41,151,140,0.25)] focus:border-[#29978C] focus:ring-offset-2"
            rows={3}
          />
        </div>

        {/* 7. Save Button - in document flow, clear of Bottom Nav */}
        <div className="mt-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
            }}
            disabled={mutation.isPending || !amount || parseFloat(amount) <= 0}
            className="w-full h-14 bg-[#EA6C3C] hover:bg-[#E56E44] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            {mutation.isPending ? t('transaction.saving') : t('transaction.saveExpense')}
          </button>
        </div>

        {/* Reserve space so Save button stays above fixed Bottom Nav (88px + safe area) */}
        <div className="h-24 w-full shrink-0" aria-hidden="true" />

      </div>
    </AppShell>
  )
}
