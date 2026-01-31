'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/AppShell'
import { HelpCircle, MessageCircle, Mail } from 'lucide-react'
import { getWhatsAppSupportUrl } from '@/lib/constants'

const SUPPORT_EMAIL = 'info@tallybook.app'

export default function HelpPage() {
  const { t } = useTranslation()

  const handleWhatsApp = () => {
    window.open(getWhatsAppSupportUrl('Hello, I need help with TALLY'), '_blank')
  }

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=TALLY Support Request`
  }

  return (
    <AppShell title={t('help.title')} showBack showLogo>
      <div className="max-w-md mx-auto px-6 py-6 pb-32">

        {/* FAQ Section */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 shrink-0" />
              {t('help.faq')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="border-b border-border pb-4 last:border-0 last:pb-0">
              <h3 className="font-semibold text-foreground mb-1.5">{t('help.howToRecordSale')}</h3>
              <p className="text-sm text-muted-foreground">
                Go to the home page, tap &quot;Record Sale&quot;, enter the amount, select payment type, and save.
              </p>
            </div>
            <div className="border-b border-border pb-4 last:border-0 last:pb-0">
              <h3 className="font-semibold text-foreground mb-1.5">{t('help.howToRecordExpense')}</h3>
              <p className="text-sm text-muted-foreground">
                Go to the home page, tap &quot;Record Expense&quot;, enter the amount, select category and payment type, and save.
              </p>
            </div>
            <div className="border-b border-border pb-4 last:border-0 last:pb-0">
              <h3 className="font-semibold text-foreground mb-1.5">{t('help.howToViewReports')}</h3>
              <p className="text-sm text-muted-foreground">
                Navigate to the &quot;Reports&quot; tab in the bottom navigation to view P&L and Balance Sheet.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1.5">{t('help.howToExportPDF')}</h3>
              <p className="text-sm text-muted-foreground">
                In the Reports page, tap the &quot;Export to PDF&quot; button to download your financial reports.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="w-5 h-5 shrink-0" />
              {t('help.contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
              {t('help.whatsapp')}
            </Button>
            <Button
              onClick={handleEmail}
              variant="outline"
              className="w-full border-border"
            >
              <Mail className="w-4 h-4 mr-2 shrink-0" />
              info@tallybook.app
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
