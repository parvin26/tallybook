'use client'

import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { FileText, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import { getBusinessProfile } from '@/lib/businessProfile'

export default function ReportsHubPage() {
  const { t } = useTranslation()
  const businessProfile = typeof window !== 'undefined' ? getBusinessProfile() : null
  const enterpriseName = businessProfile?.businessName || t('home.businessFallback')

  return (
    <AppShell title={t('nav.reports')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--tally-text)]">{t('nav.reports')}</h1>
          {enterpriseName && (
            <p className="text-base font-medium text-[var(--tally-text)] mt-1">
              {enterpriseName}
            </p>
          )}
        </div>

        {/* Report Cards */}
        <div className="space-y-4">
          {/* Profit and Loss */}
          <Link href="/summary">
            <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(41,151,140,0.12)] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-[#29978C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[var(--tally-text)]">
                        {t('report.profitLoss.title')}
                      </h3>
                      <p className="text-sm text-[var(--tally-text-muted)] mt-0.5">
                        {t('report.profitLoss.period')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--tally-text-muted)] flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Balance Sheet */}
          <Link href="/balance">
            <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(41,151,140,0.12)] flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-[#29978C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[var(--tally-text)]">
                        {t('report.balanceSheet.title')}
                      </h3>
                      <p className="text-sm text-[var(--tally-text-muted)] mt-0.5">
                        {t('report.balanceSheet.asAt')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--tally-text-muted)] flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Business Health */}
          <Link href="/health">
            <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(41,151,140,0.12)] flex items-center justify-center flex-shrink-0">
                      <Activity className="w-6 h-6 text-[#29978C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[var(--tally-text)]">
                        {t('report.businessHealth.title')}
                      </h3>
                      <p className="text-sm text-[var(--tally-text-muted)] mt-0.5">
                        {t('report.businessHealth.period')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--tally-text-muted)] flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
