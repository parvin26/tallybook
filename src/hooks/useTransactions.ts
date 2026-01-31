import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { Transaction } from '@/types'
import { isGuestMode, getGuestTransactions, saveGuestTransaction } from '@/lib/guest-storage'
import { updateTransaction as updateTransactionService, deleteTransaction as deleteTransactionService, type UpdateTransactionPayload } from '@/lib/transaction-service'

/**
 * Add a transaction (guest mode). Generates ID via uuid.v4() in saveGuestTransaction.
 * For authenticated users, use Supabase insert (DB generates ID).
 */
export function addTransaction(
  data: Omit<import('@/lib/guest-storage').GuestTransaction, 'id' | 'created_at'>
): string {
  return saveGuestTransaction(data) // uses uuid.v4() for id internally
}

/**
 * Single source of truth for transactions.
 * Respects STORAGE_KEYS.GUEST_MODE via isGuestMode() — in guest mode returns local data only.
 * Exposes updateTransaction and deleteTransaction (inventory-safe).
 */
export function useTransactions() {
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  const guestMode = typeof window !== 'undefined' ? isGuestMode() : false
  const businessId = guestMode ? 'guest' : currentBusiness?.id ?? null

  const query = useQuery<Transaction[]>({
    queryKey: ['transactions', currentBusiness?.id, guestMode],
    queryFn: async () => {
      // Guest mode: return guest transactions (map to Transaction shape)
      if (guestMode) {
        const guestTransactions = getGuestTransactions()
        const legacyPaymentToMethod = (s: string): Transaction['payment_method'] => {
          if (s === 'cash' || s === 'bank_transfer' || s === 'card' || s === 'e_wallet' || s === 'other') return s
          if (s === 'credit') return 'card'
          if (['duitnow', 'tng', 'boost', 'grabpay', 'shopeepay', 'mobile_money'].includes(s)) return 'e_wallet'
          return 'other'
        }
        const mapped = guestTransactions.map(t => {
          const base = {
            id: t.id,
            business_id: 'guest',
            transaction_type: t.transaction_type,
            amount: t.amount,
            payment_method: (t.payment_method ? legacyPaymentToMethod(t.payment_method) : legacyPaymentToMethod(t.payment_type)),
            payment_reference: t.payment_reference ?? null,
            expense_category: t.expense_category ?? null,
            notes: t.notes ?? null,
            transaction_date: t.transaction_date,
            created_at: t.created_at,
          }
          const transaction_attachments = (t.attachments ?? []).map(a => ({
            id: a.id,
            transaction_id: t.id,
            business_id: 'guest',
            storage_path: a.storage_path ?? '',
            filename: a.filename,
            mime_type: a.mime_type,
            size_bytes: a.size_bytes,
            created_at: a.created_at,
            data_url: a.data_url,
          }))
          return { ...base, transaction_attachments } as Transaction
        })
        return mapped.sort((a, b) => {
          const dateA = new Date(a.transaction_date).getTime()
          const dateB = new Date(b.transaction_date).getTime()
          if (dateA !== dateB) return dateB - dateA
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      if (!currentBusiness?.id) {
        console.log('[useTransactions] No business ID, returning empty array')
        return []
      }
      
      // Auth mode: fetch with attachments for edit modal
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_attachments(*)')
        .eq('business_id', currentBusiness.id)
        .order('transaction_date', { ascending: false })
      
      const activeData = data ?? []

      if (error) {
        console.error('[useTransactions] Error fetching transactions:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      
      // Sort by transaction_date (desc), then by created_at (desc) for same dates
      const sortedData = activeData.sort((a, b) => {
        const dateA = new Date(a.transaction_date).getTime()
        const dateB = new Date(b.transaction_date).getTime()
        if (dateA !== dateB) {
          return dateB - dateA // Descending by date
        }
        // If same date, sort by created_at
        const createdA = new Date(a.created_at).getTime()
        const createdB = new Date(b.created_at).getTime()
        return createdB - createdA // Descending by created_at
      })
      
      return sortedData
    },
    enabled: guestMode || !!currentBusiness?.id,
    refetchOnWindowFocus: !guestMode, // Don't refetch in guest mode
    refetchOnMount: !guestMode,
  })

  const updateMutation = useMutation({
    mutationFn: ({ transactionId, payload }: { transactionId: string; payload: UpdateTransactionPayload }) =>
      updateTransactionService(transactionId, businessId!, payload),
    onSuccess: (_, { transactionId }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) => deleteTransactionService(transactionId, businessId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  return {
    ...query,
    updateTransaction: updateMutation.mutateAsync,
    updateTransactionStatus: updateMutation.status,
    updateTransactionError: updateMutation.error,
    deleteTransaction: deleteMutation.mutateAsync,
    deleteTransactionStatus: deleteMutation.status,
    deleteTransactionError: deleteMutation.error,
  }
}
