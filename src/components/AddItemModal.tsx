'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

type Unit = 'pcs' | 'pack' | 'kg' | 'g' | 'l' | 'ml'

const units: Unit[] = ['pcs', 'pack', 'kg', 'g', 'l', 'ml']

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddItemModal({ open, onOpenChange }: AddItemModalProps) {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [unit, setUnit] = useState<Unit>('pcs')
  const [lowStockThreshold, setLowStockThreshold] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentBusiness?.id) {
        throw new Error(t('stock.noBusiness'))
      }

      if (!name.trim()) {
        throw new Error(t('stock.nameRequired'))
      }

      const quantityNum = parseFloat(quantity)
      if (isNaN(quantityNum) || quantityNum < 0) {
        throw new Error(t('stock.invalidQuantity'))
      }

      const { error } = await supabase
        .from('inventory_items')
        .insert({
          business_id: currentBusiness.id,
          name: name.trim(),
          quantity: quantityNum,
          unit,
          low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : null,
        })

      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          throw new Error(t('stock.tableNotReady'))
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(t('stock.itemAdded'))
      onOpenChange(false)
      // Reset form
      setName('')
      setQuantity('0')
      setUnit('pcs')
      setLowStockThreshold('')
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t('stock.saveError') || t('common.couldntSave')
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-[var(--tally-bg)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
            {t('stock.addItem')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.itemName')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('stock.itemNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.quantity')}
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Unit Selector */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.unit')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {units.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    unit === u
                      ? 'bg-[rgba(41,151,140,0.12)] border-[#29978C] text-[#29978C]'
                      : 'bg-[var(--tally-surface)] border-[var(--tally-border)] text-[var(--tally-text)]'
                  } hover:border-[var(--tally-text-muted)] active:scale-95 relative`}
                >
                  {unit === u && (
                    <Check className="w-4 h-4 absolute top-1 right-1" />
                  )}
                  <span className="text-sm font-medium">{t(`stock.units.${u}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Low Stock Threshold (Optional) */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.lowStockThreshold')} <span className="text-xs">({t('common.optional')})</span>
            </label>
            <Input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder={t('stock.lowStockThresholdPlaceholder')}
              min="0"
              step="0.01"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="w-full h-14 bg-[#29978C] hover:bg-[#238579] text-white font-semibold rounded-lg shadow-md"
          >
            {mutation.isPending ? t('common.saving') : t('stock.addItem')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
