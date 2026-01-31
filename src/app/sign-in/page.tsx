'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enableGuestMode } from '@/lib/guest-storage'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const EMAIL_REDIRECT_TO = 'https://tallybook.app/auth/callback'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email?.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: EMAIL_REDIRECT_TO,
        },
      })

      if (err) {
        setError('Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      router.push(`/check-email?email=${encodeURIComponent(email.trim())}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="tally-card p-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            Back
          </Link>

          <h1 className="text-xl font-semibold text-foreground mb-1">
            Continue with email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            We will send you a secure link to sign in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-foreground mb-2">
                Email
              </span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="tally-input"
                autoComplete="email"
                disabled={isLoading}
              />
            </label>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="tally-button-primary w-full h-12"
            >
              {isLoading ? 'Sending…' : 'Send link'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              type="button"
              onClick={handleGuestMode}
              variant="outline"
              className="w-full border-border"
            >
              Continue without signing in
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
