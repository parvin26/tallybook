'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
// Use official keys: tally-country

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
    // Load stored country on mount from official key
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tally-country')
      if (stored && (stored === 'malaysia' || stored === 'sierra-leone')) {
        setSelectedCountry(stored)
      }
    }
  }, [])

  const handleSelectCountry = (value: string) => {
    // Check if it's a coming soon country
    if (COMING_SOON_COUNTRIES.includes(value)) {
      setShowComingSoonMessage(true)
      setSelectedCountry('')
      return
    }
    
    setShowComingSoonMessage(false)
    setSelectedCountry(value)
    // Persist immediately to official key
    localStorage.setItem('tally-country', value)
  }

  const handleContinue = () => {
    if (selectedCountry === 'malaysia' || selectedCountry === 'sierra-leone') {
      // Next always goes to /onboarding/language
      router.push('/onboarding/language')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">TALLY</h1>
          <p className="text-sm text-muted-foreground">{t('onboarding.tagline')}</p>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-center text-foreground">
            {t('onboarding.country.question')}
          </h2>
          
          {/* Country Selector */}
          <Select value={selectedCountry} onValueChange={handleSelectCountry}>
            <SelectTrigger className="tally-input h-14 text-base">
              <SelectValue 
                placeholder={t('onboarding.country.selectPlaceholder')}
                displayValue={selectedCountry ? AVAILABLE_COUNTRIES.find(c => c.id === selectedCountry)?.name : undefined}
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-card border border-border">
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2">
                  {t('onboarding.country.availableNow')}
                </SelectLabel>
                {AVAILABLE_COUNTRIES.map((country) => (
                  <SelectItem 
                    key={country.id} 
                    value={country.id} 
                    className={`text-base py-3 cursor-pointer ${
                      selectedCountry === country.id ? 'bg-accent' : ''
                    }`}
                  >
                    {country.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2 mt-2">
                  {t('onboarding.country.comingSoon')}
                </SelectLabel>
                {COMING_SOON_COUNTRIES.map((country) => (
                  <SelectItem 
                    key={country} 
                    value={country} 
                    disabled 
                    className="text-base py-3 text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    {country}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {showComingSoonMessage && (
            <p className="text-sm text-muted-foreground text-center animate-fade-in">
              {t('onboarding.country.notAvailableYet')}
            </p>
          )}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={selectedCountry !== 'malaysia' && selectedCountry !== 'sierra-leone'}
          className="tally-button-primary w-full h-12"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
