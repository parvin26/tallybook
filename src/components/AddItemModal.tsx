'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { createItem } from '@/lib/inventory-service'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/inputs/AmountInput'
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
  const businessId = isGuestMode() ? 'guest' : currentBusiness?.id ?? null

  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [unit, setUnit] = useState<Unit>('pcs')
  const [lowStockThreshold, setLowStockThreshold] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!businessId) {
        throw new Error(t('stock.noBusiness'))
      }
      if (!name.trim()) {
        throw new Error(t('stock.nameRequired'))
      }
      const quantityNum = parseFloat(quantity)
      if (isNaN(quantityNum) || quantityNum < 0) {
        throw new Error(t('stock.invalidQuantity'))
      }
      await createItem({
        businessId,
        name: name.trim(),
        quantity: quantityNum,
        unit,
        low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : null,
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(t('stock.itemAdded'))
      onOpenChange(false)
      setName('')
      setCostPrice('')
      setSellingPrice('')
      setQuantity('0')
      setUnit('pcs')
      setLowStockThreshold('')
    },
    onError: (error: Error) => {
      toast.error(error.message || t('stock.saveError') || t('common.couldntSave'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {t('stock.addItem')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
              {t('stock.itemName')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('stock.itemNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Cost Price (per unit) */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
              {t('stock.costPricePerUnit')}
            </label>
            <AmountInput value={costPrice} onChange={setCostPrice} size="sm" />
          </div>

          {/* Selling Price (per unit) */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
              {t('stock.sellingPricePerUnit')}
            </label>
            <AmountInput value={sellingPrice} onChange={setSellingPrice} size="sm" />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
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
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
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
                      : 'bg-card border-border text-foreground'
                  } hover:border-muted-foreground active:scale-95 relative`}
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
            <label className="block text-sm text-muted-foreground mb-2 font-medium">
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
