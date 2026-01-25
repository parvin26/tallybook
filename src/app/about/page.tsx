'use client'

import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

export default function AboutPage() {
  return (
    <AppShell title="About Tally" showBack showLogo>
      <div className="max-w-md mx-auto px-6 py-6 space-y-6 text-sm text-text-primary">
        <div className="bg-surface rounded-xl border border-divider p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">What is Tally?</h2>
          <p>
            Tally is a simple ledger for small businesses. Record sales and expenses, see cashflow snapshots,
            and export clean reports without complexity.
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-divider p-4 shadow-sm space-y-2">
          <h3 className="text-base font-semibold">What we do</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Track income and expenses quickly on mobile.</li>
            <li>Generate P&amp;L and balance sheet PDFs for sharing.</li>
            <li>Attach receipts for clearer records.</li>
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-divider p-4 shadow-sm space-y-2">
          <h3 className="text-base font-semibold">Privacy &amp; data</h3>
          <p>
            Your data stays yours. We do not sell or share it. Tally is not a loan app and will never offer or
            broker loans.
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          <Link href="/login" className="text-[#29978C] font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
