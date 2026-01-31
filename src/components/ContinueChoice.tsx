'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Phone, Mail, X } from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const SESSION_STORAGE_KEY = 'tally-continue-choice-dismissed'

export function ContinueChoice() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, authMode } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Show overlay if:
    // language exists AND not authenticated AND guest mode not true
    const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    const isGuest = localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true'
    const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true'
    
    if (language && !user && !isGuest && !dismissed && authMode !== 'guest') {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [user, authMode])

  const handlePhoneOTP = () => {
    setIsOpen(false)
    router.push('/login?method=phone')
  }

  const handleEmailLink = () => {
    setIsOpen(false)
    router.push('/login?method=email')
  }

  const handleContinueWithoutLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true')
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
    }
    setIsOpen(false)
    // Keep user on Home (no redirect needed)
    window.location.reload() // Reload to update auth state
  }

  const handleDismiss = () => {
    setIsOpen(false)
    router.replace('/')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed background — click redirects to landing so dashboard is not revealed */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleDismiss()}
        aria-label="Close and go to home"
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-3xl w-full max-w-[420px] flex flex-col overflow-hidden animate-scale-in shadow-card">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent active:scale-95 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2 pt-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t('auth.continueChoice.title') || 'Continue with Tally'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('auth.continueChoice.subtitle') || 'Choose how you want to sign in'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={handlePhoneOTP}
              className="w-full tally-button-primary h-14 flex items-center justify-center gap-3"
            >
              <Phone className="w-5 h-5" />
              <span>{t('auth.phoneOTP')}</span>
            </Button>

            <Button
              onClick={handleEmailLink}
              className="w-full tally-button-primary h-14 flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5" />
              <span>{t('auth.emailSignInLink') || 'Email Link'}</span>
            </Button>

            <Button
              onClick={handleContinueWithoutLogin}
              variant="outline"
              className="w-full h-14 border-border"
            >
              {t('auth.continueWithoutLogin')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
