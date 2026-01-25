'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

const SLIDES = [
  {
    key: 'slide1',
    icon: '⚡',
    titleKey: 'welcome.slide1.title',
    descriptionKey: 'welcome.slide1.description',
  },
  {
    key: 'slide2',
    icon: '📊',
    titleKey: 'welcome.slide2.title',
    descriptionKey: 'welcome.slide2.description',
  },
  {
    key: 'slide3',
    icon: '⭐',
    titleKey: 'welcome.slide3.title',
    descriptionKey: 'welcome.slide3.description',
  },
  {
    key: 'slide4',
    icon: '🤝',
    titleKey: 'welcome.slide4.title',
    descriptionKey: 'welcome.slide4.description',
  },
  {
    key: 'slide5',
    icon: '🚀',
    titleKey: 'welcome.slide5.title',
    descriptionKey: 'welcome.slide5.description',
  },
]

export default function WelcomePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome before
    const seen = localStorage.getItem('tally-welcome-seen')
    if (seen === 'true') {
      router.push('/')
    } else {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setHasSeenWelcome(false)
      })
    }
  }, [router])

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
    router.push('/')
  }

  if (hasSeenWelcome) {
    return null
  }

  const slide = SLIDES[currentSlide]
  const isLastSlide = currentSlide === SLIDES.length - 1

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Button */}
      <div className="p-6 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t('welcome.skip')}
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-6xl mb-8">{slide.icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          {t(slide.titleKey)}
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-md mb-12">
          {t(slide.descriptionKey)}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-12">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-cta-primary' : 'bg-divider'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 w-full max-w-md">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={`flex-1 bg-cta-primary hover:bg-cta-hover text-cta-text ${currentSlide === 0 ? 'w-full' : ''}`}
          >
            {isLastSlide ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('welcome.getStarted')}
              </>
            ) : (
              <>
                {t('welcome.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
