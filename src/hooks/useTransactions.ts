import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { Transaction } from '@/types'
import { isGuestMode, getGuestTransactions } from '@/lib/guest-storage'

export function useTransactions() {
  const { currentBusiness } = useBusiness()
  const guestMode = typeof window !== 'undefined' ? isGuestMode() : false
  
  return useQuery<Transaction[]>({
    queryKey: ['transactions', currentBusiness?.id, guestMode],
    queryFn: async () => {
      // Guest mode: return guest transactions
      if (guestMode) {
        const guestTransactions = getGuestTransactions()
        // Convert guest transactions to Transaction format
        return guestTransactions.map(t => ({
          id: t.id,
          business_id: 'guest',
          transaction_type: t.transaction_type,
          amount: t.amount,
          payment_type: t.payment_type,
          payment_method: t.payment_method,
          payment_provider: t.payment_provider,
          payment_reference: t.payment_reference,
          expense_category: t.expense_category,
          notes: t.notes,
          transaction_date: t.transaction_date,
          created_at: t.created_at,
          updated_at: t.created_at,
          deleted_at: null,
        })) as Transaction[]
      }

      if (!currentBusiness?.id) {
        console.log('[useTransactions] No business ID, returning empty array')
        return []
      }
      
      console.log(`[useTransactions] Fetching transactions for business: ${currentBusiness.id}`)
      
      // First, let's test if we can query transactions at all (without filter)
      const { data: allData, error: allError } = await supabase
        .from('transactions')
        .select('id, business_id, transaction_type, amount, transaction_date')
        .limit(10)
      
      console.log('[useTransactions] Test query (all transactions, limit 10):', {
        count: allData?.length || 0,
        data: allData,
        error: allError ? {
          code: allError.code,
          message: allError.message,
          details: allError.details,
          hint: allError.hint,
        } : null,
      })
      
      if (allData && allData.length > 0) {
        console.log('[useTransactions] Business IDs found in transactions:', 
          [...new Set(allData.map(t => t.business_id))]
        )
        console.log('[useTransactions] Current business ID:', currentBusiness.id)
        console.log('[useTransactions] Match?', allData.some(t => t.business_id === currentBusiness.id))
      }
      
      // Now query with business_id filter
      // Note: deleted_at column might not exist yet, so we'll filter in JavaScript
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('transaction_date', { ascending: false })
      
      // Filter out soft-deleted transactions in JavaScript (if deleted_at column exists)
      const activeData = data?.filter(t => !t.deleted_at) || data || []
      
      console.log('[useTransactions] Filtered query result:', {
        business_id_filter: currentBusiness.id,
        count: data?.length || 0,
        error: error ? {
          code: error.code,
          message: error.message,
        } : null,
      })
      
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
      
      console.log(`[useTransactions] Successfully loaded ${sortedData.length} transactions`)
      if (sortedData.length > 0) {
        console.log('[useTransactions] Sample transaction:', {
          id: sortedData[0].id,
          type: sortedData[0].transaction_type,
          amount: sortedData[0].amount,
          date: sortedData[0].transaction_date,
          created_at: sortedData[0].created_at,
        })
      }
      
      return sortedData
    },
    enabled: guestMode || !!currentBusiness?.id,
    refetchOnWindowFocus: !guestMode, // Don't refetch in guest mode
    refetchOnMount: !guestMode,
  })
}
