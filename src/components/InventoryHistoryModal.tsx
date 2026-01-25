'use client'

import { useQuery } from '@tanstack/react-query'
import { getInventoryMovements, InventoryMovement } from '@/lib/inventory'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { InventoryItem } from '@/types/stock'
import Link from 'next/link'

interface InventoryHistoryModalProps {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryHistoryModal({ item, open, onOpenChange }: InventoryHistoryModalProps) {
  const { t } = useTranslation()

  const { data: movements = [], isLoading } = useQuery<InventoryMovement[]>({
    queryKey: ['inventory-movements', item.id],
    queryFn: () => getInventoryMovements(item.id, 10),
    enabled: open,
  })

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'sale_deduction':
        return t('inventory.sold')
      case 'restock_add':
        return t('inventory.added')
      case 'manual_adjustment_add':
        return t('inventory.adjusted')
      case 'manual_adjustment_remove':
        return t('inventory.adjusted')
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-[var(--tally-bg)] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
            {t('inventory.history')} - {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-[var(--tally-text-muted)]">
              {t('common.loading')}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-[var(--tally-text-muted)]">
              {t('inventory.noHistory')}
            </div>
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
                          {getMovementTypeLabel(movement.movement_type)}
                        </span>
                        <span className="text-sm text-[var(--tally-text-muted)]">
                          {format(new Date(movement.created_at), 'dd MMM yyyy, h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--tally-text-muted)]">
                        {movement.quantity} {movement.unit}
                      </div>
                    </div>
                    {movement.related_transaction_id && (
                      <Link
                        href={`/transaction/${movement.related_transaction_id}`}
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
