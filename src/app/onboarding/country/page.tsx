'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'

const AVAILABLE_COUNTRIES = [
  { id: 'malaysia', name: 'Malaysia' },
  { id: 'sierra-leone', name: 'Sierra Leone' },
]

const COMING_SOON_COUNTRIES = [
  'Indonesia',
  'Thailand',
  'Vietnam',
  'Philippines',
  'Cambodia',
  'Laos',
  'Myanmar',
  'Timor-Leste',
  'India',
  'Pakistan',
  'Bangladesh',
  'Sri Lanka',
  'Nepal',
  'Nigeria',
  'Ghana',
  'Kenya',
  'Tanzania',
  'Uganda',
  'Rwanda',
  'Ethiopia',
  'South Africa',
  'Zambia',
  'Zimbabwe',
  'Cameroon',
  'Senegal',
  "Cote d'Ivoire",
  'Brazil',
  'Mexico',
  'Colombia',
]

export default function CountrySelectionPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [showComingSoonMessage, setShowComingSoonMessage] = useState(false)

  useEffect(() => {
    // Load stored country on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tally-onboarding-country')
      if (stored && (stored === 'malaysia' || stored === 'sierra-leone')) {
        setSelectedCountry(stored)
      }
    }
  }, [])

  const handleSelectCountry = (value: string) => {
    console.log('[Country] handleSelectCountry called with:', value)
    
    // Check if it's a coming soon country
    if (COMING_SOON_COUNTRIES.includes(value)) {
      setShowComingSoonMessage(true)
      setSelectedCountry('')
      return
    }
    
    setShowComingSoonMessage(false)
    setSelectedCountry(value)
    // Persist immediately
    localStorage.setItem('tally-onboarding-country', value)
    console.log('[Country] selectedCountry set to:', value)
  }

  const handleContinue = () => {
    console.log('[Country] handleContinue called, selectedCountry:', selectedCountry)
    if (selectedCountry === 'malaysia' || selectedCountry === 'sierra-leone') {
      console.log('[Country] Navigating to /onboarding/language')
      router.push('/onboarding/language')
    } else {
      console.log('[Country] Cannot continue - invalid country:', selectedCountry)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--tally-surface,#FAF9F7)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#29978C]">TALLY</h1>
          <p className="text-sm text-[var(--tally-text-muted)]">{t('onboarding.tagline')}</p>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-center text-[var(--tally-text)]">
            {t('onboarding.country.question')}
          </h2>
          
          {/* Country Selector */}
          <Select value={selectedCountry} onValueChange={handleSelectCountry}>
            <SelectTrigger className="w-full h-14 text-base rounded-xl border-2 border-[var(--tally-border)] bg-[var(--tally-surface)]">
              <SelectValue 
                placeholder={t('onboarding.country.selectPlaceholder')}
                displayValue={selectedCountry ? AVAILABLE_COUNTRIES.find(c => c.id === selectedCountry)?.name : undefined}
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-[var(--tally-surface)] border border-[var(--tally-border)]">
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-[var(--tally-text-muted)] uppercase tracking-wide px-2 py-2">
                  {t('onboarding.country.availableNow')}
                </SelectLabel>
                {AVAILABLE_COUNTRIES.map((country) => (
                  <SelectItem key={country.id} value={country.id} className="text-base py-3 cursor-pointer">
                    {country.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-[var(--tally-text-muted)] uppercase tracking-wide px-2 py-2 mt-2">
                  {t('onboarding.country.comingSoon')}
                </SelectLabel>
                {COMING_SOON_COUNTRIES.map((country) => (
                  <SelectItem 
                    key={country} 
                    value={country} 
                    disabled 
                    className="text-base py-3 opacity-50 cursor-not-allowed"
                  >
                    {country}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {showComingSoonMessage && (
            <p className="text-sm text-[var(--tally-text-muted)] text-center animate-fade-in">
              {t('onboarding.country.notAvailableYet')}
            </p>
          )}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={selectedCountry !== 'malaysia' && selectedCountry !== 'sierra-leone'}
          className="w-full h-12 bg-[#29978C] hover:bg-[#238579] text-white disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
        >
          {t('common.next')}
        </Button>
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400">
            Debug: selectedCountry = "{selectedCountry}"
          </div>
        )}
      </div>
    </div>
  )
}
