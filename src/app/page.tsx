'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ui } from '@/styles/ui'

export default function MarketingPage() {
  const [hasPriorUsage, setHasPriorUsage] = useState(false)
  const [showSignIn, setShowSignIn] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      const language = localStorage.getItem('tally-language')
      setHasPriorUsage(!!(country && language))
      
      // Show sign in button if not in guest mode
      // Guest mode users don't need sign in option
      const isGuest = localStorage.getItem('tally-guest-mode') === 'true'
      setShowSignIn(!isGuest)
    }
  }, [])

  return (
    <div className={ui.page}>
      {/* Hero Section */}
      <section className={`${ui.section} ${ui.container}`}>
        <div className={ui.heroWrap}>
          <div className={ui.heroGrid}>
            {/* Left Column - Content */}
            <div className="animate-fade-in">
              <h1 className={ui.heroTitle}>
                A simple way to keep track of your business
              </h1>
              <div className={ui.heroBody}>
                <p>For small shops, stalls and services</p>
                <p>Built for everyday work</p>
                <p>Not accountants</p>
              </div>
              
              <div className={ui.ctaRow}>
                <Link href="/onboarding/country">
                  <button className={`${ui.buttonPrimary} px-6 py-4 text-lg font-medium`}>
                    Try Tally
                  </button>
                </Link>
                {showSignIn && (
                  <Link href="/app/login">
                    <button className={ui.buttonSecondary}>
                      Sign in
                    </button>
                  </Link>
                )}
              </div>

              {/* Continue where you left off - only if prior usage */}
              {hasPriorUsage && (
                <div className="mt-4">
                  <Link 
                    href="/app"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Continue where you left off
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column - Mock Visual */}
            <div className="animate-fade-in">
              <div className={ui.mockFrame}>
                <div className="p-6">
                  <div className={ui.card + ' p-4'}>
                    <div className="space-y-0">
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">Cash in</span>
                        <span className="text-sm font-medium text-primary">RM 1,250</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">Cash out</span>
                        <span className="text-sm font-medium text-secondary">RM 450</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">Balance today</span>
                        <span className="text-sm font-medium text-foreground">RM 800</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section 1 */}
      <section id="how-it-works" className={`${ui.sectionAlt} ${ui.container} animate-fade-in`}>
        <div className="space-y-4 text-foreground leading-relaxed max-w-3xl">
          <p className="text-base">Many small businesses do not keep formal records</p>
          <p className="text-base">Some write in notebooks</p>
          <p className="text-base">Some remember in their heads</p>
          <p className="text-base">Some do not track at all</p>
          
          <div className="pt-4 space-y-4">
            <p className="text-base">When money moves every day</p>
            <p className="text-base">It becomes hard to know</p>
            <p className="text-base">What came in</p>
            <p className="text-base">What went out</p>
            <p className="text-base">And what is left</p>
          </div>
        </div>
      </section>

      {/* Story Section 2 */}
      <section className={`${ui.section} ${ui.container}`}>
        <div className="space-y-4 text-foreground leading-relaxed max-w-3xl">
          <p className="text-base">Tally is a quiet daily ledger</p>
          <p className="text-base">It helps you record what happens</p>
          <p className="text-base">As it happens</p>
          
          <div className="pt-4 space-y-4">
            <p className="text-base">No setup</p>
            <p className="text-base">No complicated screens</p>
            <p className="text-base">No pressure to be perfect</p>
          </div>
        </div>
      </section>

      {/* Story Section 3 */}
      <section className={`${ui.sectionAlt} ${ui.container}`}>
        <div className="space-y-4 text-foreground leading-relaxed max-w-3xl">
          <p className="text-base">Over time</p>
          <p className="text-base">Your business becomes easier to understand</p>
          <p className="text-base">Not because you did more</p>
          <p className="text-base">But because you wrote things down</p>
        </div>
      </section>

      {/* Closing Section */}
      <section className={`${ui.section} ${ui.container}`}>
        <div className="max-w-3xl space-y-6">
          <div className="space-y-4 text-foreground leading-relaxed">
            <p className="text-base">You do not need to be good at numbers</p>
            <p className="text-base">You only need to start</p>
          </div>
          
          <Link href="/onboarding/country">
            <button className={`${ui.buttonPrimary} px-6 py-4 text-lg font-medium`}>
              Start using Tally
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}
