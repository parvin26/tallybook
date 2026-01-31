/**
 * Inventory service — single source of truth (Ledger Principle).
 * Guest mode: localStorage (tally-inventory-items, tally-inventory-movements), manual quantity sync.
 * Auth mode: Supabase + DB trigger for quantity updates.
 */
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_KEYS } from './storage-keys'
import { supabase } from './supabase/supabaseClient'
import type { InventoryItem, InventoryMovement } from '@/types'

function getGuestItemsKey(): string {
  return STORAGE_KEYS.INVENTORY_ITEMS
}
function getGuestMovementsKey(): string {
  return STORAGE_KEYS.INVENTORY_MOVEMENTS
}

function isGuest(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true'
}

function getGuestBusinessId(): string {
  return 'guest'
}

// --- Guest storage helpers ---
function getGuestItems(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getGuestItemsKey())
    if (!raw) return []
    return JSON.parse(raw) as InventoryItem[]
  } catch {
    return []
  }
}

function setGuestItems(items: InventoryItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getGuestItemsKey(), JSON.stringify(items))
}

function getGuestMovements(): InventoryMovement[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getGuestMovementsKey())
    if (!raw) return []
    return JSON.parse(raw) as InventoryMovement[]
  } catch {
    return []
  }
}

function setGuestMovements(movements: InventoryMovement[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getGuestMovementsKey(), JSON.stringify(movements))
}

// --- Public API ---

/** Get all inventory items for the current context (guest or business). */
export async function getInventory(businessId: string | null): Promise<InventoryItem[]> {
  if (isGuest()) {
    const items = getGuestItems()
    return items
      .filter((i) => i.business_id === getGuestBusinessId())
      .map((i) => ({
        ...i,
        cost_price: Number(i.cost_price) || 0,
        selling_price: Number(i.selling_price) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  if (!businessId) return []

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true })

  if (error) {
    if (error.code === '42P01' || String(error.message || '').includes('does not exist')) return []
    throw error
  }

  return (data || []).map((row) => {
    const low = row.low_stock_threshold != null ? Number(row.low_stock_threshold) : null
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      low_stock_threshold: low,
      lowStockThreshold: low,
      cost_price: Number(row.cost_price ?? 0),
      selling_price: Number(row.selling_price ?? 0),
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as InventoryItem
  })
}

/** Create a new inventory item. */
export async function createItem(params: {
  businessId: string
  name: string
  quantity?: number
  unit: string
  low_stock_threshold?: number | null
  cost_price?: number
  selling_price?: number
}): Promise<InventoryItem> {
  const id = uuidv4()
  const now = new Date().toISOString()
  const quantity = params.quantity ?? 0
  const costPrice = Number(params.cost_price) || 0
  const sellingPrice = Number(params.selling_price) || 0

  if (isGuest()) {
    const low = params.low_stock_threshold ?? null
    const item: InventoryItem = {
      id,
      business_id: getGuestBusinessId(),
      name: params.name.trim(),
      quantity,
      unit: params.unit,
      low_stock_threshold: low,
      lowStockThreshold: low,
      cost_price: costPrice,
      selling_price: sellingPrice,
      created_at: now,
      updated_at: now,
    }
    const items = getGuestItems()
    items.push(item)
    setGuestItems(items)
    return item
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      id,
      business_id: params.businessId,
      name: params.name.trim(),
      quantity,
      unit: params.unit,
      low_stock_threshold: params.low_stock_threshold ?? null,
      cost_price: costPrice,
      selling_price: sellingPrice,
    })
    .select()
    .single()

  if (error) throw error
  const low = data.low_stock_threshold != null ? Number(data.low_stock_threshold) : null
  return {
    id: data.id,
    business_id: data.business_id,
    name: data.name,
    quantity: Number(data.quantity),
    unit: data.unit,
    low_stock_threshold: low,
    lowStockThreshold: low,
    cost_price: Number(data.cost_price ?? 0),
    selling_price: Number(data.selling_price ?? 0),
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as InventoryItem
}

/**
 * Add a movement. Auth: insert only (trigger updates quantity). Guest: insert movement and manually update item quantity.
 */
export async function addMovement(params: {
  businessId: string
  itemId: string
  type: 'sale' | 'restock' | 'adjustment'
  quantityChange: number
  transactionId?: string | null
}): Promise<InventoryMovement> {
  const id = uuidv4()
  const now = new Date().toISOString()

  if (isGuest()) {
    const movement: InventoryMovement = {
      id,
      item_id: params.itemId,
      business_id: getGuestBusinessId(),
      type: params.type,
      quantity_change: params.quantityChange,
      transaction_id: params.transactionId ?? null,
      created_at: now,
    }
    const movements = getGuestMovements()
    movements.unshift(movement)
    setGuestMovements(movements)

    const items = getGuestItems()
    const idx = items.findIndex((i) => i.id === params.itemId)
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        quantity: items[idx].quantity + params.quantityChange,
        updated_at: now,
      }
      setGuestItems(items)
    }
    return movement
  }

  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      id,
      item_id: params.itemId,
      business_id: params.businessId,
      type: params.type,
      quantity_change: params.quantityChange,
      transaction_id: params.transactionId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    item_id: data.item_id,
    business_id: data.business_id,
    type: data.type,
    quantity_change: Number(data.quantity_change),
    transaction_id: data.transaction_id,
    created_at: data.created_at,
  } as InventoryMovement
}

/** Update an inventory item (name, unit, low_stock_threshold only; quantity is ledger-driven). */
export async function updateItem(
  itemId: string,
  businessId: string,
  params: { name?: string; unit?: string; low_stock_threshold?: number | null }
): Promise<void> {
  if (isGuest()) {
    const items = getGuestItems()
    const idx = items.findIndex((i) => i.id === itemId)
    if (idx >= 0) {
      if (params.name != null) items[idx].name = params.name
      if (params.unit != null) items[idx].unit = params.unit
      if (params.low_stock_threshold !== undefined) {
        items[idx].low_stock_threshold = params.low_stock_threshold
        items[idx].lowStockThreshold = params.low_stock_threshold
      }
      items[idx].updated_at = new Date().toISOString()
      setGuestItems(items)
    }
    return
  }
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (params.name != null) payload.name = params.name
  if (params.unit != null) payload.unit = params.unit
  if (params.low_stock_threshold !== undefined) payload.low_stock_threshold = params.low_stock_threshold
  const { error } = await supabase
    .from('inventory_items')
    .update(payload)
    .eq('id', itemId)
    .eq('business_id', businessId)
  if (error) throw error
}

/** Delete an inventory item (and its movements in guest storage). */
export async function deleteItem(itemId: string, businessId: string): Promise<void> {
  if (isGuest()) {
    setGuestItems(getGuestItems().filter((i) => i.id !== itemId))
    setGuestMovements(getGuestMovements().filter((m) => m.item_id !== itemId))
    return
  }
  const { error } = await supabase.from('inventory_items').delete().eq('id', itemId).eq('business_id', businessId)
  if (error) throw error
}

/** Get movements for an item (for history modal). */
export async function getMovements(itemId: string, limit = 20): Promise<InventoryMovement[]> {
  if (isGuest()) {
    return getGuestMovements()
      .filter((m) => m.item_id === itemId)
      .slice(0, limit)
  }

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }

  return (data || []).map((row) => ({
    id: row.id,
    item_id: row.item_id,
    business_id: row.business_id,
    type: row.type,
    quantity_change: Number(row.quantity_change),
    transaction_id: row.transaction_id,
    created_at: row.created_at,
  })) as InventoryMovement[]
}

/** Get all sale movements for a business (for Sales by item report). */
export async function getSaleMovements(businessId: string | null): Promise<InventoryMovement[]> {
  if (isGuest()) {
    return getGuestMovements().filter((m) => m.type === 'sale')
  }
  if (!businessId) return []

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('business_id', businessId)
    .eq('type', 'sale')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }

  return (data || []).map((row) => ({
    id: row.id,
    item_id: row.item_id,
    business_id: row.business_id,
    type: row.type,
    quantity_change: Number(row.quantity_change),
    transaction_id: row.transaction_id,
    created_at: row.created_at,
  })) as InventoryMovement[]
}
