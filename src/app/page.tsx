'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
  const [hasPriorUsage, setHasPriorUsage] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      const language = localStorage.getItem('tally-language')
      setHasPriorUsage(!!(country && language))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-8">
          <h1 className="text-3xl font-semibold text-foreground leading-tight">
            A simple way to keep track of your business
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed space-y-1">
            <div>For small shops, stalls and services</div>
            <div>Built for everyday work</div>
            <div>Not accountants</div>
          </p>
          
          <div className="space-y-3 pt-4">
            <Link href="/onboarding/country">
              <Button className="w-full tally-button-primary h-12 text-base font-medium">
                Try Tally
              </Button>
            </Link>
            <Link 
              href="#how-it-works" 
              className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Learn how it works
            </Link>
          </div>
        </div>

        {/* Story Section 1 */}
        <section id="how-it-works" className="space-y-4">
          <div className="space-y-3 text-foreground leading-relaxed">
            <p className="text-base">Many small businesses do not keep formal records</p>
            <p className="text-base">Some write in notebooks</p>
            <p className="text-base">Some remember in their heads</p>
            <p className="text-base">Some do not track at all</p>
          </div>
          
          <div className="space-y-3 text-foreground leading-relaxed pt-4">
            <p className="text-base">When money moves every day</p>
            <p className="text-base">It becomes hard to know</p>
            <p className="text-base">What came in</p>
            <p className="text-base">What went out</p>
            <p className="text-base">And what is left</p>
          </div>
        </section>

        {/* Story Section 2 */}
        <section className="space-y-4">
          <div className="space-y-3 text-foreground leading-relaxed">
            <p className="text-base">Tally is a quiet daily ledger</p>
            <p className="text-base">It helps you record what happens</p>
            <p className="text-base">As it happens</p>
          </div>
          
          <div className="space-y-3 text-foreground leading-relaxed pt-4">
            <p className="text-base">No setup</p>
            <p className="text-base">No complicated screens</p>
            <p className="text-base">No pressure to be perfect</p>
          </div>
        </section>

        {/* Story Section 3 */}
        <section className="space-y-4">
          <div className="space-y-3 text-foreground leading-relaxed">
            <p className="text-base">Over time</p>
            <p className="text-base">Your business becomes easier to understand</p>
            <p className="text-base">Not because you did more</p>
            <p className="text-base">But because you wrote things down</p>
          </div>
        </section>

        {/* Closing Section */}
        <section className="space-y-6 pt-4">
          <div className="space-y-3 text-foreground leading-relaxed">
            <p className="text-base">You do not need to be good at numbers</p>
            <p className="text-base">You only need to start</p>
          </div>
          
          <Link href="/onboarding/country">
            <Button className="w-full tally-button-primary h-12 text-base font-medium">
              Start using Tally
            </Button>
          </Link>
        </section>

        {/* Continue where you left off - only if prior usage */}
        {hasPriorUsage && (
          <div className="pt-4 border-t border-border">
            <Link 
              href="/app"
              className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Continue where you left off
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
