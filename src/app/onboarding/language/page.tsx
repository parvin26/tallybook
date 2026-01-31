'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { COUNTRIES, type Country } from '@/lib/countries'
import { normalizeCountryCode } from '@/lib/currency'

const ALL_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bm', name: 'Bahasa Malaysia' },
  { code: 'krio', name: 'Krio' },
]

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  bm: 'Bahasa Malaysia',
  krio: 'Krio',
  zh: 'Chinese',
  ms: 'Bahasa Melayu',
  ta: 'Tamil',
  id: 'Indonesian',
  vi: 'Vietnamese',
  tl: 'Tagalog',
  tetum: 'Tetum',
  sw: 'Swahili',
  fr: 'French',
  rw: 'Kinyarwanda',
  hi: 'Hindi',
}

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code
}

export default function LanguageSelectionPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [availableLanguages, setAvailableLanguages] = useState(ALL_LANGUAGES)
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.COUNTRY)
      const code = stored ? normalizeCountryCode(stored) : null
      const country = code ? COUNTRIES.find(c => c.code === code) ?? null : null

      if (!country) {
        router.push('/onboarding/country')
        return
      }

      setCurrentCountry(country)
      const filtered = ALL_LANGUAGES.filter(l => country.languages.includes(l.code))
      setAvailableLanguages(filtered.length ? filtered : ALL_LANGUAGES)

      const langList = filtered.length ? filtered : ALL_LANGUAGES
      const current = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
      if (current && langList.some(l => l.code === current)) {
        setSelectedLanguage(current)
      } else {
        setSelectedLanguage(langList[0]?.code || 'en')
      }
    }
  }, [router])

  const handleContinue = async () => {
    if (selectedLanguage) {
      // 1. Write tally-language first
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, selectedLanguage)
      
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
          <div className="flex justify-center mb-6">
            <Image src="/icon-192.png" width={80} height={80} alt="Tally Logo" className="rounded-xl shadow-md" />
          </div>
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

          {(currentCountry?.comingSoon?.length ?? 0) > 0 && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2 font-medium">{t('onboarding.language.comingSoon') || 'Coming Soon'}</p>
              <div className="space-y-2 opacity-50">
                {currentCountry?.comingSoon?.map((langCode) => (
                  <div key={langCode} className="p-4 border rounded-xl bg-muted/50 border-border text-muted-foreground">
                    {getLanguageName(langCode)}
                  </div>
                ))}
              </div>
            </div>
          )}
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
