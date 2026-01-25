import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { format } from 'date-fns'

interface TodayProfit {
  profit: number
  revenue: number
  expenses: number
}

export function useTodayProfit() {
  const { currentBusiness } = useBusiness()
  const today = format(new Date(), 'yyyy-MM-dd')
  
  return useQuery<TodayProfit>({
    queryKey: ['todayProfit', currentBusiness?.id, today],
    queryFn: async () => {
      if (!currentBusiness?.id) {
        return { profit: 0, revenue: 0, expenses: 0 }
      }
      
      console.log(`[useTodayProfit] Fetching today's transactions for business: ${currentBusiness.id}, date: ${today}`)
      
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount')
        .eq('business_id', currentBusiness.id)
        .eq('transaction_date', today)
      
      if (error) {
        console.error('[useTodayProfit] Error fetching transactions:', {
          code: error.code,
          message: error.message,
          details: error.details,
        })
        throw error
      }
      
      const revenue = data?.filter(t => t.transaction_type === 'sale' || t.transaction_type === 'payment_received')
        .reduce((sum, t) => sum + t.amount, 0) || 0
      const expenses = data?.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'payment_made')
        .reduce((sum, t) => sum + t.amount, 0) || 0
      
      const profit = revenue - expenses
      console.log(`[useTodayProfit] Today's summary: revenue=${revenue}, expenses=${expenses}, profit=${profit}`)
      
      return { profit, revenue, expenses }
    },
    enabled: !!currentBusiness?.id
  })
}
