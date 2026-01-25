'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { createTestSession } from '@/lib/test-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function VerifyPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || sessionStorage.getItem('phone') || ''
  
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error(t('auth.invalidOTP'))
      return
    }

    setIsLoading(true)
    
    try {
      // TEST MODE: In development, allow test OTP codes to bypass verification
      const TEST_OTP_CODES = ['123456', '000000', '111111', '999999', '123123']
      const isTestMode = process.env.NODE_ENV === 'development' && TEST_OTP_CODES.includes(otp)

      if (isTestMode) {
        // Try OTP verification first (in case test phone numbers are configured in Supabase)
        // Format phone number correctly (remove leading 0 if present, add country code)
        const formattedPhone = phone.startsWith('0') ? `60${phone.slice(1)}` : phone
        const phoneWithPlus = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`
        
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          phone: phoneWithPlus,
          token: otp,
          type: 'sms',
        })

        if (otpData?.user && otpData.session) {
          // OTP worked (test phone number configured in Supabase)
          toast.success('Berjaya masuk (Mod Ujian)')
          const { data: business } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', otpData.user.id)
            .eq('is_active', true)
            .single()

          if (business) {
            router.push('/')
          } else {
            router.push('/setup')
          }
          setIsLoading(false)
          return
        }

        // If OTP verification failed, log the error for debugging
        if (otpError) {
          console.log('OTP verification error:', otpError)
          // Continue to fallback method
        }

        // OTP verification failed, use email auth as fallback for testing
        const { user, error: testError } = await createTestSession(phone)

        if (user) {
          // Check if we have an active session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            toast.success('Berjaya masuk (Mod Ujian)')
            // Check if user has business
            const { data: business } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .single()

            if (business) {
              router.push('/')
            } else {
              router.push('/setup')
            }
            setIsLoading(false)
            return
          } else {
            // User created but no session (email confirmation required)
            // Try to sign in again
            const testEmail = `test_${phone.replace(/\D/g, '')}@example.com`
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: 'test123456',
            })
            
            if (retryData?.user && retryData.session) {
              toast.success('Berjaya masuk (Mod Ujian)')
              const { data: business } = await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', retryData.user.id)
                .eq('is_active', true)
                .single()

              if (business) {
                router.push('/')
              } else {
                router.push('/setup')
              }
              setIsLoading(false)
              return
            }
          }
        }
        
        // If we get here, test mode failed
        // Provide helpful instructions
        toast.error(
          'Mod ujian gagal. Pastikan nombor telefon ujian ditambah di Supabase dengan format: 60183937031=123456 (tanpa + dan 0 di depan). Atau gunakan email auth sebagai alternatif.',
          { duration: 10000 }
        )
        console.error('Test mode error:', testError)
        console.log('Phone number used:', phone)
        console.log('Formatted phone:', phone.startsWith('0') ? `60${phone.slice(1)}` : phone)
        setIsLoading(false)
        return
      }

      // Normal OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+${phone}`,
        token: otp,
        type: 'sms',
      })

      if (error) {
        toast.error(t('auth.invalidOTP'))
        setIsLoading(false)
        return
      }

      if (data.user) {
        toast.success(t('auth.loginSuccess'))
        // Check if user has business
        const { data: business } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single()

        if (business) {
          router.push('/')
        } else {
          router.push('/setup')
        }
      }
    } catch (err) {
      toast.error(t('auth.verifyError'))
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg p-8 border border-divider shadow-sm">
          <button
            onClick={() => router.push('/login')}
            className="mb-6 flex items-center gap-2 text-text-secondary text-sm hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>

          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.verifyOTP')}</h1>
          <p className="text-sm text-text-secondary mb-2">
            {t('auth.otpSent')} +{phone}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
              ⚠️ {t('auth.testModeTitle')}: {t('auth.testModeMessage', { code: '123456' })}
            </p>
          )}
          <p className="text-xs text-text-muted mb-8">
            {t('auth.enterOTP')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(value)
                }}
                placeholder={t('auth.otpPlaceholder')}
                className="text-center text-2xl tracking-widest font-mono"
                inputMode="numeric"
                autoFocus
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text font-semibold"
            >
              {isLoading ? t('auth.verifying') : t('auth.verifyOTP')}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-sm text-text-secondary hover:text-text-primary"
            >
              {t('auth.resendOTP')}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
