'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/AppShell'
import { HelpCircle, MessageCircle, Mail, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const { t } = useTranslation()

  const handleWhatsApp = () => {
    const phone = '60123456789' // Replace with actual WhatsApp number
    const message = encodeURIComponent('Hello, I need help with TALLY')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleEmail = () => {
    const email = 'support@tally.com' // Replace with actual email
    window.location.href = `mailto:${email}?subject=TALLY Support Request`
  }

  return (
    <AppShell title={t('help.title')} showBack showLogo>
      <div className="max-w-md mx-auto px-6 py-6">

        {/* FAQ Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              {t('help.faq')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t('help.howToRecordSale')}</h3>
              <p className="text-sm text-gray-600">
                {t('help.howToRecordSale')}: Go to the home page, tap &quot;Record Sale&quot;, enter the amount, select payment type, and save.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('help.howToRecordExpense')}</h3>
              <p className="text-sm text-gray-600">
                {t('help.howToRecordExpense')}: Go to the home page, tap &quot;Record Expense&quot;, enter the amount, select category and payment type, and save.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('help.howToViewReports')}</h3>
              <p className="text-sm text-gray-600">
                {t('help.howToViewReports')}: Navigate to the &quot;Reports&quot; tab in the bottom navigation to view P&L and Balance Sheet.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('help.howToExportPDF')}</h3>
              <p className="text-sm text-gray-600">
                {t('help.howToExportPDF')}: In the Reports page, tap the &quot;Export to PDF&quot; button to download your financial reports.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tutorials Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t('help.tutorials')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/welcome" className="block">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium">{t('help.guide')}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t('help.contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-cta-primary hover:bg-cta-hover text-cta-text"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('help.whatsapp')}
            </Button>
            <Button
              onClick={handleEmail}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('help.email')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
