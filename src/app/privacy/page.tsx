'use client'

import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { AppShell } from '@/components/AppShell'

export default function PrivacyPage() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()

  useEffect(() => {
    const lang = searchParams.get('lang')
    if (lang && (lang === 'en' || lang === 'bm' || lang === 'krio')) {
      i18n.changeLanguage(lang)
    }
  }, [searchParams, i18n])

  const dateStr = new Date().toLocaleDateString(
    i18n.language === 'bm' ? 'ms-MY' : i18n.language === 'krio' ? 'en-GB' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <AppShell title={t('privacy.pageTitle')} showBack showLogo>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="bg-tally-surface rounded-[var(--tally-radius)] p-8 shadow-[var(--tally-shadow)]">
          <h1 className="text-2xl font-semibold text-tally-text mb-6">{t('privacy.heading')}</h1>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s1Title')}</h2>
              <p>{t('privacy.s1Intro')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('privacy.s1Li1')}</li>
                <li>{t('privacy.s1Li2')}</li>
                <li>{t('privacy.s1Li3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s2Title')}</h2>
              <p>{t('privacy.s2Intro')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('privacy.s2Li1')}</li>
                <li>{t('privacy.s2Li2')}</li>
                <li>{t('privacy.s2Li3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s3Title')}</h2>
              <p>{t('privacy.s3Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s4Title')}</h2>
              <p>{t('privacy.s4Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s5Title')}</h2>
              <p>{t('privacy.s5Intro')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('privacy.s5Li1')}</li>
                <li>{t('privacy.s5Li2')}</li>
                <li>{t('privacy.s5Li3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('privacy.s6Title')}</h2>
              <p>{t('privacy.s6Body')}</p>
            </section>

            <section className="text-sm text-gray-500 pt-4 border-t">
              <p>{t('privacy.updated', { date: dateStr })}</p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
