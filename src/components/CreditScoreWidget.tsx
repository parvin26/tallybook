'use client'

import { useQuery } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { calculateFinancialMetrics } from '@/lib/credit-scoring'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowRight, TrendingUp, Calendar, DollarSign, Heart } from 'lucide-react'

export function CreditScoreWidget() {
  const { currentBusiness } = useBusiness()
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['creditScore', currentBusiness?.id],
    queryFn: () => calculateFinancialMetrics(currentBusiness!.id),
    enabled: !!currentBusiness?.id
  })
  
  if (isLoading || !metrics) {
    return null
  }
  
  const tierColors = {
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-600'
  }
  
  const tierLabels = {
    bronze: 'Perlu Diperbaiki',
    silver: 'Sederhana',
    gold: 'Baik',
    platinum: 'Sangat Baik'
  }
  
  return (
    <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Skor TALLY Anda</p>
            <p className="text-5xl font-bold tabular-nums">{metrics.totalScore}</p>
            <p className="text-sm opacity-90">/ 1000 mata</p>
          </div>
          <div className="text-right">
            <Badge className={`${tierColors[metrics.tier]} text-white mb-2`}>
              {tierLabels[metrics.tier]}
            </Badge>
            <p className="text-xs opacity-90">
              {1000 - metrics.totalScore > 0 ? `+${1000 - metrics.totalScore} mata lagi` : 'Skor Maksimum!'}
            </p>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/20">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 opacity-80" />
            <div>
              <p className="text-xs opacity-80">Konsistensi</p>
              <p className="font-semibold">{metrics.consistencyScore}/300</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 opacity-80" />
            <div>
              <p className="text-xs opacity-80">Pertumbuhan</p>
              <p className="font-semibold">{metrics.growthScore}/200</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 mt-0.5 opacity-80" />
            <div>
              <p className="text-xs opacity-80">Kesihatan</p>
              <p className="font-semibold">{metrics.healthScore}/300</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 mt-0.5 opacity-80" />
            <div>
              <p className="text-xs opacity-80">Kebolehpercayaan</p>
              <p className="font-semibold">{metrics.reliabilityScore}/200</p>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/20">
          <a 
            href="#"
            className="text-sm hover:underline flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault()
              alert('Integrasi Academy akan datang!')
            }}
          >
            Tingkatkan skor dengan sijil Academy
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
