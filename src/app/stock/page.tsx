'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { AppShell } from '@/components/AppShell'
import { InventoryItem, InventoryItemDB } from '@/types/stock'
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react'
import { AddItemModal } from '@/components/AddItemModal'
import { EditItemModal } from '@/components/EditItemModal'
import { InventoryHistoryModal } from '@/components/InventoryHistoryModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronRight, History } from 'lucide-react'
import { toast } from 'sonner'

export default function StockPage() {
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)

  const { data: items, isLoading, error: queryError } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness?.id) return []
      
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('name', { ascending: true })

      if (error) {
        // Handle missing table gracefully
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('[Stock] Table inventory_items does not exist yet')
          return []
        }
        throw error
      }
      
      // Convert DB format (snake_case) to frontend format (camelCase)
      return (data as InventoryItemDB[] || []).map(item => ({
        id: item.id,
        business_id: item.business_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        lowStockThreshold: item.low_stock_threshold,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    },
    enabled: !!currentBusiness?.id,
    retry: false, // Don't retry on table missing errors
  })

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setDeletingItem(null)
    },
    onError: (error: Error) => {
      toast.error(t('stock.deleteError') || t('common.couldntDelete'))
    },
  })

  const handleDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id)
    }
  }

  const isLowStock = (item: InventoryItem) => {
    if (!item.lowStockThreshold) return false
    return item.quantity <= item.lowStockThreshold
  }

  const formatQuantity = (item: InventoryItem) => {
    return `${item.quantity} ${item.unit}`
  }

  return (
    <AppShell title={t('stock.title')} showBack showLogo={false}>
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('stock.title')}</h1>
            <p className="text-sm text-[var(--tally-text-muted)] mt-1">
              {items?.length || 0} {t('stock.items')}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 bg-[#29978C] hover:bg-[#238579] text-white rounded-lg flex items-center justify-center shadow-md transition-colors active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Items List */}
        {isLoading ? (
          <div className="text-center py-12 text-[var(--tally-text-muted)]">
            {t('common.loading')}
          </div>
        ) : queryError ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[var(--tally-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--tally-text-muted)]">{t('stock.noItems')}</p>
            <p className="text-xs text-[var(--tally-text-muted)] mt-2">
              {t('stock.tableNotReady')}
            </p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[var(--tally-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--tally-text-muted)]">{t('stock.noItems')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const lowStock = isLowStock(item)
              return (
                <div
                  key={item.id}
                  className={`bg-[var(--tally-surface)] rounded-lg p-4 border ${
                    lowStock ? 'border-[#EA6C3C]' : 'border-[var(--tally-border)]'
                  } shadow-sm`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-[rgba(41,151,140,0.12)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-[#29978C]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[var(--tally-text)] mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[var(--tally-text-muted)]">
                        {formatQuantity(item)}
                      </p>
                      {lowStock && (
                        <div className="flex items-center gap-1 mt-2">
                          <AlertTriangle className="w-4 h-4 text-[#EA6C3C]" />
                          <span className="text-xs text-[#EA6C3C] font-medium">
                            {t('stock.lowStock')}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setHistoryItem(item)}
                        className="flex items-center gap-1 mt-2 text-xs text-[#29978C] hover:underline"
                      >
                        <History className="w-3 h-3" />
                        {t('inventory.history')}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 hover:bg-[var(--tally-surface-2)] rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5 text-[var(--tally-text-muted)]" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 hover:bg-[var(--tally-surface-2)] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-[#B94A3A]" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Item Modal */}
        <AddItemModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
        />

        {/* Edit Item Modal */}
        {editingItem && (
          <EditItemModal
            item={editingItem}
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
          />
        )}

        {/* History Modal */}
        {historyItem && (
          <InventoryHistoryModal
            item={historyItem}
            open={!!historyItem}
            onOpenChange={(open) => !open && setHistoryItem(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <DialogContent className="max-w-[480px] bg-[var(--tally-bg)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
                {t('stock.deleteConfirm')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-[var(--tally-text-muted)]">
                {t('stock.deleteConfirmMessage', { name: deletingItem?.name })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingItem(null)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-[#B94A3A] hover:bg-[#A03A2A] text-white"
              >
                {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
