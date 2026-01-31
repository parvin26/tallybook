/**
 * Guest mode storage utilities
 * Stores transactions locally when user is in guest mode
 */
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_KEYS } from './storage-keys'

/** Guest attachment: stored as data_url (base64) or path for display in edit modal. */
export interface GuestAttachment {
  id: string
  filename: string
  mime_type: string
  storage_path?: string
  data_url?: string
  size_bytes?: number
  created_at?: string
}

export interface GuestTransaction {
  id: string
  transaction_type: 'sale' | 'expense'
  amount: number
  payment_type: string
  payment_method?: string
  payment_provider?: string
  payment_reference?: string
  expense_category?: string
  notes?: string
  transaction_date: string
  created_at: string
  // For sales
  inventory_item_id?: string
  quantity_sold?: number
  /** Attachments (receipts); base64 data_url or paths for edit modal. */
  attachments?: GuestAttachment[]
}

const GUEST_STORAGE_KEY = STORAGE_KEYS.GUEST_TRANSACTIONS
const GUEST_BUSINESS_KEY = 'tally-guest-business'

export interface GuestBusiness {
  name: string
  type?: string
  country?: string
  language?: string
  /** Opening balance for balance sheet (same as setup for auth users). */
  starting_cash?: number
  starting_bank?: number
}

/**
 * Check if user is in guest mode
 */
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true'
}

/**
 * Enable guest mode
 */
export function enableGuestMode(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true')
  // Dispatch custom event to notify AuthContext
  window.dispatchEvent(new CustomEvent('guest-mode-changed', { detail: { enabled: true } }))
}

/**
 * Disable guest mode (clears guest transactions and business only).
 * Used after migration; for explicit "Clear data on this device" use clearAllGuestData().
 */
export function disableGuestMode(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.GUEST_MODE)
  localStorage.removeItem(GUEST_STORAGE_KEY)
  localStorage.removeItem(GUEST_BUSINESS_KEY)
  // Dispatch custom event to notify AuthContext
  window.dispatchEvent(new CustomEvent('guest-mode-changed', { detail: { enabled: false } }))
}

/**
 * Clear all guest data on this device (transactions, business, inventory items and movements).
 * Use only for the explicit "Clear data on this device?" flow. Must not be called on
 * normal logged-in logout. Ensures transactions and inventory are cleared together.
 */
export function clearAllGuestData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.GUEST_MODE)
  localStorage.removeItem(GUEST_STORAGE_KEY)
  localStorage.removeItem(GUEST_BUSINESS_KEY)
  localStorage.removeItem(STORAGE_KEYS.INVENTORY_ITEMS)
  localStorage.removeItem(STORAGE_KEYS.INVENTORY_MOVEMENTS)
  window.dispatchEvent(new CustomEvent('guest-mode-changed', { detail: { enabled: false } }))
}

/**
 * Get guest business profile
 */
export function getGuestBusiness(): GuestBusiness | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(GUEST_BUSINESS_KEY)
    if (!stored) return null
    return JSON.parse(stored) as GuestBusiness
  } catch {
    return null
  }
}

/**
 * Save guest business profile
 */
export function saveGuestBusiness(business: GuestBusiness): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_BUSINESS_KEY, JSON.stringify(business))
}

/**
 * Get all guest transactions
 */
export function getGuestTransactions(): GuestTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as GuestTransaction[]
  } catch {
    return []
  }
}

/**
 * Convert a File to a GuestAttachment (base64 data_url) for storing with a guest transaction.
 */
export function fileToGuestAttachment(file: File): Promise<GuestAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: uuidv4(),
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        data_url: reader.result as string,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Save a guest transaction
 */
export function saveGuestTransaction(transaction: Omit<GuestTransaction, 'id' | 'created_at'>): string {
  if (typeof window === 'undefined') throw new Error('Cannot save in guest mode on server')
  
  const transactions = getGuestTransactions()
  const id = uuidv4()
  const newTransaction: GuestTransaction = {
    ...transaction,
    id,
    created_at: new Date().toISOString(),
  }
  
  transactions.push(newTransaction)
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(transactions))
  return id
}

/**
 * Get a single guest transaction by id (includes inventory_item_id, quantity_sold if present).
 */
export function getGuestTransaction(id: string): GuestTransaction | null {
  if (typeof window === 'undefined') return null
  const transactions = getGuestTransactions()
  return transactions.find((t) => t.id === id) ?? null
}

/**
 * Update a guest transaction (amount, date, payment, notes, expense_category, attachments).
 * Does not change inventory linkage. Pass attachments to add/remove attachments.
 */
export function updateGuestTransaction(
  id: string,
  payload: {
    amount?: number
    transaction_date?: string
    payment_method?: string
    payment_type?: string
    notes?: string
    expense_category?: string
    /** Replace transaction attachments (e.g. after add/remove in edit modal). */
    attachments?: GuestAttachment[]
  }
): void {
  if (typeof window === 'undefined') return
  const transactions = getGuestTransactions()
  const idx = transactions.findIndex((t) => t.id === id)
  if (idx < 0) return
  if (payload.amount != null) transactions[idx].amount = payload.amount
  if (payload.transaction_date != null) transactions[idx].transaction_date = payload.transaction_date
  if (payload.payment_method != null) transactions[idx].payment_method = payload.payment_method
  if (payload.payment_type != null) transactions[idx].payment_type = payload.payment_type
  if (payload.notes !== undefined) transactions[idx].notes = payload.notes
  if (payload.expense_category !== undefined) transactions[idx].expense_category = payload.expense_category
  if (payload.attachments !== undefined) transactions[idx].attachments = payload.attachments
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(transactions))
}

/**
 * Delete a guest transaction
 */
export function deleteGuestTransaction(id: string): void {
  if (typeof window === 'undefined') return
  const transactions = getGuestTransactions()
  const filtered = transactions.filter(t => t.id !== id)
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Clear all guest transactions
 */
export function clearGuestTransactions(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_STORAGE_KEY)
}

/**
 * Get count of guest transactions
 */
export function getGuestTransactionCount(): number {
  return getGuestTransactions().length
}
