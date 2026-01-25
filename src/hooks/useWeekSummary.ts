import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { format, subDays } from 'date-fns'

export function useWeekSummary() {
  const { currentBusiness } = useBusiness()
  
  return useQuery({
    queryKey: ['weekSummary', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness?.id) {
        return { revenue: 0, expenses: 0, profit: 0 }
      }
      
      const weekAgo = subDays(new Date(), 7)
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', format(weekAgo, 'yyyy-MM-dd'))
      
      if (error) throw error
      
      const revenue = data?.filter(t => t.transaction_type === 'sale' || t.transaction_type === 'payment_received')
        .reduce((sum, t) => sum + t.amount, 0) || 0
      const expenses = data?.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'payment_made')
        .reduce((sum, t) => sum + t.amount, 0) || 0
      
      return { revenue, expenses, profit: revenue - expenses }
    },
    enabled: !!currentBusiness?.id
  })
}
