'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useInventory } from '@/hooks/useInventory'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import { AppShell } from '@/components/AppShell'
import { InventoryItem } from '@/types'
import { Plus, Edit, Trash2, Package, AlertTriangle, Building2, History, PackagePlus } from 'lucide-react'
import { AddItemModal } from '@/components/AddItemModal'
import { EditItemModal } from '@/components/EditItemModal'
import { InventoryHistoryModal } from '@/components/InventoryHistoryModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AmountInput } from '@/components/inputs/AmountInput'
import { QuickAmountSelector } from '@/components/inputs/QuickAmountSelector'
import { toast } from 'sonner'
import { useQuickAmounts } from '@/hooks/useQuickAmounts'

export default function StockPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentBusiness, needsBusiness } = useBusiness()
  const { items, isLoading, error: queryError, createItem, deleteItem, addMovement } = useInventory()
  const { inventoryPresets } = useQuickAmounts()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState('')

  const businessId = isGuestMode() ? 'guest' : currentBusiness?.id ?? null
  const showInventory = !!businessId

  const handleDelete = async () => {
    if (!deletingItem || !businessId) return
    try {
      await deleteItem(deletingItem.id)
      setDeletingItem(null)
      toast.success(t('common.deleted'))
    } catch {
      toast.error(t('stock.deleteError') || t('common.couldntDelete'))
    }
  }

  const isLowStock = (item: InventoryItem) => {
    const th = item.low_stock_threshold ?? item.lowStockThreshold
    if (th == null) return false
    return item.quantity <= th
  }

  const formatQuantity = (item: InventoryItem) => `${item.quantity} ${item.unit}`

  const handleAddClick = () => {
    if (!showInventory) {
      if (needsBusiness && !isGuestMode()) router.push('/setup')
      return
    }
    setIsAddModalOpen(true)
  }

  const handleRestock = async () => {
    if (!restockItem || !businessId) return
    const q = parseFloat(restockQty)
    if (isNaN(q) || q <= 0) {
      toast.error(t('stock.invalidQuantity'))
      return
    }
    try {
      await addMovement({
        itemId: restockItem.id,
        type: 'restock',
        quantityChange: q,
      })
      setRestockItem(null)
      setRestockQty('')
      toast.success(t('stock.restocked', { name: restockItem.name }) || 'Restocked')
    } catch {
      toast.error(t('common.couldntSave'))
    }
  }

  return (
    <AppShell title={t('stock.title')} showBack showLogo={false}>
      <div className="max-w-[480px] mx-auto px-6 py-6 pb-40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('stock.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items?.length ?? 0} {t('stock.items')}
            </p>
          </div>
          {/* Desktop: Add Item button in header (only when list has items; empty state has its own centered button) */}
          {showInventory && items && items.length > 0 && (
            <Button
              onClick={handleAddClick}
              className="hidden md:flex items-center gap-2 bg-[#29978C] hover:bg-[#238579] text-white"
            >
              <Plus className="w-5 h-5" />
              {t('stock.addItem')}
            </Button>
          )}
        </div>

        {!showInventory && needsBusiness && !isGuestMode() && (
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
                <Button onClick={() => router.push('/setup')} className="tally-button-primary w-full">
                  {t('stock.setupCta') || 'Set up now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showInventory && (
          <>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
            ) : queryError ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">{t('stock.noItems')}</p>
                <Button onClick={handleAddClick} className="bg-[#29978C] hover:bg-[#238579] text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('stock.addItem')}
                </Button>
              </div>
            ) : !items || items.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">{t('stock.noItems')}</p>
                <Button onClick={handleAddClick} className="bg-[#29978C] hover:bg-[#238579] text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  {t('stock.addItem')}
                </Button>
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
                        <div className="w-12 h-12 bg-[rgba(41,151,140,0.12)] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-[#29978C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{formatQuantity(item)}</p>
                          {lowStock && (
                            <div className="flex items-center gap-1 mt-2">
                              <AlertTriangle className="w-4 h-4 text-[#EA6C3C]" />
                              <span className="text-xs text-[#EA6C3C] font-medium">{t('stock.lowStock')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => setHistoryItem(item)}
                              className="flex items-center gap-1 text-xs text-[#29978C] hover:underline"
                            >
                              <History className="w-3 h-3" />
                              {t('inventory.history')}
                            </button>
                            <button
                              onClick={() => {
                                setRestockItem(item)
                                setRestockQty('')
                              }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <PackagePlus className="w-3 h-3" />
                              {t('stock.restock') || 'Restock'}
                            </button>
                          </div>
                        </div>
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

            {/* FAB: Add Item (mobile only) */}
            {showInventory && (
              <button
                onClick={handleAddClick}
                className="fixed bottom-24 right-6 w-14 h-14 md:hidden bg-[#29978C] hover:bg-[#238579] text-white rounded-full flex items-center justify-center shadow-lg transition-colors active:scale-95 z-40"
                aria-label={t('stock.addItem')}
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            )}
          </>
        )}

        {showInventory && (
          <AddItemModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
        )}

        {editingItem && (
          <EditItemModal
            item={{ ...editingItem, lowStockThreshold: editingItem.low_stock_threshold ?? editingItem.lowStockThreshold }}
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
          />
        )}

        {historyItem && (
          <InventoryHistoryModal
            item={{ ...historyItem, lowStockThreshold: historyItem.low_stock_threshold ?? historyItem.lowStockThreshold }}
            open={!!historyItem}
            onOpenChange={(open) => !open && setHistoryItem(null)}
          />
        )}

        {/* Restock modal */}
        <Dialog open={!!restockItem} onOpenChange={(open) => !open && setRestockItem(null)}>
          <DialogContent className="max-w-[480px] bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {t('stock.restock') || 'Restock'} — {restockItem?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-medium">
                  {t('stock.quantity')}
                </label>
                <div className="p-4">
                  <AmountInput
                    value={restockQty}
                    onChange={setRestockQty}
                    currency={restockItem?.unit}
                  />
                </div>
                <QuickAmountSelector
                  presets={inventoryPresets}
                  onSelect={(n) => setRestockQty(String(n))}
                  selectedAmount={undefined}
                  variant="sale"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setRestockItem(null)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1 tally-button-primary" onClick={handleRestock}>
                  {t('stock.restock') || 'Restock'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              <Button variant="outline" onClick={() => setDeletingItem(null)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-[#B94A3A] hover:bg-[#A03A2A] text-white"
              >
                {t('common.delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
