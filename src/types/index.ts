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

export interface Transaction {
  id: string
  business_id: string
  transaction_type: 'sale' | 'expense' | 'payment_received' | 'payment_made'
  amount: number
  payment_type: 'cash' | 'bank_transfer' | 'duitnow' | 'tng' | 'boost' | 'grabpay' | 'shopeepay' | 'credit'
  expense_category?: string
  notes?: string
  transaction_date: string
  created_at: string
  deleted_at?: string | null
}
