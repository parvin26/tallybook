/**
 * Guest mode storage utilities
 * Stores transactions locally when user is in guest mode
 */

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
}

const GUEST_STORAGE_KEY = 'tally-guest-transactions'
const GUEST_MODE_KEY = 'tally-guest-mode'
const GUEST_BUSINESS_KEY = 'tally-guest-business'

export interface GuestBusiness {
  name: string
  type?: string
  country?: string
  language?: string
}

/**
 * Check if user is in guest mode
 */
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(GUEST_MODE_KEY) === 'true'
}

/**
 * Enable guest mode
 */
export function enableGuestMode(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_MODE_KEY, 'true')
}

/**
 * Disable guest mode
 */
export function disableGuestMode(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_MODE_KEY)
  localStorage.removeItem(GUEST_STORAGE_KEY)
  localStorage.removeItem(GUEST_BUSINESS_KEY)
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
 * Save a guest transaction
 */
export function saveGuestTransaction(transaction: Omit<GuestTransaction, 'id' | 'created_at'>): string {
  if (typeof window === 'undefined') throw new Error('Cannot save in guest mode on server')
  
  const transactions = getGuestTransactions()
  const id = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
