import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { isGuestMode } from '@/lib/guest-storage'
import {
  getInventory,
  createItem,
  addMovement,
  getMovements,
  getSaleMovements,
  deleteItem as deleteItemService,
} from '@/lib/inventory-service'
import type { InventoryItem, InventoryMovement } from '@/types'

const INVENTORY_QUERY_KEY = 'inventory'

export function useInventory() {
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  const businessId = typeof window !== 'undefined' && isGuestMode() ? 'guest' : currentBusiness?.id ?? null

  const query = useQuery<InventoryItem[]>({
    queryKey: [INVENTORY_QUERY_KEY, businessId],
    queryFn: () => getInventory(businessId),
    enabled: businessId != null,
  })

  const createItemMutation = useMutation({
    mutationFn: (params: {
      name: string
      quantity?: number
      unit: string
      low_stock_threshold?: number | null
    }) =>
      createItem({
        businessId: businessId!,
        name: params.name,
        quantity: params.quantity,
        unit: params.unit,
        low_stock_threshold: params.low_stock_threshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })

  const addMovementMutation = useMutation({
    mutationFn: (params: {
      itemId: string
      type: 'sale' | 'restock' | 'adjustment'
      quantityChange: number
      transactionId?: string | null
    }) =>
      addMovement({
        businessId: businessId!,
        itemId: params.itemId,
        type: params.type,
        quantityChange: params.quantityChange,
        transactionId: params.transactionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteItemService(itemId, businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createItem: createItemMutation.mutateAsync,
    createItemStatus: createItemMutation.status,
    createItemError: createItemMutation.error,
    addMovement: addMovementMutation.mutateAsync,
    addMovementStatus: addMovementMutation.status,
    deleteItem: deleteItemMutation.mutateAsync,
    deleteItemStatus: deleteItemMutation.status,
    invalidate: () => queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] }),
  }
}

export function useInventoryMovements(itemId: string | null, options?: { enabled?: boolean; limit?: number }) {
  const limit = options?.limit ?? 20
  const enabled = (options?.enabled ?? true) && itemId != null

  return useQuery<InventoryMovement[]>({
    queryKey: ['inventory-movements', itemId, limit],
    queryFn: () => getMovements(itemId!, limit),
    enabled,
  })
}

/** Sale movements for the current business (for Sales by item report). */
export function useSaleMovements() {
  const { currentBusiness } = useBusiness()
  const businessId = typeof window !== 'undefined' && isGuestMode() ? 'guest' : currentBusiness?.id ?? null
  return useQuery<InventoryMovement[]>({
    queryKey: ['sale-movements', businessId],
    queryFn: () => getSaleMovements(businessId),
    enabled: businessId != null,
  })
}
