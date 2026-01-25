import { supabase } from './supabase/supabaseClient'
import { InventoryItem } from '@/types/stock'

export interface InventoryMovement {
  id: string
  inventory_item_id: string
  movement_type: 'opening' | 'adjustment' | 'sale_deduction' | 'expense_addition' | 'manual_adjustment_add' | 'manual_adjustment_remove' | 'restock_add'
  quantity: number // Absolute value for display
  unit: string
  related_transaction_id: string | null
  notes: string | null
  created_at: string
}

export interface InventoryMovementDB {
  id: string
  inventory_item_id: string
  movement_type: string
  quantity: number
  unit: string
  related_transaction_id: string | null
  notes: string | null
  created_at: string
}

/**
 * Fetch inventory items for a business
 */
export async function getInventoryItems(businessId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true })

  if (error) throw error

  // Convert DB format to frontend format
  return (data || []).map(item => ({
    id: item.id,
    business_id: item.business_id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    lowStockThreshold: item.low_stock_threshold,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }))
}

/**
 * Deduct inventory for a sale
 */
export async function deductInventoryForSale(
  inventoryItemId: string,
  quantitySold: number,
  unit: string,
  relatedTransactionId: string,
  businessId?: string
): Promise<{ success: boolean; error?: string; newQuantity?: number }> {
  try {
    // Fetch current item
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Convert DB format
    const inventoryItem: InventoryItem = {
      id: item.id,
      business_id: item.business_id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      lowStockThreshold: item.low_stock_threshold,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }

    // Unit alignment check - must match exactly
    if (unit !== inventoryItem.unit) {
      return { 
        success: false, 
        error: 'Unit mismatch. Selected item uses different unit.' 
      }
    }

    // Compute new quantity
    const newQuantity = inventoryItem.quantity - quantitySold

    // Check for negative stock - return error, let caller handle confirmation
    if (newQuantity < 0) {
      return { success: false, error: 'Stock would go below zero' }
    }

    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', inventoryItemId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Insert movement record
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        inventory_item_id: inventoryItemId,
        business_id: businessId || inventoryItem.business_id,
        movement_type: 'sale_deduction',
        quantity_delta: -quantitySold, // Negative for deduction
        unit: inventoryItem.unit,
        related_transaction_id: relatedTransactionId,
        notes: null,
        occurred_at: new Date().toISOString(),
      })

    if (movementError) {
      // Movement record failed, but stock was updated
      // Log error but don't fail the whole operation
      console.error('[Inventory] Failed to create movement record:', movementError)
    }

    // Check for low stock warning
    const isLowStock = inventoryItem.lowStockThreshold !== null && 
                      inventoryItem.lowStockThreshold !== undefined &&
                      newQuantity <= inventoryItem.lowStockThreshold

    return { 
      success: true, 
      newQuantity,
      error: isLowStock ? 'low_stock' : undefined 
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Get movement history for an item
 */
export async function getInventoryMovements(
  inventoryItemId: string,
  limit: number = 10
): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('inventory_item_id', inventoryItemId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []) as InventoryMovement[]
}

/**
 * Placeholder for manual adjustment (future)
 */
export async function adjustInventoryManually(
  inventoryItemId: string,
  quantity: number,
  adjustmentType: 'add' | 'remove',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement manual adjustment
  return { success: false, error: 'Not implemented yet' }
}
