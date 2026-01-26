'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

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
    // Get selected country
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

      // Get current language or default to first available
      const stored = localStorage.getItem('tally-language')
      if (stored && filtered.some(l => l.code === stored)) {
        setSelectedLanguage(stored)
      } else {
        // Default to first available language
        setSelectedLanguage(filtered[0]?.code || 'en')
      }
    }
  }, [router])

  const handleContinue = () => {
    if (selectedLanguage) {
      localStorage.setItem('tally-language', selectedLanguage)
      i18n.changeLanguage(selectedLanguage)
      // Onboarding complete - redirect to home
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--tally-surface,#FAF9F7)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--tally-text-muted)] hover:text-[var(--tally-text)]"
        >
          <span>‹</span>
          <span>{t('common.back')}</span>
        </button>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#29978C]">TALLY</h1>
          <p className="text-sm text-[var(--tally-text-muted)]">{t('onboarding.tagline')}</p>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--tally-text)] text-center">
            {t('onboarding.language.question')}
          </h2>
          
          {/* Language Options */}
          <div className="space-y-3">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => setSelectedLanguage(language.code)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedLanguage === language.code
                    ? 'bg-[rgba(41,151,140,0.12)] border-[#29978C] text-[#29978C]'
                    : 'bg-white border-[var(--tally-border)] text-[var(--tally-text)] hover:border-[var(--tally-text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{language.name}</span>
                  {selectedLanguage === language.code && (
                    <div className="w-5 h-5 rounded-full bg-[#29978C] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
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
          className="w-full h-12 bg-[#29978C] hover:bg-[#238579] text-white disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
