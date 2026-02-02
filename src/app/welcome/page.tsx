'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const SLIDES = [
  {
    key: 'slide1',
    titleKey: 'welcome.slide1.title',
    descriptionKey: 'welcome.slide1.description',
  },
  {
    key: 'slide2',
    titleKey: 'welcome.slide2.title',
    descriptionKey: 'welcome.slide2.description',
  },
  {
    key: 'slide3',
    titleKey: 'welcome.slide3.title',
    descriptionKey: 'welcome.slide3.description',
  },
  {
    key: 'slide4',
    titleKey: 'welcome.slide4.title',
    descriptionKey: 'welcome.slide4.description',
  },
  {
    key: 'slide5',
    titleKey: 'welcome.slide5.title',
    descriptionKey: 'welcome.slide5.description',
  },
]

export default function WelcomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome before
    const seen = localStorage.getItem('tally-welcome-seen')
    if (seen === 'true') {
      router.push('/')
    } else {
      setIsOpen(true)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      // Restore body scroll when component unmounts
      document.body.style.overflow = 'unset'
    }
  }, [router])

  const handleClose = () => {
    handleGetStarted()
  }

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleGetStarted()
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleSkip = () => {
    handleGetStarted()
  }

  const handleGetStarted = () => {
    localStorage.setItem('tally-welcome-seen', 'true')
    document.body.style.overflow = 'unset'
    router.push('/')
  }

  // Prevent backdrop clicks from closing (user must use Skip or Close)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // Allow backdrop click to close only if explicitly enabled
      // For now, we'll prevent it to match the modal overlay style
      e.stopPropagation()
    }
  }

  if (!isOpen) {
    return null
  }

  const slide = SLIDES[currentSlide]
  const isLastSlide = currentSlide === SLIDES.length - 1

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/50"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="relative w-full max-w-md bg-[var(--tally-surface)] rounded-xl border border-[var(--tally-border)] shadow-xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--tally-surface-2)] transition-colors text-[var(--tally-text-muted)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide Content */}
        <div className="space-y-4 pt-2">
          <h1 className="text-2xl font-bold text-[var(--tally-text)] text-center">
            {t(slide.titleKey)}
          </h1>
          <p className="text-base text-[var(--tally-text-muted)] text-center">
            {t(slide.descriptionKey)}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 justify-center">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-[#29978C]' 
                  : 'bg-[var(--tally-border)]'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          {/* Primary Button */}
          <Button
            onClick={handleNext}
            className="w-full bg-[#29978C] hover:bg-tally-sale-hover text-white h-12 text-base font-medium"
          >
            {isLastSlide ? t('welcome.getStarted') : t('welcome.next')}
          </Button>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between">
            {currentSlide > 0 && (
              <button
                onClick={handlePrevious}
                className="text-sm text-[var(--tally-text-muted)] hover:text-[var(--tally-text)] transition-colors"
              >
                {t('common.back')}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleSkip}
              className="text-sm text-[var(--tally-text-muted)] hover:text-[var(--tally-text)] transition-colors"
            >
              {t('welcome.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
