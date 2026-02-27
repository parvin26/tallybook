'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { createItem } from '@/lib/inventory-service'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/inputs/AmountInput'
import { useCurrency } from '@/hooks/useCurrency'
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
  const { symbol: currencySymbol } = useCurrency()
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

  const costNumber = Number.parseFloat(costPrice)
  const sellingNumber = Number.parseFloat(sellingPrice)
  const profitPerUnit = useMemo(() => {
    if (Number.isNaN(costNumber) || Number.isNaN(sellingNumber)) return null
    return sellingNumber - costNumber
  }, [costNumber, sellingNumber])

  const handleFieldFocus = (event: React.FocusEvent<HTMLElement>) => {
    ;(event.target as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] w-[calc(100vw-1rem)] max-h-[92dvh] overflow-hidden bg-background p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold text-foreground">
            {t('stock.addItem')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="space-y-6">
            {/* Item Name */}
            <div>
              <label className="block text-sm text-foreground/80 mb-2 font-medium">
                {t('stock.itemName')}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={handleFieldFocus}
                placeholder={t('stock.itemNamePlaceholder')}
                autoFocus
              />
            </div>

            {/* Cost Price (per unit) */}
            <div>
              <label className="block text-sm text-foreground/80 mb-2 font-medium">
                {t('stock.costPricePerUnit')}
              </label>
              <AmountInput value={costPrice} onChange={setCostPrice} size="sm" />
            </div>

            {/* Selling Price (per unit) */}
            <div>
              <label className="block text-sm text-foreground/80 mb-2 font-medium">
                {t('stock.sellingPricePerUnit')}
              </label>
              <AmountInput value={sellingPrice} onChange={setSellingPrice} size="sm" />
              {profitPerUnit !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Profit per unit:{' '}
                  <span className="font-medium text-foreground">
                    {currencySymbol} {profitPerUnit.toFixed(2)}
                  </span>
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm text-foreground/80 mb-2 font-medium">
                {t('stock.quantity')}
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onFocus={handleFieldFocus}
                min="0"
                step="0.01"
              />
            </div>

            {/* Unit Selector */}
            <div>
              <label className="block text-sm text-foreground/80 mb-2 font-medium">
                {t('stock.unit')}
              </label>
              <div className="flex gap-2 mb-3">
                {(['pcs', 'kg'] as Unit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium relative ${
                      unit === u
                        ? 'bg-[rgba(41,151,140,0.12)] border-[#29978C] text-[#29978C]'
                        : 'bg-card border-border text-foreground'
                    }`}
                  >
                    {unit === u && <Check className="w-3.5 h-3.5 absolute top-1 right-1" />}
                    {t(`stock.units.${u}`)}
                  </button>
                ))}
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {t(`stock.units.${u}`)}
                  </option>
                ))}
              </select>
            </div>

              {/* Low Stock Threshold (Optional) */}
              <div>
                <label className="block text-sm text-foreground/80 mb-2 font-medium">
                  {t('stock.lowStockThreshold')} <span className="text-xs">({t('common.optional')})</span>
                </label>
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  onFocus={handleFieldFocus}
                  placeholder={t('stock.lowStockThresholdPlaceholder')}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <div
            className="border-t border-border bg-background/95 backdrop-blur px-6 pt-3 pb-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <Button
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              className="w-full h-14 bg-[#29978C] hover:bg-[#238579] text-white font-semibold rounded-lg shadow-md"
            >
              {mutation.isPending ? t('common.saving') : t('stock.addItem')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
