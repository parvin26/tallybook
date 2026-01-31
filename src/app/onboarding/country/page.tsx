'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { COUNTRIES } from '@/lib/countries'
import { normalizeCountryCode } from '@/lib/currency'

function getInitialCountry(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem(STORAGE_KEYS.COUNTRY)
  const code = stored ? normalizeCountryCode(stored) : null
  return (code && COUNTRIES.some((c) => c.code === code)) ? code : ''
}

export default function CountrySelectionPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<string>(getInitialCountry)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.COUNTRY)
      const code = stored ? normalizeCountryCode(stored) : null
      if (code && COUNTRIES.some((c) => c.code === code)) {
        setSelectedCountry(code)
      }
    }
  }, [])

  const handleSelectCountry = (value: string) => {
    setSelectedCountry(value)
    localStorage.setItem(STORAGE_KEYS.COUNTRY, value)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tally-country-change'))
    }
  }

  const handleContinue = () => {
    if (selectedCountry && COUNTRIES.some((c) => c.code === selectedCountry)) {
      router.push('/onboarding/language')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Image src="/icon-192.png" width={80} height={80} alt="Tally Logo" className="rounded-xl shadow-md" />
          </div>
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
                displayValue={selectedCountry ? COUNTRIES.find(c => c.code === selectedCountry)?.name : undefined}
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-card border border-border">
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2">
                  {t('onboarding.country.availableNow')}
                </SelectLabel>
                {COUNTRIES.map((c) => (
                  <SelectItem 
                    key={c.code} 
                    value={c.code} 
                    className={`text-base py-3 cursor-pointer whitespace-nowrap ${selectedCountry === c.code ? 'bg-accent' : ''}`}
                  >
                    <span className="whitespace-nowrap">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedCountry}
          className="tally-button-primary w-full h-12"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
