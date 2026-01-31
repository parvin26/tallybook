'use client'

import { useInventoryMovements } from '@/hooks/useInventory'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { InventoryItem } from '@/types'
import Link from 'next/link'

interface InventoryHistoryModalProps {
  item: InventoryItem & { lowStockThreshold?: number | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryHistoryModal({ item, open, onOpenChange }: InventoryHistoryModalProps) {
  const { t } = useTranslation()
  const { data: movements = [], isLoading } = useInventoryMovements(item.id, { enabled: open, limit: 20 })

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'sale':
        return t('inventory.sold')
      case 'restock':
        return t('inventory.added')
      case 'adjustment':
        return t('inventory.adjusted')
      default:
        return type
    }
  }

  const formatQty = (qty: number) => (qty >= 0 ? `+${qty}` : String(qty))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-white rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
            {t('inventory.history')} — {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-[var(--tally-text-muted)]">{t('common.loading')}</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-[var(--tally-text-muted)]">{t('inventory.noHistory')}</div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="bg-[var(--tally-surface)] rounded-lg p-4 border border-[var(--tally-border)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--tally-text)]">
                          {getMovementTypeLabel(movement.type)}
                        </span>
                        <span className="text-sm text-[var(--tally-text-muted)]">
                          {format(new Date(movement.created_at), 'dd MMM yyyy, h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--tally-text-muted)]">
                        {formatQty(movement.quantity_change)} {item.unit}
                      </div>
                    </div>
                    {movement.transaction_id && (
                      <Link
                        href={`/transaction/${movement.transaction_id}`}
                        className="text-xs text-[#29978C] hover:underline"
                      >
                        {t('inventory.viewTransaction')}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
