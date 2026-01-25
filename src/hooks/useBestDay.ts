import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useBusiness } from '@/contexts/BusinessContext'
import { format, subDays } from 'date-fns'

export function useBestDay() {
  const { currentBusiness } = useBusiness()
  
  return useQuery({
    queryKey: ['bestDay', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness?.id) {
        return { date: null, profit: 0 }
      }
      
      const monthAgo = subDays(new Date(), 30)
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_date, transaction_type, amount')
        .eq('business_id', currentBusiness.id)
        .gte('transaction_date', format(monthAgo, 'yyyy-MM-dd'))
      
      if (error) throw error
      
      // Group by date and calculate daily profit
      const dailyProfits = new Map<string, { revenue: number; expenses: number }>()
      data?.forEach(t => {
        const date = t.transaction_date
        if (!dailyProfits.has(date)) {
          dailyProfits.set(date, { revenue: 0, expenses: 0 })
        }
        const day = dailyProfits.get(date)!
        if (t.transaction_type === 'sale' || t.transaction_type === 'payment_received') {
          day.revenue += t.amount
        } else {
          day.expenses += t.amount
        }
      })
      
      // Find best day
      let bestDate: string | null = null
      let bestProfit = 0
      dailyProfits.forEach((value, date) => {
        const profit = value.revenue - value.expenses
        if (profit > bestProfit) {
          bestProfit = profit
          bestDate = date
        }
      })
      
      return { date: bestDate, profit: bestProfit }
    },
    enabled: !!currentBusiness?.id
  })
}
