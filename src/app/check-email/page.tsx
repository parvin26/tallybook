'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

const EMAIL_REDIRECT_TO = 'https://tallybook.app/auth/callback'
const RESEND_COOLDOWN_SECONDS = 30

export default function CheckEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = useMemo(
    () => searchParams?.get('email') ?? '',
    [searchParams]
  )

  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const handleResend = async () => {
    if (!email?.includes('@') || isResending || resendCooldown > 0) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: EMAIL_REDIRECT_TO,
        },
      })

      if (!error) {
        setResendSuccess(true)
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      }
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    router.replace('/sign-in')
    return null
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="tally-card p-8">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a sign in link to <strong className="text-foreground">{email}</strong>.
          </p>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {resendCooldown > 0
                ? `Resend link (${resendCooldown}s)`
                : isResending
                  ? 'Sending…'
                  : 'Resend link'}
            </Button>
            {resendSuccess && (
              <p className="text-sm text-green-600">Link sent again.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            The link may take a minute to arrive.
          </p>
        </div>

        <Link
          href="/sign-in"
          className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </Link>
      </div>
    </main>
  )
}
