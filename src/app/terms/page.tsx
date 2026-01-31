'use client'

import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { AppShell } from '@/components/AppShell'

export default function TermsPage() {
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
    <AppShell title={t('terms.pageTitle')} showBack showLogo>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="bg-tally-surface rounded-[var(--tally-radius)] p-8 shadow-[var(--tally-shadow)]">
          <h1 className="text-2xl font-semibold text-tally-text mb-6">{t('terms.heading')}</h1>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s1Title')}</h2>
              <p>{t('terms.s1Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s2Title')}</h2>
              <p>{t('terms.s2Intro')}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t('terms.s2Li1')}</li>
                <li>{t('terms.s2Li2')}</li>
                <li>{t('terms.s2Li3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s3Title')}</h2>
              <p>{t('terms.s3Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s4Title')}</h2>
              <p>{t('terms.s4Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s5Title')}</h2>
              <p>{t('terms.s5Body')}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">{t('terms.s6Title')}</h2>
              <p>{t('terms.s6Body')}</p>
            </section>

            <section className="text-sm text-gray-500 pt-4 border-t">
              <p>{t('terms.updated', { date: dateStr })}</p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
