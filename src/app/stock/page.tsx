'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { AppShell } from '@/components/AppShell'
import { InventoryItem, InventoryItemDB } from '@/types/stock'
import { Plus, Edit, Trash2, Package, AlertTriangle, Building2 } from 'lucide-react'
import { AddItemModal } from '@/components/AddItemModal'
import { EditItemModal } from '@/components/EditItemModal'
import { InventoryHistoryModal } from '@/components/InventoryHistoryModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { History } from 'lucide-react'
import { toast } from 'sonner'

export default function StockPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentBusiness, needsBusiness } = useBusiness()
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

  const handleAddClick = () => {
    if (!currentBusiness) {
      // Route to setup page to create business
      router.push('/setup')
      return
    }
    setIsAddModalOpen(true)
  }

  return (
    <AppShell title={t('stock.title')} showBack showLogo={false}>
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('stock.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items?.length || 0} {t('stock.items')}
            </p>
          </div>
          {currentBusiness && (
            <button
              onClick={handleAddClick}
              className="w-12 h-12 bg-[#29978C] hover:bg-[#238579] text-white rounded-lg flex items-center justify-center shadow-md transition-colors active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* No Business Empty State - Calm card, no setup UI mixing */}
        {!currentBusiness && needsBusiness && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-card rounded-2xl shadow-[var(--shadow-soft)] max-w-sm w-full border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[rgba(41,151,140,0.12)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('stock.setupTitle') || 'Set up your business'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('stock.setupBody') || 'Add a business before you start tracking stock.'}
                </p>
                <Button
                  onClick={() => router.push('/setup')}
                  className="tally-button-primary w-full"
                >
                  {t('stock.setupCta') || 'Set up now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Items List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : queryError ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('stock.noItems')}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {t('stock.tableNotReady')}
            </p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('stock.noItems')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const lowStock = isLowStock(item)
              return (
                <div
                  key={item.id}
                  className={`bg-card rounded-lg p-4 shadow-[var(--shadow-soft)] ${
                    lowStock ? 'ring-2 ring-[#EA6C3C] ring-opacity-30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-[rgba(41,151,140,0.12)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-[#29978C]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
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
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
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

        {/* Add Item Modal - Only show if business exists */}
        {currentBusiness && (
          <AddItemModal
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
          />
        )}

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
          <DialogContent className="max-w-[480px] bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {t('stock.deleteConfirm')}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
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
