'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import bm from './locales/bm.json'
import krio from './locales/krio.json'

const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('tally-language') || 'en'
  : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bm: { translation: bm },
      krio: { translation: krio },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation key: ${key} for language: ${lng}`)
      }
    },
  })

export default i18n
