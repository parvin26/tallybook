import { supabase } from './supabase/supabaseClient'
import { differenceInDays, subDays } from 'date-fns'

export interface FinancialMetrics {
  // Transaction Consistency (0-300 points)
  daysWithRecords: number
  totalDaysActive: number
  consistencyPercentage: number
  consistencyScore: number
  
  // Business Growth (0-200 points)
  last30DaysRevenue: number
  previous30DaysRevenue: number
  growthRate: number
  growthScore: number
  
  // Financial Health (0-300 points)
  currentProfitMargin: number
  averageDailyProfit: number
  healthScore: number
  
  // Payment Reliability (0-200 points)
  onTimePayments: number
  totalCreditTransactions: number
  reliabilityScore: number
  
  // Total Score
  totalScore: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export async function calculateFinancialMetrics(businessId: string): Promise<FinancialMetrics> {
  // Get all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('transaction_date', { ascending: true })
  
  if (!transactions || transactions.length === 0) {
    return {
      daysWithRecords: 0,
      totalDaysActive: 0,
      consistencyPercentage: 0,
      consistencyScore: 0,
      last30DaysRevenue: 0,
      previous30DaysRevenue: 0,
      growthRate: 0,
      growthScore: 0,
      currentProfitMargin: 0,
      averageDailyProfit: 0,
      healthScore: 0,
      onTimePayments: 0,
      totalCreditTransactions: 0,
      reliabilityScore: 0,
      totalScore: 0,
      tier: 'bronze'
    }
  }
  
  // 1. TRANSACTION CONSISTENCY SCORE (0-300)
  const firstTransaction = new Date(transactions[0].transaction_date)
  const totalDaysActive = differenceInDays(new Date(), firstTransaction) + 1
  const daysWithRecords = new Set(transactions.map(t => t.transaction_date)).size
  const consistencyPercentage = (daysWithRecords / totalDaysActive) * 100
  const consistencyScore = Math.min(300, Math.round((daysWithRecords / totalDaysActive) * 300))
  
  // 2. BUSINESS GROWTH SCORE (0-200)
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)
  const sixtyDaysAgo = subDays(today, 60)
  
  const last30DaysRevenue = transactions
    .filter(t => {
      const txDate = new Date(t.transaction_date)
      return txDate >= thirtyDaysAgo && 
        (t.transaction_type === 'sale' || t.transaction_type === 'payment_received')
    })
    .reduce((sum, t) => sum + t.amount, 0)
  
  const previous30DaysRevenue = transactions
    .filter(t => {
      const txDate = new Date(t.transaction_date)
      return txDate >= sixtyDaysAgo && 
        txDate < thirtyDaysAgo &&
        (t.transaction_type === 'sale' || t.transaction_type === 'payment_received')
    })
    .reduce((sum, t) => sum + t.amount, 0)
  
  const growthRate = previous30DaysRevenue > 0 
    ? ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100 
    : 0
  
  // Growth score: 100 points for positive growth, +100 for >20% growth
  let growthScore = 0
  if (growthRate > 0) {
    growthScore = Math.min(200, 100 + (growthRate * 5))
  }
  
  // 3. FINANCIAL HEALTH SCORE (0-300)
  const totalRevenue = last30DaysRevenue
  const totalExpenses = transactions
    .filter(t => {
      const txDate = new Date(t.transaction_date)
      return txDate >= thirtyDaysAgo && 
        (t.transaction_type === 'expense' || t.transaction_type === 'payment_made')
    })
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netProfit = totalRevenue - totalExpenses
  const currentProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const averageDailyProfit = netProfit / 30
  
  // Health score: based on profit margin
  const healthScore = Math.min(300, Math.max(0, Math.round(currentProfitMargin * 6)))
  
  // 4. PAYMENT RELIABILITY SCORE (0-200)
  // For MVP, give base score if consistently recording
  const reliabilityScore = daysWithRecords >= 30 ? 150 : Math.round((daysWithRecords / 30) * 150)
  
  // TOTAL SCORE
  const totalScore = consistencyScore + growthScore + healthScore + reliabilityScore
  
  // TIER
  let tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  if (totalScore >= 700) tier = 'platinum'
  else if (totalScore >= 500) tier = 'gold'
  else if (totalScore >= 300) tier = 'silver'
  else tier = 'bronze'
  
  return {
    daysWithRecords,
    totalDaysActive,
    consistencyPercentage,
    consistencyScore,
    last30DaysRevenue,
    previous30DaysRevenue,
    growthRate,
    growthScore,
    currentProfitMargin,
    averageDailyProfit,
    healthScore,
    onTimePayments: 0,
    totalCreditTransactions: 0,
    reliabilityScore,
    totalScore,
    tier
  }
}
