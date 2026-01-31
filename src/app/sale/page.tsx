'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '@/components/inputs/AmountInput'
import { QuickAmountSelectorLovable } from '@/components/QuickAmountSelectorLovable'
import { PaymentTypeSelectorLovable } from '@/components/PaymentTypeSelectorLovable'
import { AttachmentInputLovable } from '@/components/AttachmentInputLovable'
import { DatePickerLovable } from '@/components/DatePickerLovable'
import { AppShell } from '@/components/AppShell'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { useInventory } from '@/hooks/useInventory'
import { useQuickAmounts } from '@/hooks/useQuickAmounts'
import { addMovement } from '@/lib/inventory-service'
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments'
import { isGuestMode, saveGuestTransaction, fileToGuestAttachment } from '@/lib/guest-storage'
import { trackEvent } from '@/lib/telemetry'
import { ChevronDown, PlusCircle, Trash2 } from 'lucide-react'

type StockDeduction = {
  itemId: string
  quantity: number
}

export default function RecordSalePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  
  // Draft key
  const draftKey = currentBusiness?.id ? `sale-draft-${currentBusiness.id}` : null
  
  // Load draft on mount
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | undefined>(undefined)
  
  const [amount, setAmount] = useState(() => {
    if (typeof window !== 'undefined' && draftKey) {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          // Check if draft is less than 24 hours old
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed.amount || ''
          }
        } catch (e) {
          // Invalid draft, ignore
        }
      }
    }
    return ''
  })
  
  const [paymentType, setPaymentType] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'other'>(() => {
    if (typeof window !== 'undefined' && draftKey) {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed.paymentType || 'cash'
          }
        } catch (e) {}
      }
    }
    return 'cash'
  })
  
  const [notes, setNotes] = useState(() => {
    if (typeof window !== 'undefined' && draftKey) {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            return parsed.notes || ''
          }
        } catch (e) {}
      }
    }
    return ''
  })
  
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  
  // Stock deduction state: multiple items per sale
  const [deductStock, setDeductStock] = useState(false)
  const [stockDeductions, setStockDeductions] = useState<StockDeduction[]>([
    { itemId: '', quantity: 1 },
  ])

  const { items: inventoryItems } = useInventory()
  const { salePresets } = useQuickAmounts()
  const businessId = isGuestMode() ? 'guest' : currentBusiness?.id ?? null
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [otherPaymentType, setOtherPaymentType] = useState('')

  // Auto-save draft
  useEffect(() => {
    if (draftKey && (amount || notes)) {
      const draft = {
        amount,
        paymentType,
        notes,
        timestamp: Date.now(),
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }
  }, [amount, paymentType, notes, draftKey])

  // Pre-fill sale amount from selling_price * quantity when deducting stock
  useEffect(() => {
    if (!deductStock) return
    const total = stockDeductions.reduce((sum, row) => {
      if (!row.itemId || row.quantity <= 0) return sum
      const item = inventoryItems.find((i) => i.id === row.itemId)
      return sum + (item?.selling_price ?? 0) * row.quantity
    }, 0)
    if (total > 0) {
      setAmount(total.toString())
      setSelectedQuickAmount(undefined)
    }
  }, [deductStock, stockDeductions, inventoryItems])

  const mutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(t('transaction.invalidAmount'))
      }

      // Validate stock deduction if enabled: at least one row with item + qty > 0
      if (deductStock && businessId) {
        const validRows = stockDeductions.filter((r) => r.itemId && r.quantity > 0)
        if (validRows.length === 0) {
          throw new Error(t('sale.itemRequired'))
        }
      }

      // Map UI payment type to DB payment_method enum
      const dbPaymentMethod: 'cash' | 'bank_transfer' | 'card' | 'e_wallet' | 'other' =
        paymentType === 'cash' ? 'cash'
        : paymentType === 'bank_transfer' ? 'bank_transfer'
        : paymentType === 'mobile_money' ? 'e_wallet'
        : paymentType === 'other' ? 'other'
        : 'cash'

      // Notes without attachment metadata (attachments stored separately)
      const finalNotes = notes || ''

      // Guest mode: save to local storage (with attachments as base64), then atomic stock movement if deducting
      if (isGuestMode()) {
        const attachments =
          attachmentFiles.length > 0
            ? await Promise.all(attachmentFiles.map((f) => fileToGuestAttachment(f)))
            : undefined
        const transactionId = saveGuestTransaction({
          transaction_type: 'sale',
          amount: amountNum,
          payment_type: paymentType,
          payment_method: dbPaymentMethod,
          payment_reference: undefined,
          notes: finalNotes || undefined,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
          attachments,
        })

        // Atomic step 2: multiple stock movements (guest has no DB trigger — manual quantity sync in inventory-service)
        if (deductStock && businessId) {
          const promises = stockDeductions
            .filter((r) => r.itemId && r.quantity > 0)
            .map((r) =>
              addMovement({
                businessId,
                itemId: r.itemId,
                type: 'sale',
                quantityChange: -Number(r.quantity),
                transactionId,
              })
            )
          await Promise.all(promises)
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          for (const r of stockDeductions.filter((x) => x.itemId && x.quantity > 0)) {
            const item = inventoryItems.find((i) => i.id === r.itemId)
            const newQty = (item?.quantity ?? 0) - r.quantity
            const th = item?.low_stock_threshold ?? item?.lowStockThreshold
            if (th != null && newQty <= th && item) {
              toast.warning(t('warnings.lowStock', { item: item.name }))
            }
          }
        }

        trackEvent('record_sale')
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
          transaction_type: 'sale',
          amount: amountNum,
          payment_method: dbPaymentMethod,
          payment_reference: null,
          notes: finalNotes || null,
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
              console.warn('[Sale] Attachment upload failed:', uploadResult.error)
              // Don't fail the transaction if attachment upload fails
            }
          } catch (error) {
            console.error('[Sale] Attachment upload error:', error)
            // Don't fail the transaction if attachment upload fails
          }
        }
      }

      // Atomic step 2: multiple stock movements (one per deduction row)
      if (deductStock && transaction && currentBusiness?.id) {
        const validRows = stockDeductions.filter((r) => r.itemId && r.quantity > 0)
        try {
          await Promise.all(
            validRows.map((r) =>
              addMovement({
                businessId: currentBusiness.id,
                itemId: r.itemId,
                type: 'sale',
                quantityChange: -Number(r.quantity),
                transactionId: transaction.id,
              })
            )
          )
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          for (const r of validRows) {
            const item = inventoryItems.find((i) => i.id === r.itemId)
            const newQty = (item?.quantity ?? 0) - r.quantity
            const th = item?.low_stock_threshold ?? item?.lowStockThreshold
            if (th != null && newQty <= th && item) {
              toast.warning(t('warnings.lowStock', { item: item.name }))
            }
          }
        } catch (err) {
          console.error('[Sale] Stock movement failed:', err)
          toast.warning(t('warnings.stockNotUpdated'))
        }
      }

      return transaction
    },
    onSuccess: () => {
      // Clear draft on successful save
      if (draftKey) {
        localStorage.removeItem(draftKey)
      }
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      queryClient.invalidateQueries({ queryKey: ['sale-movements'] })
      queryClient.refetchQueries({ queryKey: ['transactions'] })
      queryClient.refetchQueries({ queryKey: ['todayProfit'] })
      toast.success(t('common.saved'))
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      setTimeout(() => router.push('/'), 500)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.couldntSave'))
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
    <AppShell title={t('transaction.recordSale')} showBack showLogo>
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

        {/* 2. Quick Amounts */}
        <div>
          <QuickAmountSelectorLovable 
            amounts={salePresets}
            onSelect={handleQuickSelect}
            variant="sale"
          />
        </div>

        {/* 3. Date */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">{t('transaction.date')}</label>
          <DatePickerLovable value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* 4. Payment Type */}
        <div>
          <label className="block text-sm text-[var(--tally-text-muted)] mb-3 font-medium">{t('transaction.paymentType')}</label>
          <PaymentTypeSelectorLovable value={paymentType} onChange={setPaymentType} />
          {paymentType === 'other' && (
            <div className="mt-3">
              <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                {t('transaction.otherPaymentType')}
              </label>
              <Input
                value={otherPaymentType}
                onChange={(e) => setOtherPaymentType(e.target.value)}
                placeholder={t('transaction.otherPaymentPlaceholder')}
              />
            </div>
          )}
        </div>

        {/* 5. Stock Deduction (optional) */}
        <div className="space-y-3">
          <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
            {t('sale.deductStockOptional')}
          </label>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="deductStock"
              checked={deductStock}
              onChange={(e) => {
                setDeductStock(e.target.checked)
                if (!e.target.checked) {
                  setStockDeductions([{ itemId: '', quantity: 1 }])
                }
              }}
              className="w-5 h-5 rounded border-[var(--tally-border)] text-[#29978C] focus:ring-[#29978C]"
            />
            <label htmlFor="deductStock" className="text-sm text-[var(--tally-text)] cursor-pointer">
              {t('sale.deductStockToggle')}
            </label>
          </div>

          {deductStock && (
            <div className="space-y-3 pl-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[var(--tally-text-muted)] font-medium">
                  {t('sale.itemLabel')}
                </span>
                <Link
                  href="/stock"
                  className="text-emerald-600 text-sm flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New
                </Link>
              </div>

              {/* Multiple rows: dropdown + quantity + remove */}
              {stockDeductions.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={row.itemId}
                      onChange={(e) => {
                        setStockDeductions((prev) =>
                          prev.map((r, i) =>
                            i === index ? { ...r, itemId: e.target.value } : r
                          )
                        )
                      }}
                      className="w-full h-10 rounded-[var(--tally-radius)] border border-[var(--tally-border)] bg-[var(--tally-surface)] pl-3 pr-9 py-2 text-sm text-[var(--tally-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:border-[#29978C] focus-visible:ring-offset-2 appearance-none cursor-pointer"
                    >
                      <option value="">{t('sale.selectItem')}</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.quantity} {item.unit}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--tally-text-muted)] pointer-events-none" aria-hidden />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={row.quantity <= 0 ? '' : row.quantity}
                    onChange={(e) => {
                      const v = e.target.value
                      const num = v === '' ? 0 : parseFloat(v)
                      setStockDeductions((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, quantity: Number.isFinite(num) && num >= 0 ? num : 0 } : r
                        )
                      )
                    }}
                    placeholder="Qty"
                    className="w-20 h-10 rounded-[var(--tally-radius)] border border-[var(--tally-border)] bg-[var(--tally-surface)] text-sm text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStockDeductions((prev) => {
                        const next = prev.filter((_, i) => i !== index)
                        return next.length === 0 ? [{ itemId: '', quantity: 1 }] : next
                      })
                    }}
                    className="flex-shrink-0 p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remove row"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setStockDeductions((prev) => [...prev, { itemId: '', quantity: 1 }])}
                className="text-emerald-600 text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                {t('sale.addAnotherItem')}
              </button>
            </div>
          )}
        </div>

        {/* 6. Attachment (optional) */}
        <div>
          <AttachmentInputLovable onFilesChange={setAttachmentFiles} variant="sale" />
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

        {/* 8. Save Button - in document flow, clear of Bottom Nav */}
        <div className="mt-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
            }}
            disabled={mutation.isPending || !amount || parseFloat(amount) <= 0}
            className="w-full h-14 bg-[#29978C] hover:bg-[#238579] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            {mutation.isPending ? t('transaction.saving') : t('transaction.saveSale')}
          </button>
        </div>

        {/* Reserve space so Save button stays above fixed Bottom Nav (88px + safe area) */}
        <div className="h-24 w-full shrink-0" aria-hidden="true" />

      </div>
    </AppShell>
  )
}
  