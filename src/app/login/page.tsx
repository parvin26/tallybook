'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { enableGuestMode } from '@/lib/guest-storage'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useAuth } from '@/contexts/AuthContext'

type AuthMethod = 'phone' | 'email'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { authMode } = useAuth()
  const searchParams = useSearchParams()
  const methodParam = searchParams?.get('method') ?? ''
  const hasValidMethod = methodParam === 'phone' || methodParam === 'email'
  const authMethod: AuthMethod = methodParam === 'email' ? 'email' : 'phone'
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Use newer ContinueChoice modal on /app; /login only for method-specific forms (from modal)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasValidMethod) {
      router.replace('/app')
    }
  }, [router, hasValidMethod])

  // Guard: if guest mode, redirect to app home
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGuest = localStorage.getItem(STORAGE_KEYS.GUEST_MODE) === 'true'
      if (isGuest) {
        router.replace('/app')
      }
    }
  }, [router])

  useEffect(() => {
    if (authMode === 'guest') {
      router.replace('/app')
    }
  }, [authMode, router])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with 0, replace with 60
    if (digits.startsWith('0')) {
      return '60' + digits.slice(1)
    }
    
    // If doesn't start with country code, add 60
    if (digits.length > 0 && !digits.startsWith('60')) {
      return '60' + digits
    }
    
    return digits
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone || phone.length < 10) {
      toast.error(t('auth.invalidPhone'))
      return
    }

    setIsLoading(true)
    
    try {
      const formattedPhone = formatPhoneNumber(phone)

      const { error } = await supabase.auth.signInWithOtp({
        phone: `+${formattedPhone}`,
        options: {
          channel: 'sms',
        },
      })

      if (error) {
        toast.error(t('auth.sendError'))
        setIsLoading(false)
        return
      }

      sessionStorage.setItem('phone', formattedPhone)
      toast.success(t('auth.otpSent'))
      router.push(`/verify?phone=${formattedPhone}`)
    } catch (err) {
      toast.error(t('auth.sendError'))
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error(t('auth.invalidEmail'))
      return
    }

    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const detail = typeof data?.detail === 'string' ? data.detail : null
        const missing = Array.isArray(data?.missing) ? data.missing.join(', ') : null
        const devHint = detail || (missing ? `Missing: ${missing}` : null)
        if (res.status === 429) {
          toast.error(t('auth.sendError') || 'Too many requests. Try again later.')
        } else {
          toast.error(devHint ? `${t('auth.sendError')} (${devHint})` : t('auth.sendError'))
        }
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      toast.success(t('auth.signInLinkSent') || t('auth.emailLinkSent'))
    } catch (err) {
      toast.error(t('auth.sendError'))
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true')
    }
    enableGuestMode()
    router.replace('/app')
  }

  if (authMode === 'guest') return null
  if (!hasValidMethod) return null

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="tally-card p-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>
          <div className="flex justify-center mb-6">
            <Image src="/icon-192.png" width={80} height={80} alt="Tally Logo" className="rounded-xl shadow-md" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {authMethod === 'phone' ? t('auth.phoneOTP') : t('auth.emailSignInLink')}
          </p>

          {/* Phone OTP Form */}
          {authMethod === 'phone' && !emailSent && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('auth.phone')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  className="tally-input pl-10"
                  inputMode="tel"
                  autoFocus
                />
              </div>
            </div>

              <Button
                type="submit"
                disabled={isLoading || !phone}
                className="tally-button-primary w-full h-12"
              >
                {isLoading ? t('auth.sending') : t('auth.sendOTP')}
              </Button>
            </form>
          )}

          {/* Email Link Form */}
          {authMethod === 'email' && !emailSent && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('auth.email') || 'Email'}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
                    className="tally-input pl-10"
                    inputMode="email"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="tally-button-primary w-full h-12"
              >
                {isLoading ? t('auth.sending') : (t('auth.sendSignInLink') || 'Send sign in link')}
              </Button>
            </form>
          )}

          {/* Email Sent Confirmation */}
          {emailSent && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('auth.checkEmail') || 'Check your email'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('auth.emailLinkSentDesc') || 'We sent a sign in link to your email. Click it to sign in.'}
                </p>
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full"
              >
                {t('auth.useDifferentEmail') || 'Use a different email'}
              </Button>
            </div>
          )}

          {/* Guest Mode Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={handleGuestMode}
              variant="outline"
              className="w-full border-border"
            >
              {t('auth.continueWithoutLogin')}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t('auth.guestModeDescription')}
            </p>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/about" className="text-primary font-semibold hover:underline">
            {t('onboarding.about.title') || 'How it works'}
          </Link>
        </div>
      </div>
    </main>
  )
}
