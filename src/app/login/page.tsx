'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { TallyLogo } from '@/components/TallyLogo'
import { enableGuestMode } from '@/lib/guest-storage'
import { useAuth } from '@/contexts/AuthContext'

type AuthMethod = 'phone' | 'email'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { authMode } = useAuth()
  const searchParams = useSearchParams()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Set auth method from URL query param
  useEffect(() => {
    const method = searchParams?.get('method')
    if (method === 'phone' || method === 'email') {
      setAuthMethod(method)
    }
  }, [searchParams])

  // Guard: if tally-guest-mode is true and user visits /login, redirect to /
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGuest = localStorage.getItem('tally-guest-mode') === 'true'
      if (isGuest) {
        router.replace('/')
      }
    }
  }, [router])

  // Redirect immediately if in guest mode
  useEffect(() => {
    if (authMode === 'guest') {
      router.replace('/')
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        toast.error(t('auth.sendError'))
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      toast.success(t('auth.emailLinkSent'))
    } catch (err) {
      toast.error(t('auth.sendError'))
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    // Set guest flag immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('tally-guest-mode', 'true')
    }
    enableGuestMode()
    // Navigate to home
    router.replace('/')
  }

  // Don't render login UI if in guest mode
  if (authMode === 'guest') {
    return null
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="tally-card p-8">
          <div className="flex justify-center mb-4">
            <TallyLogo size={72} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">TALLY</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t('welcome.subtitle')}
          </p>

          {/* Auth Method Tabs */}
          <div className="mb-6 flex gap-2 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMethod === 'phone'
                  ? 'bg-accent text-foreground border border-border shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.phoneOTP')}
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMethod === 'email'
                  ? 'bg-accent text-foreground border border-border shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.emailSignInLink') || 'Email Link'}
            </button>
          </div>

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
            {t('onboarding.about.title')}
          </Link>
        </div>
      </div>
    </main>
  )
}
