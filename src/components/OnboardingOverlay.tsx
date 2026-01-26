'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { canInstall } from '@/lib/pwa'

const STORAGE_KEY = 'tally_onboarding_completed'
const SESSION_KEY = 'tally_intro_seen_session'

const slides = [
  { title: 'Track money in & out', body: 'Record sales and expenses in seconds with clear payment types.' },
  { title: 'See the whole picture', body: 'Get quick snapshots plus P&L and balance sheet exports for lenders.' },
  { title: 'Keep receipts handy', body: 'Attach photos of invoices or receipts to every transaction.' },
  { title: 'Your data stays yours', body: 'We do not sell data. Tally is not a loan app and will never broker loans.' },
]

interface OnboardingOverlayProps {
  forceOpen?: boolean
}

export function OnboardingOverlay({ forceOpen = false }: OnboardingOverlayProps = {}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [showPWAChip, setShowPWAChip] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If forced open (from Show Intro), open immediately
    if (forceOpen) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OnboardingOverlay] Force opened from Show Intro')
      }
      setOpen(true)
      return
    }

    // Check localStorage for completion
    const onboardingCompleted = localStorage.getItem(STORAGE_KEY) === 'true'
    
    // Check sessionStorage for session seen
    const introSeenSession = sessionStorage.getItem(SESSION_KEY) === 'true'

    // Development console logs
    if (process.env.NODE_ENV === 'development') {
      console.log('[OnboardingOverlay] Mount check:', {
        onboardingCompleted,
        introSeenSession,
        willShow: !onboardingCompleted && !introSeenSession
      })
    }

    // Show logic: only if not completed AND not seen in this session
    if (!onboardingCompleted && !introSeenSession) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OnboardingOverlay] Opening overlay')
      }
      setOpen(true)
      // Immediately set session flag to prevent re-showing in same session
      sessionStorage.setItem(SESSION_KEY, 'true')
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OnboardingOverlay] Not showing:', {
          reason: onboardingCompleted ? 'completed' : 'seen_in_session'
        })
      }
    }
  }, [forceOpen])

  // Check if PWA can be installed (for chip display)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowPWAChip(canInstall())
    }
  }, [])

  // Get Started button - sets completion flag
  const handleGetStarted = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OnboardingOverlay] Get Started clicked - setting completion flag')
    }
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  // Skip or X button - just closes, does NOT set completion flag
  const handleSkip = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OnboardingOverlay] Skip/X clicked - closing without setting completion')
    }
    setOpen(false)
  }

  // Backdrop click - just closes, does NOT set completion flag
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OnboardingOverlay] Backdrop clicked - closing without setting completion')
      }
      setOpen(false)
    }
  }

  if (!open) return null

  const slide = slides[index]
  const isLastSlide = index === slides.length - 1

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/40"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="relative w-full max-w-md bg-[var(--tally-surface,#FFFFFF)] rounded-xl border border-[var(--tally-border,#E5E5E5)] shadow-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-surface-secondary"
          aria-label="Close onboarding"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary">Welcome to Tally</p>
          <h2 className="text-lg font-semibold text-text-primary">{slide.title}</h2>
          <p className="text-sm text-text-secondary">{slide.body}</p>
          
          {/* PWA Install Chip - only on slide 1 */}
          {index === 0 && showPWAChip && (
            <div className="mt-3 p-3 bg-[var(--tally-mint,#E8F5E9)] border border-[var(--tally-border,#E5E5E5)] rounded-lg">
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 text-[#29978C] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--tally-text,#1F2933)]">
                    {t('pwa.installableChip.title')}
                  </p>
                  <p className="text-xs text-[var(--tally-text-muted,#6B7280)] mt-0.5">
                    {t('pwa.installableChip.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-[#29978C]' : 'bg-divider'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
                className="px-3 py-2 text-sm rounded-lg border border-divider text-text-primary hover:bg-surface-secondary"
              >
                Back
              </button>
            )}
            {index < slides.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 text-sm rounded-lg border border-divider text-text-primary hover:bg-surface-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => setIndex((prev) => Math.min(prev + 1, slides.length - 1))}
                  className="px-3 py-2 text-sm rounded-lg bg-[#29978C] text-white hover:bg-[#238579]"
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="px-3 py-2 text-sm rounded-lg bg-[#29978C] text-white hover:bg-[#238579]"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
