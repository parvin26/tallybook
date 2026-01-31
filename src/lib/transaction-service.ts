/**
 * Transaction service: update and delete with inventory safety.
 * Guest: reverse stock in localStorage then remove transaction.
 * Auth: reverse inventory_movements via adjustment, then hard-delete transaction.
 */
import { supabase } from './supabase/supabaseClient'
import { isGuestMode, getGuestTransaction, updateGuestTransaction, deleteGuestTransaction, type GuestAttachment } from './guest-storage'
import { addMovement } from './inventory-service'
import type { Transaction } from '@/types'

/** Payload for update: amount, date, payment_method, notes (and expense_category for expenses). Guest: optional attachments to persist add/remove. */
export interface UpdateTransactionPayload {
  amount: number
  transaction_date: string
  payment_method: Transaction['payment_method']
  notes?: string | null
  expense_category?: string | null
  /** Guest only: full attachment list after add/remove in edit modal. */
  attachments?: GuestAttachment[]
}

/**
 * Update a transaction (amount, date, payment_method, notes).
 * Does not allow changing inventory item or quantity.
 */
export async function updateTransaction(
  transactionId: string,
  businessId: string,
  payload: UpdateTransactionPayload
): Promise<void> {
  if (isGuestMode()) {
    updateGuestTransaction(transactionId, {
      amount: payload.amount,
      transaction_date: payload.transaction_date,
      payment_method: payload.payment_method,
      payment_type: payload.payment_method,
      notes: payload.notes ?? undefined,
      expense_category: payload.expense_category ?? undefined,
      attachments: payload.attachments,
    })
    return
  }

  const updatePayload: Record<string, unknown> = {
    amount: payload.amount,
    transaction_date: payload.transaction_date,
    payment_method: payload.payment_method,
    notes: payload.notes ?? null,
  }
  if (payload.expense_category !== undefined) {
    updatePayload.expense_category = payload.expense_category
  }
  const { error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('id', transactionId)
    .eq('business_id', businessId)

  if (error) throw error
}

/**
 * Delete a transaction. Reverses inventory if the transaction had stock linked.
 * Guest: add back quantity to inventory then remove from guest storage.
 * Auth: insert adjustment movements to reverse quantity, then DELETE FROM transactions.
 */
export async function deleteTransaction(transactionId: string, businessId: string): Promise<void> {
  if (isGuestMode()) {
    const tx = getGuestTransaction(transactionId)
    if (tx && tx.transaction_type === 'sale' && tx.inventory_item_id != null && (tx.quantity_sold ?? 0) > 0) {
      await addMovement({
        businessId: 'guest',
        itemId: tx.inventory_item_id,
        type: 'adjustment',
        quantityChange: tx.quantity_sold!,
        transactionId: null,
      })
    }
    deleteGuestTransaction(transactionId)
    return
  }

  // Auth: find movements linked to this transaction
  const { data: movements, error: selectError } = await supabase
    .from('inventory_movements')
    .select('id, item_id, business_id, quantity_change')
    .eq('transaction_id', transactionId)

  if (selectError) throw selectError

  if (movements && movements.length > 0) {
    for (const m of movements) {
      await addMovement({
        businessId: m.business_id,
        itemId: m.item_id,
        type: 'adjustment',
        quantityChange: -Number(m.quantity_change),
        transactionId: null,
      })
    }
  }

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('business_id', businessId)

  if (deleteError) throw deleteError
}
