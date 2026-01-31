/**
 * Guest data migration: upload LocalStorage (transactions + inventory) to Supabase on sign-up/login.
 * Preserves UUIDs and uses upsert to avoid duplicates if sync runs twice.
 */
import { supabase } from './supabase/supabaseClient'
import { STORAGE_KEYS } from './storage-keys'
import { getGuestTransactions, type GuestTransaction } from './guest-storage'
import type { InventoryItem } from '@/types'

const BATCH_SIZE = 50

function legacyPaymentToMethod(s: string): 'cash' | 'bank_transfer' | 'card' | 'e_wallet' | 'other' {
  if (s === 'cash' || s === 'bank_transfer' || s === 'card' || s === 'e_wallet' || s === 'other') return s
  if (s === 'credit') return 'card'
  if (['duitnow', 'tng', 'boost', 'grabpay', 'shopeepay', 'mobile_money'].includes(s)) return 'e_wallet'
  return 'other'
}

function getGuestInventoryItems(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as (InventoryItem & { lowStockThreshold?: number | null })[]
    return parsed.filter((i) => i.business_id === 'guest')
  } catch {
    return []
  }
}

function hasGuestData(): boolean {
  if (typeof window === 'undefined') return false
  const transactions = getGuestTransactions()
  const itemsRaw = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS)
  let hasItems = false
  if (itemsRaw) {
    try {
      const items = JSON.parse(itemsRaw) as { business_id?: string }[]
      hasItems = items.some((i) => i.business_id === 'guest')
    } catch {
      // ignore
    }
  }
  return transactions.length > 0 || hasItems
}

/**
 * Clear only guest data keys after successful migration.
 * Does NOT clear INTRO_SEEN or LANGUAGE.
 */
function clearGuestDataKeys(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.GUEST_MODE)
  localStorage.removeItem(STORAGE_KEYS.GUEST_TRANSACTIONS)
  localStorage.removeItem(STORAGE_KEYS.INVENTORY_ITEMS)
  localStorage.removeItem(STORAGE_KEYS.INVENTORY_MOVEMENTS)
  localStorage.removeItem('tally-guest-business')
  window.dispatchEvent(new CustomEvent('guest-mode-changed', { detail: { enabled: false } }))
}

/**
 * Migrate guest data to Supabase.
 * @param businessId - Business to migrate into (User = Business for MVP).
 * Preserves transaction and inventory_item UUIDs; uses upsert to avoid duplicates on partial re-run.
 */
export async function migrateGuestData(businessId: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('migrateGuestData must run in browser')
  }

  const transactions = getGuestTransactions()
  const inventoryItems = getGuestInventoryItems()

  if (transactions.length === 0 && inventoryItems.length === 0) {
    return
  }

  const now = new Date().toISOString()

  // 1. Upsert inventory_items (current stock counts only; no movements to avoid double-trigger)
  if (inventoryItems.length > 0) {
    const rows = inventoryItems.map((item) => ({
      id: item.id,
      business_id: businessId,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      low_stock_threshold: item.low_stock_threshold ?? item.lowStockThreshold ?? null,
      cost_price: Number(item.cost_price) || 0,
      selling_price: Number(item.selling_price) || 0,
      created_at: item.created_at || now,
      updated_at: now,
    }))

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('inventory_items')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: false })

      if (error) throw error
    }
  }

  // 2. Upsert transactions (preserve UUIDs)
  if (transactions.length > 0) {
    const rows = transactions.map((t: GuestTransaction) => ({
      id: t.id,
      business_id: businessId,
      transaction_type: t.transaction_type,
      amount: Number(t.amount),
      payment_method: t.payment_method ? legacyPaymentToMethod(t.payment_method) : legacyPaymentToMethod(t.payment_type),
      payment_reference: t.payment_reference ?? null,
      expense_category: t.expense_category ?? null,
      notes: t.notes ?? null,
      transaction_date: t.transaction_date,
      created_at: t.created_at || now,
    }))

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('transactions')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: false })

      if (error) throw error
    }
  }

  clearGuestDataKeys()
}

export { hasGuestData }
