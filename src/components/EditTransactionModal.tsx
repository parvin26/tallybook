'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Transaction } from '@/types'
import { AmountInput } from '@/components/AmountInput'
import { PaymentTypeSelectorLovable } from '@/components/PaymentTypeSelectorLovable'
import { CategorySelectorLovable } from '@/components/CategorySelectorLovable'
// Attachments are read-only in edit modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

// Map database payment types to Lovable types
const dbToLovablePaymentType: Record<string, 'cash' | 'mobile_money' | 'bank_transfer' | 'other'> = {
  cash: 'cash',
  bank_transfer: 'bank_transfer',
  duitnow: 'mobile_money',
  tng: 'mobile_money',
  boost: 'mobile_money',
  grabpay: 'mobile_money',
  shopeepay: 'mobile_money',
  credit: 'other',
}

// Map Lovable payment types to database types
const lovableToDbPaymentType: Record<'cash' | 'mobile_money' | 'bank_transfer' | 'other', string> = {
  cash: 'cash',
  mobile_money: 'duitnow',
  bank_transfer: 'bank_transfer',
  other: 'credit',
}

// Map database categories to Lovable categories
const dbToLovableCategory: Record<string, 'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other'> = {
  stock_purchase: 'supplies',
  transport: 'transport',
  utilities: 'utilities',
  rent: 'rent',
  salaries: 'wages',
  food: 'food',
  maintenance: 'maintenance',
  other: 'other',
}

// Map Lovable categories to database categories
const lovableToDbCategory: Record<'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other', string> = {
  supplies: 'stock_purchase',
  transport: 'transport',
  utilities: 'utilities',
  rent: 'rent',
  wages: 'salaries',
  food: 'other',
  maintenance: 'other',
  other: 'other',
}

interface EditTransactionModalProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: () => void
}

export function EditTransactionModal({ transaction, open, onOpenChange, onDelete }: EditTransactionModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isExpense = transaction.transaction_type === 'expense' || transaction.transaction_type === 'payment_made'
  
  // Convert database values to Lovable values
  const lovablePaymentType = dbToLovablePaymentType[transaction.payment_type] || 'cash'
  const lovableCategory = transaction.expense_category 
    ? (dbToLovableCategory[transaction.expense_category] || 'other')
    : 'other'

  const [amount, setAmount] = useState(transaction.amount.toString())
  const [paymentType, setPaymentType] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'other'>(lovablePaymentType)
  const [category, setCategory] = useState<'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other'>(lovableCategory)
  const [notes, setNotes] = useState(transaction.notes || '')
  const [otherPaymentText, setOtherPaymentText] = useState('')
  const [otherCategoryText, setOtherCategoryText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Extract "Other" text from notes if present
  useEffect(() => {
    if (transaction.notes && transaction.notes.includes('[Other:') && transaction.notes.includes(']')) {
      const match = transaction.notes.match(/\[Other:\s*([^\]]+)\]/)
      if (match) {
        const otherText = match[1]
        const cleanNotes = transaction.notes.replace(/\[Other:\s*[^\]]+\]\s*/, '').trim()
        setNotes(cleanNotes)
        // Determine if it's payment or category "other" based on transaction type
        if (isExpense && lovableCategory === 'other') {
          setOtherCategoryText(otherText)
        } else if (lovablePaymentType === 'other') {
          setOtherPaymentText(otherText)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(t('transaction.invalidAmount'))
      }

      // Convert Lovable values back to database values
      const dbPaymentType = lovableToDbPaymentType[paymentType]
      const dbCategory = isExpense ? lovableToDbCategory[category] : undefined
      
      // Combine notes with "Other" text if applicable
      let combinedNotes = notes
      if (isExpense && category === 'other' && otherCategoryText.trim()) {
        combinedNotes = `[Other: ${otherCategoryText.trim()}] ${notes}`.trim()
      } else if (paymentType === 'other' && otherPaymentText.trim()) {
        combinedNotes = `[Other: ${otherPaymentText.trim()}] ${notes}`.trim()
      }

      const updateData: any = {
        amount: amountNum,
        payment_type: dbPaymentType,
        notes: combinedNotes || null,
      }

      if (isExpense && dbCategory) {
        updateData.expense_category = dbCategory
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transaction.id] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      toast.success(t('transaction.updated'))
      onOpenChange(false)
    },
    onError: () => {
      toast.error(t('common.couldntSave'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transaction.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      toast.success(t('transaction.deleted'))
      onOpenChange(false)
      onDelete?.()
    },
    onError: () => {
      toast.error(t('common.couldntDelete'))
    },
  })

  const handleSave = () => {
    updateMutation.mutate()
  }

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    deleteMutation.mutate()
  }

  const txDate = parseISO(transaction.transaction_date)
  const dateStr = format(txDate, 'dd MMM yyyy')
  const timeStr = format(txDate, 'h:mm a')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto bg-[var(--tally-bg)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">{t('transaction.editTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Non-editable: Date and Time */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--tally-text-muted)]">{t('transaction.date')}</p>
            <p className="text-sm text-[var(--tally-text)]">{dateStr}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[var(--tally-text-muted)]">{t('transaction.time')}</p>
            <p className="text-sm text-[var(--tally-text)]">{timeStr}</p>
          </div>

          {/* Primary field: Amount */}
          <div className="bg-[var(--tally-surface)] rounded-lg border border-[var(--tally-border)] p-8">
            <AmountInput
              value={amount}
              onChange={setAmount}
              autoFocus
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-3 font-medium">{t('transaction.paymentType')}</label>
            <PaymentTypeSelectorLovable value={paymentType} onChange={setPaymentType} />
            {paymentType === 'other' && (
              <div className="mt-3">
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                  {t('transaction.otherPaymentType')}
                </label>
                <Input
                  value={otherPaymentText}
                  onChange={(e) => setOtherPaymentText(e.target.value)}
                  placeholder={t('transaction.otherPaymentPlaceholder')}
                />
              </div>
            )}
          </div>

          {/* Category (only for expenses) */}
          {isExpense && (
            <div>
              <label className="block text-sm text-[var(--tally-text-muted)] mb-3 font-medium">{t('transaction.category')}</label>
              <CategorySelectorLovable value={category} onChange={setCategory} />
              {category === 'other' && (
                <div className="mt-3">
                  <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                    {t('transaction.otherDescription')}
                  </label>
                  <Input
                    value={otherCategoryText}
                    onChange={(e) => setOtherCategoryText(e.target.value)}
                    placeholder={t('transaction.otherDescriptionPlaceholder')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Attachment - Read-only display */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('transaction.attachment')} ({t('common.optional')})
            </label>
            <p className="text-xs text-[var(--tally-text-muted)]">
              {t('transaction.attachmentsReadOnly') || 'Attachments cannot be edited'}
            </p>
          </div>

          {/* Notes */}
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

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-[var(--tally-border)]">
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || !amount || parseFloat(amount) <= 0}
            className="w-full h-14 bg-[#29978C] hover:bg-[#238579] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            {updateMutation.isPending ? t('transaction.saving') : t('common.save')}
          </button>

          {/* Cancel Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 border border-[var(--tally-border)] bg-[var(--tally-surface)] text-[var(--tally-text)] font-medium rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors"
          >
            {t('common.cancel')}
          </button>

          {/* Delete Button */}
          <div className="pt-2 border-t border-[var(--tally-border)]">
            {!showDeleteConfirm ? (
              <button
                onClick={handleDelete}
                className="w-full h-12 text-[#B94A3A] font-medium rounded-lg hover:bg-[#F7E8E5] transition-colors"
              >
                {t('transaction.delete')}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--tally-text-muted)] text-center mb-2">
                  {t('transaction.deleteConfirmMessage')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 h-12 border border-[var(--tally-border)] bg-[var(--tally-surface)] text-[var(--tally-text)] font-medium rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 h-12 bg-[#B94A3A] hover:bg-[#A03A2A] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white font-medium rounded-lg transition-colors"
                  >
                    {deleteMutation.isPending ? t('transaction.deleting') : t('common.delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
