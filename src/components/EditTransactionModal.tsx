'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Transaction } from '@/types'
import { AmountInput } from '@/components/inputs/AmountInput'
import { PaymentTypeSelectorLovable } from '@/components/PaymentTypeSelectorLovable'
import { CategorySelectorLovable } from '@/components/CategorySelectorLovable'
import { DatePickerLovable } from '@/components/DatePickerLovable'
import { AttachmentInputLovable } from '@/components/AttachmentInputLovable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useTransactions } from '@/hooks/useTransactions'
import { uploadAttachment, saveAttachmentMetadata, deleteAttachment } from '@/lib/attachments'
import { supabase } from '@/lib/supabase/supabaseClient'
import { isGuestMode, fileToGuestAttachment } from '@/lib/guest-storage'
import type { GuestAttachment } from '@/lib/guest-storage'
import { File, X } from 'lucide-react'
import type { TransactionAttachment } from '@/lib/attachments'
import type { TransactionAttachmentRow } from '@/types'

/** Unified file for display: auth (Supabase) or guest (base64). mime_type used when persisting guest attachments. */
type ExistingFile = { id: string; name: string; url: string; type: 'auth' | 'guest'; mime_type?: string }

// Map DB payment_method to Lovable UI types
const dbToLovablePaymentType: Record<string, 'cash' | 'mobile_money' | 'bank_transfer' | 'other'> = {
  cash: 'cash',
  bank_transfer: 'bank_transfer',
  e_wallet: 'mobile_money',
  card: 'other',
  other: 'other',
}

// Map Lovable payment types to DB payment_method
const lovableToDbPaymentType: Record<'cash' | 'mobile_money' | 'bank_transfer' | 'other', 'cash' | 'bank_transfer' | 'card' | 'e_wallet' | 'other'> = {
  cash: 'cash',
  mobile_money: 'e_wallet',
  bank_transfer: 'bank_transfer',
  other: 'other',
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
  /** Optional: pass when parent already has attachments (e.g. detail page). Otherwise fetched when open. */
  existingAttachments?: TransactionAttachment[]
}

export function EditTransactionModal({ transaction, open, onOpenChange, onDelete, existingAttachments: existingAttachmentsProp }: EditTransactionModalProps) {
  const { t } = useTranslation()
  const { updateTransaction, deleteTransaction } = useTransactions()
  const isExpense = transaction.transaction_type === 'expense'
  const isSale = transaction.transaction_type === 'sale'
  
  const lovablePaymentType = dbToLovablePaymentType[transaction.payment_method] || 'cash'
  const lovableCategory = transaction.expense_category 
    ? (dbToLovableCategory[transaction.expense_category] || 'other')
    : 'other'

  const txWithAttachments = transaction as Transaction & {
    transaction_attachments?: (TransactionAttachmentRow & { storage_path?: string; filename?: string; data_url?: string })[]
    attachments?: { id?: string; filename?: string; storage_path?: string; data_url?: string }[]
  }

  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([])

  useEffect(() => {
    if (!transaction) {
      setExistingFiles([])
      return
    }
    const combined: ExistingFile[] = []

    // 1. Supabase relations (auth) or guest data in transaction_attachments (data_url)
    const txAttachments = txWithAttachments.transaction_attachments
    if ((txAttachments?.length ?? 0) > 0) {
      const arr = Array.isArray(txAttachments) ? txAttachments : (txAttachments != null ? [txAttachments[0]] : [])
      arr.forEach((a, i) => {
        const dataUrl = (a as { data_url?: string }).data_url
        if (dataUrl) {
          combined.push({
            id: (a as { id?: string }).id ?? `guest-tx-${i}`,
            name: (a.filename ?? (a as { filename?: string }).filename) ?? `Attachment ${i + 1}`,
            url: dataUrl,
            type: 'guest',
          })
        } else {
          const path = a.storage_path ?? (a as { storage_path?: string }).storage_path ?? ''
          if (a.id && path) {
            combined.push({
              id: a.id,
              name: (a.filename ?? (a as { filename?: string }).filename) ?? 'Attachment',
              url: path,
              type: 'auth',
            })
          }
        }
      })
    }

    // 2. Raw guest attachments (transaction.attachments with base64)
    const guestAttachments = txWithAttachments.attachments
    if ((guestAttachments?.length ?? 0) > 0) {
      const arr = Array.isArray(guestAttachments) ? guestAttachments : (guestAttachments != null ? [guestAttachments as { filename?: string; data_url?: string; mime_type?: string }] : [])
      arr.forEach((a, i) => {
        const dataUrl = (a as { data_url?: string }).data_url
        if (dataUrl) {
          combined.push({
            id: (a as { id?: string }).id ?? `guest-raw-${i}`,
            name: (a as { filename?: string }).filename ?? `Attachment ${i + 1}`,
            url: dataUrl,
            type: 'guest',
            mime_type: (a as { mime_type?: string }).mime_type,
          })
        }
      })
    }

    setExistingFiles(combined)
  }, [transaction, open])

  const handleOpenAttachment = (file: ExistingFile) => {
    if (file.type === 'guest') {
      window.open(file.url, '_blank', 'noopener,noreferrer')
      return
    }
    const { data } = supabase.storage.from('tally-attachments').getPublicUrl(file.url)
    window.open(data.publicUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRemoveAttachment = (id: string) => {
    setRemoveAttachmentIds((prev) => [...prev, id])
  }

  const filesToShow = existingFiles.filter((f) => !removeAttachmentIds.includes(f.id))

  const [amount, setAmount] = useState(transaction.amount.toString())
  const [transactionDate, setTransactionDate] = useState(() => parseISO(transaction.transaction_date))
  const [paymentType, setPaymentType] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'other'>(lovablePaymentType)
  const [category, setCategory] = useState<'supplies' | 'transport' | 'utilities' | 'rent' | 'wages' | 'food' | 'maintenance' | 'other'>(lovableCategory)
  const [notes, setNotes] = useState(transaction.notes || '')
  const [otherPaymentText, setOtherPaymentText] = useState('')
  const [otherCategoryText, setOtherCategoryText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newAttachmentFiles, setNewAttachmentFiles] = useState<File[]>([])
  const [removeAttachmentIds, setRemoveAttachmentIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setAmount(transaction.amount.toString())
    setTransactionDate(parseISO(transaction.transaction_date))
    setPaymentType(dbToLovablePaymentType[transaction.payment_method] || 'cash')
    setCategory(transaction.expense_category ? (dbToLovableCategory[transaction.expense_category] || 'other') : 'other')
    setNotes(transaction.notes || '')
    setShowDeleteConfirm(false)
    setNewAttachmentFiles([])
    setRemoveAttachmentIds([])
  }, [open, transaction.id, transaction.amount, transaction.transaction_date, transaction.payment_method, transaction.expense_category, transaction.notes])

  // Extract "Other" text from notes if present (once on mount / transaction change)
  useEffect(() => {
    if (transaction.notes && transaction.notes.includes('[Other:') && transaction.notes.includes(']')) {
      const match = transaction.notes.match(/\[Other:\s*([^\]]+)\]/)
      if (match) {
        const otherText = match[1]
        const cleanNotes = transaction.notes.replace(/\[Other:\s*[^\]]+\]\s*/, '').trim()
        setNotes(cleanNotes)
        if (isExpense && lovableCategory === 'other') setOtherCategoryText(otherText)
        else if (lovablePaymentType === 'other') setOtherPaymentText(otherText)
      }
    }
  }, [transaction.notes, isExpense, lovableCategory, lovablePaymentType])

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('transaction.invalidAmount'))
      return
    }
    const dbPaymentMethod = lovableToDbPaymentType[paymentType]
    const dbCategory = isExpense ? lovableToDbCategory[category] : undefined
    let combinedNotes = notes
    if (isExpense && category === 'other' && otherCategoryText.trim()) {
      combinedNotes = `[Other: ${otherCategoryText.trim()}] ${notes}`.trim()
    } else if (paymentType === 'other' && otherPaymentText.trim()) {
      combinedNotes = `[Other: ${otherPaymentText.trim()}] ${notes}`.trim()
    }
    setIsUpdating(true)
    try {
      if (isGuestMode()) {
        // Guest: persist updated attachment list (kept files + new files; removed = not in filesToShow)
        const keptGuest: GuestAttachment[] = filesToShow
          .filter((f): f is ExistingFile & { type: 'guest' } => f.type === 'guest')
          .map((f) => ({
            id: f.id,
            filename: f.name,
            mime_type: f.mime_type ?? 'application/octet-stream',
            data_url: f.url,
          }))
        const newAsGuest: GuestAttachment[] =
          newAttachmentFiles.length > 0
            ? await Promise.all(newAttachmentFiles.map((file) => fileToGuestAttachment(file)))
            : []
        const finalAttachments: GuestAttachment[] = [...keptGuest, ...newAsGuest]
        await updateTransaction({
          transactionId: transaction.id,
          payload: {
            amount: amountNum,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            payment_method: dbPaymentMethod,
            notes: combinedNotes || null,
            expense_category: dbCategory ?? null,
            attachments: finalAttachments,
          },
        })
      } else {
        await updateTransaction({
          transactionId: transaction.id,
          payload: {
            amount: amountNum,
            transaction_date: format(transactionDate, 'yyyy-MM-dd'),
            payment_method: dbPaymentMethod,
            notes: combinedNotes || null,
            expense_category: dbCategory ?? null,
          },
        })
        const businessId = transaction.business_id
        for (const id of removeAttachmentIds) {
          const file = existingFiles.find((f) => f.id === id)
          if (file && file.type === 'auth') await deleteAttachment(id, file.url)
        }
        for (const file of newAttachmentFiles) {
          const { storagePath } = await uploadAttachment(file, transaction.id, businessId)
          if (storagePath)
            await saveAttachmentMetadata(transaction.id, businessId, storagePath, file.name, file.type, file.size)
        }
      }
      toast.success(t('transaction.updated'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.couldntSave'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    setIsDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      toast.success(t('transaction.deleted'))
      onOpenChange(false)
      onDelete?.()
    } catch {
      toast.error(t('common.couldntDelete'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">{t('transaction.editTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Date (editable) */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">{t('transaction.date')}</label>
            <DatePickerLovable value={transactionDate} onChange={setTransactionDate} />
          </div>

          {/* Primary field: Amount (large font) */}
          <div className="bg-[var(--tally-surface)] rounded-lg border border-[var(--tally-border)] p-8 h-20 flex items-center justify-center">
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

          {/* Inventory note for sales only; expenses do not track inventory in MVP */}
          {isSale && (
            <p className="text-sm text-[var(--tally-text-muted)] bg-[var(--tally-surface)] border border-[var(--tally-border)] rounded-lg px-3 py-2">
              Note: To change the inventory item or quantity, please delete this transaction and record a new one.
            </p>
          )}

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

          {/* Attachments - existing files (View + Delete), then upload new */}
          {filesToShow.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('transaction.existingFiles') || 'Existing Files:'}</p>
              {filesToShow.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 border border-[var(--tally-border)] rounded-md">
                  <button
                    type="button"
                    onClick={() => handleOpenAttachment(file)}
                    className="text-sm text-blue-600 truncate hover:underline flex-1 min-w-0 mr-2 text-left"
                  >
                    View — {file.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(file.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <AttachmentInputLovable
              onFilesChange={setNewAttachmentFiles}
              variant={isExpense ? 'expense' : 'sale'}
            />
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

          {/* Actions: Delete (red, left) + Save (primary, right) */}
          <div className="space-y-3 pt-6 mt-2 border-t border-[var(--tally-border)]">
            {!showDeleteConfirm ? (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="flex-1 h-12 text-[#B94A3A] border-[#B94A3A] hover:bg-[#F7E8E5] hover:border-[#A03A2A]"
                >
                  {t('transaction.delete')}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSave}
                  disabled={isUpdating || !amount || parseFloat(amount) <= 0}
                  className="flex-1 h-12"
                >
                  {isUpdating ? t('transaction.saving') : t('common.save')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--tally-text-muted)] text-center mb-2">
                  {t('transaction.deleteConfirmMessage')}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-12">
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 h-12 bg-[#B94A3A] hover:bg-[#A03A2A] text-white border-0"
                  >
                    {isDeleting ? t('transaction.deleting') : t('common.delete')}
                  </Button>
                </div>
              </div>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
