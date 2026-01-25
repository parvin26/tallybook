'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone } from 'lucide-react'
import Link from 'next/link'
import { TallyLogo } from '@/components/TallyLogo'

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone || phone.length < 10) {
      toast.error(t('auth.invalidPhone'))
      return
    }

    setIsLoading(true)
    
    try {
      const formattedPhone = formatPhoneNumber(phone)
      
      // TEST MODE: Skip OTP sending and go directly to verify page
      // This allows testing without SMS provider setup
      const TEST_MODE = process.env.NODE_ENV === 'development'
      
      if (TEST_MODE) {
        // In development, skip OTP sending and go to verify page
        // User can enter any test OTP code (123456, 000000, etc.)
        sessionStorage.setItem('phone', formattedPhone)
        toast.info(t('auth.testModeMessage', { code: '123456' }))
        router.push(`/verify?phone=${formattedPhone}`)
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: `+${formattedPhone}`,
        options: {
          channel: 'sms',
        },
      })

      if (error) {
        // If OTP sending fails, still allow test mode in development
        if (process.env.NODE_ENV === 'development') {
          toast.info(t('auth.testModeMessage', { code: '123456' }))
          sessionStorage.setItem('phone', formattedPhone)
          router.push(`/verify?phone=${formattedPhone}`)
          setIsLoading(false)
          return
        }
        toast.error(t('auth.sendError'))
        setIsLoading(false)
        return
      }

      // Store phone for verify page
      sessionStorage.setItem('phone', formattedPhone)
      toast.success(t('auth.otpSent'))
      router.push(`/verify?phone=${formattedPhone}`)
    } catch (err) {
      // In development, allow bypass
      if (process.env.NODE_ENV === 'development') {
        toast.info(t('auth.testModeMessage', { code: '123456' }))
        const formattedPhone = formatPhoneNumber(phone)
        sessionStorage.setItem('phone', formattedPhone)
        router.push(`/verify?phone=${formattedPhone}`)
        setIsLoading(false)
        return
      }
      toast.error(t('auth.sendError'))
      setIsLoading(false)
    }
  }

  const handleDevBypass = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Setting dev bypass flag...')
        sessionStorage.setItem('dev-bypass-auth', 'true')
        console.log('Dev bypass enabled, redirecting to home...')
        toast.success(t('auth.devBypassMessage'))
        // Force a full page reload to ensure AuthGuard picks up the change
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
      } catch (err) {
        console.error('Error in dev bypass:', err)
        toast.error(t('auth.devBypassError'))
      }
    } else {
      toast.error(t('auth.devModeOnly'))
    }
  }

  const isDevMode = process.env.NODE_ENV === 'development'

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

          {isDevMode && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 mb-3">
                <strong>{t('auth.devModeTitle')}:</strong> {t('auth.devModeDescription')}
              </p>
              <Button
                onClick={handleDevBypass}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {t('auth.skipLoginButton')}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-text-muted mt-2">
                {t('auth.otpSent')}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !phone}
              className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text font-semibold"
            >
              {isLoading ? t('auth.sending') : t('auth.sendOTP')}
            </Button>
          </form>
        </div>
        <div className="text-center text-sm text-text-secondary mt-4">
          <Link href="/about" className="text-[#29978C] font-semibold hover:underline">
            What is Tally?
          </Link>
        </div>
      </div>
    </main>
  )
}
