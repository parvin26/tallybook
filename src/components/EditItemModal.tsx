'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { updateItem } from '@/lib/inventory-service'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/inputs/AmountInput'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import type { InventoryItem } from '@/types'

type Unit = 'pcs' | 'pack' | 'kg' | 'g' | 'l' | 'ml'

const units: Unit[] = ['pcs', 'pack', 'kg', 'g', 'l', 'ml']

interface EditItemModalProps {
  item: InventoryItem & { lowStockThreshold?: number | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemModal({ item, open, onOpenChange }: EditItemModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { currentBusiness } = useBusiness()
  const businessId = isGuestMode() ? 'guest' : currentBusiness?.id ?? null

  const [name, setName] = useState(item.name)
  const [costPrice, setCostPrice] = useState((item.cost_price ?? 0).toString())
  const [sellingPrice, setSellingPrice] = useState((item.selling_price ?? 0).toString())
  const [unit, setUnit] = useState<Unit>(item.unit as Unit)
  const [lowStockThreshold, setLowStockThreshold] = useState(
    (item.low_stock_threshold ?? item.lowStockThreshold)?.toString() || ''
  )

  useEffect(() => {
    setName(item.name)
    setCostPrice((item.cost_price ?? 0).toString())
    setSellingPrice((item.selling_price ?? 0).toString())
    setUnit(item.unit as Unit)
    setLowStockThreshold((item.low_stock_threshold ?? item.lowStockThreshold)?.toString() || '')
  }, [item])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error(t('stock.nameRequired'))
      if (!businessId) throw new Error(t('stock.noBusiness'))
      await updateItem(item.id, businessId, {
        name: name.trim(),
        unit,
        low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(t('stock.itemUpdated'))
      onOpenChange(false)
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
      <DialogContent className="w-full max-w-lg bg-white p-6 shadow-lg rounded-xl border border-[var(--tally-border)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
            {t('stock.editItem')}
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

          {/* Cost Price (per unit) */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.costPricePerUnit')}
            </label>
            <AmountInput value={costPrice} onChange={setCostPrice} size="sm" />
          </div>

          {/* Selling Price (per unit) */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.sellingPricePerUnit')}
            </label>
            <AmountInput value={sellingPrice} onChange={setSellingPrice} size="sm" />
          </div>

          {/* Quantity is ledger-driven (Restock / Sale); show read-only */}
          <div>
            <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
              {t('stock.quantity')}
            </label>
            <div className="py-3 px-4 bg-muted/50 rounded-lg text-muted-foreground">
              {item.quantity} {item.unit}
            </div>
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
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
