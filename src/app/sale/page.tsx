'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { AmountInput } from '@/components/AmountInput'
import { QuickAmountSelectorLovable } from '@/components/QuickAmountSelectorLovable'
import { PaymentTypeSelectorLovable } from '@/components/PaymentTypeSelectorLovable'
import { AttachmentInputLovable } from '@/components/AttachmentInputLovable'
import { DatePickerLovable } from '@/components/DatePickerLovable'
import { AppShell } from '@/components/AppShell'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { getInventoryItems, deductInventoryForSale } from '@/lib/inventory'
import { InventoryItem } from '@/types/stock'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { uploadAttachment, saveAttachmentMetadata } from '@/lib/attachments'
import { isGuestMode, saveGuestTransaction } from '@/lib/guest-storage'
import { trackEvent } from '@/lib/telemetry'

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
  
  // Stock deduction state
  const [deductStock, setDeductStock] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('')
  const [quantitySold, setQuantitySold] = useState('')
  const [showNegativeStockConfirm, setShowNegativeStockConfirm] = useState(false)
  const [pendingDeduction, setPendingDeduction] = useState<{
    itemId: string
    quantity: number
    unit: string
    transactionId: string
  } | null>(null)

  // Fetch inventory items
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: () => currentBusiness?.id ? getInventoryItems(currentBusiness.id) : Promise.resolve([]),
    enabled: !!currentBusiness?.id && deductStock,
  })

  const selectedItem = inventoryItems.find(item => item.id === selectedInventoryItem)
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

  const mutation = useMutation({
    mutationFn: async () => {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(t('transaction.invalidAmount'))
      }

      // Validate stock deduction if enabled (not supported in guest mode)
      if (deductStock && !isGuestMode()) {
        if (!selectedInventoryItem) {
          throw new Error(t('sale.itemRequired'))
        }
        const qty = parseFloat(quantitySold)
        if (isNaN(qty) || qty <= 0) {
          throw new Error(t('sale.quantityRequired'))
        }
      }

      // Map Lovable payment types to database types
      const dbPaymentType = paymentType === 'mobile_money' ? 'duitnow' : 
                           paymentType === 'other' ? 'credit' : paymentType

      // Notes without attachment metadata (attachments stored separately)
      const finalNotes = notes || ''

      // Guest mode: save to local storage
      if (isGuestMode()) {
        const transactionId = saveGuestTransaction({
          transaction_type: 'sale',
          amount: amountNum,
          payment_type: dbPaymentType,
          notes: finalNotes || undefined,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
        })
        
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
          payment_type: dbPaymentType,
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

      // Handle stock deduction if enabled (after transaction is saved)
      if (deductStock && selectedInventoryItem && transaction) {
        const qty = parseFloat(quantitySold)
        try {
          const result = await deductInventoryForSale(
            selectedInventoryItem,
            qty,
            selectedItem?.unit || '',
            transaction.id,
            currentBusiness.id
          )

          if (!result.success) {
            if (result.error === 'Unit mismatch. Selected item uses different unit.') {
              toast.error(t('errors.unitMismatch'))
            } else if (result.error?.includes('below zero')) {
              // Show confirmation dialog
              setPendingDeduction({
                itemId: selectedInventoryItem,
                quantity: qty,
                unit: selectedItem?.unit || '',
                transactionId: transaction.id,
              })
              setShowNegativeStockConfirm(true)
              // Don't throw - sale is already saved
            } else {
              toast.warning(t('warnings.stockNotUpdated'))
            }
          } else {
            // Success - invalidate inventory queries
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
            
            // Check for low stock warning
            if (result.error === 'low_stock' && selectedItem) {
              toast.warning(t('warnings.lowStock', { item: selectedItem.name }))
            }
          }
        } catch (error: any) {
          // Stock deduction failed but sale is saved
          console.error('[Sale] Stock deduction error:', error)
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

  const handleNegativeStockConfirm = async (confirmed: boolean) => {
    setShowNegativeStockConfirm(false)
    if (confirmed && pendingDeduction) {
      // Fetch item to check current quantity
      const { data: item } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', pendingDeduction.itemId)
        .single()

      if (item) {
        const newQuantity = item.quantity - pendingDeduction.quantity
        
        // Update inventory
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ quantity: newQuantity })
          .eq('id', pendingDeduction.itemId)

        if (!updateError) {
          // Create movement record
          await supabase
            .from('inventory_movements')
            .insert({
              inventory_item_id: pendingDeduction.itemId,
              business_id: currentBusiness?.id,
              movement_type: 'sale_deduction',
              quantity_delta: -pendingDeduction.quantity, // Negative for deduction
              unit: pendingDeduction.unit,
              related_transaction_id: pendingDeduction.transactionId,
              notes: null,
              occurred_at: new Date().toISOString(),
            })

          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          
          // Check for low stock
          if (item.low_stock_threshold && newQuantity <= item.low_stock_threshold) {
            toast.warning(t('warnings.lowStock', { item: item.name }))
          }
        } else {
          toast.warning(t('warnings.stockNotUpdated'))
        }
      }
    }
    setPendingDeduction(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  const handleQuickSelect = (selectedAmount: number) => {
    const currentAmount = parseFloat(amount) || 0
    const newAmount = currentAmount + selectedAmount
    setAmount(newAmount.toFixed(2))
    setSelectedQuickAmount(selectedAmount)
  }

    return (
    <AppShell title={t('transaction.recordSale')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">
        {/* 1. Amount */}
        <div className="bg-[var(--tally-surface)] rounded-lg border border-[var(--tally-border)] p-8">
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
            amounts={[10, 20, 50, 100, 200]}
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
                  setSelectedInventoryItem('')
                  setQuantitySold('')
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
              {/* Item Select */}
              <div>
                <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                  {t('sale.itemLabel')}
                </label>
                <select
                  value={selectedInventoryItem}
                  onChange={(e) => {
                    setSelectedInventoryItem(e.target.value)
                    setQuantitySold('')
                  }}
                  className="w-full p-3 border border-[var(--tally-border)] rounded-lg bg-[var(--tally-surface)] text-[var(--tally-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(41,151,140,0.25)] focus:border-[#29978C]"
                >
                  <option value="">{t('sale.selectItem')}</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Sold */}
              {selectedInventoryItem && (
                <>
                  <div>
                    <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
                      {t('sale.quantitySoldLabel')}
                    </label>
                    <Input
                      type="number"
                      value={quantitySold}
                      onChange={(e) => setQuantitySold(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>

                  {/* Unit Display */}
                  {selectedItem && (
                    <div>
                      <p className="text-sm text-[var(--tally-text-muted)]">
                        {t('sale.unitLabel')}: <span className="text-[var(--tally-text)] font-medium">{selectedItem.unit}</span>
                      </p>
                    </div>
                  )}
                </>
              )}
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

        {/* 8. Save Button - Fixed at bottom */}
        <div className="pb-6">
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

        {/* Negative Stock Confirmation Dialog */}
        <Dialog open={showNegativeStockConfirm} onOpenChange={setShowNegativeStockConfirm}>
          <DialogContent className="max-w-[480px] bg-[var(--tally-bg)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
                {t('confirm.negativeStockTitle')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-[var(--tally-text-muted)]">
                {t('confirm.negativeStockBody')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleNegativeStockConfirm(false)}
                className="flex-1"
              >
                {t('confirm.cancel')}
              </Button>
              <Button
                onClick={() => handleNegativeStockConfirm(true)}
                className="flex-1 bg-[#29978C] hover:bg-[#238579] text-white"
              >
                {t('confirm.continue')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
  