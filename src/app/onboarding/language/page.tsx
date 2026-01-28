'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
// Use official keys: tally-country, tally-language

const ALL_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bm', name: 'Bahasa Malaysia' },
  { code: 'krio', name: 'Krio' },
]

export default function LanguageSelectionPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [availableLanguages, setAvailableLanguages] = useState(ALL_LANGUAGES)

  useEffect(() => {
    // Get selected country from official key
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      
      // If no country, redirect back to country selection
      if (!country || (country !== 'malaysia' && country !== 'sierra-leone')) {
        router.push('/onboarding/country')
        return
      }

      // Filter languages based on country
      let filtered: typeof ALL_LANGUAGES = []
      if (country === 'malaysia') {
        filtered = ALL_LANGUAGES.filter(l => l.code === 'en' || l.code === 'bm')
      } else if (country === 'sierra-leone') {
        filtered = ALL_LANGUAGES.filter(l => l.code === 'en' || l.code === 'krio')
      }
      setAvailableLanguages(filtered)

      // Get current language from official key or default to first available
      const stored = localStorage.getItem('tally-language')
      if (stored && filtered.some(l => l.code === stored)) {
        setSelectedLanguage(stored)
      } else {
        // Default to first available language
        setSelectedLanguage(filtered[0]?.code || 'en')
      }
    }
  }, [router])

  const handleContinue = async () => {
    if (selectedLanguage) {
      // 1. Write tally-language first
      localStorage.setItem('tally-language', selectedLanguage)
      
      // 2. Change i18n language and await if async
      await i18n.changeLanguage(selectedLanguage)
      
      // 3. Route to /app - IntroOverlay will auto-open if intro not seen
      router.push('/app')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <span>‹</span>
          <span>{t('common.back')}</span>
        </button>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">TALLY</h1>
          <p className="text-sm text-muted-foreground">{t('onboarding.tagline')}</p>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground text-center">
            {t('onboarding.language.question')}
          </h2>
          
          {/* Language Options - Selection Cards Pattern */}
          <div className="space-y-3">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedLanguage === language.code
                    ? 'bg-accent border-primary text-foreground'
                    : 'bg-card border-border text-foreground hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{language.name}</span>
                  {selectedLanguage === language.code && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          className="tally-button-primary w-full h-12"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
