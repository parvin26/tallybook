'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail, X } from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const SESSION_STORAGE_KEY = 'tally-continue-choice-dismissed'

type EmailStep = 'choice' | 'email_form' | 'email_success' | 'email_error'

function isValidEmail(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed || !trimmed.includes('@')) return false
  const [local, domain] = trimmed.split('@')
  return local.length > 0 && domain.length > 0 && domain.includes('.')
}

export function ContinueChoice() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, authMode } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [emailStep, setEmailStep] = useState<EmailStep>('choice')
  const [emailFormName, setEmailFormName] = useState('')
  const [emailFormEmail, setEmailFormEmail] = useState('')
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    const isGuest = localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true'
    const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true'

    if (language && !user && !isGuest && !dismissed && authMode !== 'guest') {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [user, authMode])

  // Phone OTP: coming soon — disabled, no real action
  const handlePhoneOTP = () => {
    // Optional: show tooltip "Phone OTP sign-in will be available in a future update."
    // For now do nothing (button is disabled).
  }

  const handleEmailLink = () => {
    setEmailStep('email_form')
    setEmailErrorMessage(null)
  }

  const handleEmailFormCancel = () => {
    setEmailStep('choice')
    setEmailFormName('')
    setEmailFormEmail('')
    setEmailErrorMessage(null)
  }

  const handleEmailFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailFormEmail.trim()
    if (!isValidEmail(email)) {
      setEmailErrorMessage(t('auth.invalidEmail', { defaultValue: 'Please enter a valid email address' }))
      return
    }
    setEmailErrorMessage(null)
    setIsEmailSending(true)
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: emailFormName.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429) {
          setEmailErrorMessage(t('auth.sendError', { defaultValue: 'Too many requests. Try again later.' }))
        } else {
          const detail = typeof data?.detail === 'string' ? data.detail : null
          const missing = Array.isArray(data?.missing) ? data.missing.join(', ') : null
          const devHint = detail || (missing ? `Missing: ${missing}` : null)
          setEmailErrorMessage(
            devHint
              ? `${t('auth.emailLinkSendError', { defaultValue: "We couldn't send the sign-in link." })} (${devHint})`
              : t('auth.emailLinkSendError', {
                  defaultValue: "We couldn't send the sign-in link. Please check your email or try again later.",
                })
          )
        }
        setEmailStep('email_error')
        return
      }
      setEmailStep('email_success')
    } catch {
      setEmailErrorMessage(
        t('auth.emailLinkSendError', {
          defaultValue: "We couldn't send the sign-in link. Please check your email or try again later.",
        })
      )
      setEmailStep('email_error')
    } finally {
      setIsEmailSending(false)
    }
  }

  /** Must never clear data; only enable guest mode and dismiss the modal. */
  const handleContinueWithoutLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true')
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
    }
    setIsOpen(false)
    window.location.reload()
  }

  /** Close modal only; do not navigate (user stays on /app or current page). */
  const handleDismiss = () => {
    setIsOpen(false)
    setEmailStep('choice')
  }

  if (!isOpen) return null

  const showChoice = emailStep === 'choice'
  const showEmailForm = emailStep === 'email_form'
  const showEmailSuccess = emailStep === 'email_success'
  const showEmailError = emailStep === 'email_error'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleDismiss()}
        aria-label="Close"
      />

      <div className="relative bg-background rounded-3xl w-full max-w-[420px] flex flex-col overflow-hidden animate-scale-in shadow-card">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent active:scale-95 transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2 pt-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t('auth.continueChoice.title', { defaultValue: 'Save your progress?' })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('auth.continueChoice.subtitle', { defaultValue: 'Sign in to keep your data safe and sync across devices.' })}
            </p>
          </div>

          {showChoice && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                disabled
                className="w-full h-14 bg-white text-muted-foreground border-gray-300 opacity-70 cursor-not-allowed flex items-center justify-center gap-3"
                title={t('auth.phoneOTPComingSoonTooltip', { defaultValue: 'Phone OTP sign-in will be available in a future update.' })}
              >
                <Phone className="w-4 h-4" />
                <span>{t('auth.phoneOTPComingSoon', { defaultValue: 'Phone OTP (coming soon)' })}</span>
              </Button>

              <Button
                onClick={handleEmailLink}
                className="w-full tally-button-primary h-14 flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" />
                <span>{t('auth.emailSignInLink', { defaultValue: 'Email Link' })}</span>
              </Button>

              <Button
                onClick={handleContinueWithoutLogin}
                variant="outline"
                className="w-full h-14 border-border"
              >
                {t('auth.continueWithoutLogin')}
              </Button>
            </div>
          )}

          {showEmailForm && (
            <form onSubmit={handleEmailFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('auth.nameOptional', { defaultValue: 'Name (optional)' })}
                </label>
                <Input
                  type="text"
                  value={emailFormName}
                  onChange={(e) => setEmailFormName(e.target.value)}
                  placeholder={t('auth.namePlaceholder', { defaultValue: 'Your name' })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('auth.emailAddress', { defaultValue: 'Email address' })}
                </label>
                <Input
                  type="email"
                  value={emailFormEmail}
                  onChange={(e) => setEmailFormEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder', { defaultValue: 'your@email.com' })}
                  className="w-full"
                  required
                />
                {emailErrorMessage && (
                  <p className="text-xs text-red-600 mt-1">{emailErrorMessage}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleEmailFormCancel} className="flex-1 min-w-0">
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isEmailSending}
                  className="flex-1 min-w-0 whitespace-nowrap text-sm font-medium rounded-xl h-11 bg-[#29978C] hover:bg-[#238579] text-white disabled:opacity-70"
                >
                  {isEmailSending
                    ? t('auth.sending', { defaultValue: 'Sending...' })
                    : t('auth.sendSignInLink', { defaultValue: 'Send Sign In Link' })}
                </Button>
              </div>
            </form>
          )}

          {showEmailSuccess && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t('auth.emailLinkSentTitle', { defaultValue: "We've sent a sign-in link to your email." })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('auth.emailLinkSentHelper', {
                  defaultValue: 'Open the link on this device to save and sync your data. You can keep using Tally while you wait.',
                })}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleDismiss} className="w-full tally-button-primary">
                  {t('auth.keepUsingTally', { defaultValue: 'Keep using Tally' })}
                </Button>
                <button
                  type="button"
                  onClick={() => { handleDismiss(); router.replace('/') }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  {t('auth.goToHome', { defaultValue: 'Go to home' })}
                </button>
              </div>
            </div>
          )}

          {showEmailError && (
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                {emailErrorMessage ??
                  t('auth.emailLinkSendError', {
                    defaultValue: "We couldn't send the sign-in link. Please check your email or try again later.",
                  })}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleEmailFormCancel} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => setEmailStep('email_form')} className="flex-1 tally-button-primary">
                  {t('auth.tryAgain', { defaultValue: 'Try again' })}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
