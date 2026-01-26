'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { TallyLogo } from '@/components/TallyLogo'
import { enableGuestMode } from '@/lib/guest-storage'

type AuthMethod = 'phone' | 'email'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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

  // For test mode: also store the original format for Supabase test numbers
  const getPhoneForSupabase = (value: string) => {
    const digits = value.replace(/\D/g, '')
    // Supabase test numbers might need format without country code
    // Try both formats
    if (digits.startsWith('0')) {
      return digits // Keep 0 for test numbers
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
      toast.success(t('auth.magicLinkSent'))
      setIsLoading(false)
    } catch (err) {
      toast.error(t('auth.sendError'))
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    enableGuestMode()
    // No toast - just navigate
    router.replace('/')
  }


  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg p-8 border border-divider shadow-sm">
          <div className="flex justify-center mb-4">
            <TallyLogo size={72} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">TALLY</h1>
          <p className="text-sm text-text-secondary mb-8">
            {t('welcome.subtitle')}
          </p>

          {/* Auth Method Tabs */}
          <div className="mb-6 flex gap-2 bg-surface-2 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone')
                setEmailSent(false)
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'phone'
                  ? 'bg-cta-primary text-cta-text font-semibold border-2 border-cta-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('auth.phoneOTP')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email')
                setEmailSent(false)
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                authMethod === 'email'
                  ? 'bg-cta-primary text-cta-text font-semibold border-2 border-cta-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('auth.emailSignInLink')}
            </button>
          </div>


          {/* Phone OTP Form */}
          {authMethod === 'phone' && !emailSent && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('auth.phone')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Phone className="w-5 h-5 text-icon-default" />
                  </div>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    className="pl-10"
                    inputMode="tel"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !phone}
                className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text font-semibold"
              >
                {isLoading ? t('auth.sending') : t('auth.sendOTP')}
              </Button>
            </form>
          )}

          {/* Email Magic Link Form */}
          {authMethod === 'email' && !emailSent && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-icon-default" />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="pl-10"
                    inputMode="email"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text font-semibold"
              >
                {isLoading ? t('auth.sending') : t('auth.sendSignInLink')}
              </Button>
            </form>
          )}

          {/* Email Sent Confirmation */}
          {authMethod === 'email' && emailSent && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-4">
                  {t('auth.signInLinkSentMessage')}
                </p>
                <Button
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {t('auth.backToLogin')}
                </Button>
              </div>
            </div>
          )}

          {/* Guest Mode Button */}
          <div className="mt-6 pt-6 border-t border-divider">
            <Button
              onClick={handleGuestMode}
              variant="outline"
              className="w-full"
            >
              {t('auth.continueWithoutLogin')}
            </Button>
            <p className="text-xs text-text-muted text-center mt-2">
              {t('auth.guestModeDescription')}
            </p>
          </div>
        </div>
        <div className="text-center text-sm text-text-secondary mt-4">
          <Link href="/about" className="text-[#29978C] font-semibold hover:underline">
            {t('onboarding.about.title')}
          </Link>
        </div>
      </div>
    </main>
  )
}
