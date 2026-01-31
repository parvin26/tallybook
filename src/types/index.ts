export interface Business {
  id: string
  user_id: string
  name: string
  business_type: string
  state: string
  city?: string
  starting_cash: number
  starting_bank: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Attachment row as returned by Supabase (transaction_attachments relation) or guest. */
export interface TransactionAttachmentRow {
  id: string
  transaction_id?: string
  business_id?: string
  storage_path: string
  filename: string
  mime_type: string
  size_bytes?: number
  created_at?: string
  /** Guest mode: optional data URL for display */
  data_url?: string
}

/** MVP transaction: only sale | expense. payment_method is the single payment field. */
export interface Transaction {
  id: string
  business_id: string
  transaction_type: 'sale' | 'expense'
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'e_wallet' | 'other'
  payment_reference: string | null
  /** Required when transaction_type is 'expense' (enforced by DB). */
  expense_category?: string | null
  notes?: string | null
  transaction_date: string
  created_at: string
  /** Fetched with Supabase select('*, transaction_attachments(*)') or guest attachments. */
  transaction_attachments?: TransactionAttachmentRow[]
}

/** Inventory item (ledger source of truth). Use low_stock_threshold (DB) or lowStockThreshold (UI). */
export interface InventoryItem {
  id: string
  business_id: string
  name: string
  quantity: number
  unit: string
  low_stock_threshold: number | null
  lowStockThreshold?: number | null
  cost_price: number
  selling_price: number
  created_at: string
  updated_at: string
}

/** Inventory movement. type 'sale' => quantity_change negative; 'restock'/'adjustment' => add/subtract. */
export interface InventoryMovement {
  id: string
  item_id: string
  business_id: string
  type: 'sale' | 'restock' | 'adjustment'
  quantity_change: number
  transaction_id: string | null
  created_at: string
}
