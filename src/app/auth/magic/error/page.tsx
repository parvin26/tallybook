'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function MagicLinkErrorPage() {
  const searchParams = useSearchParams()
  const reason = searchParams?.get('reason') ?? 'invalid'

  const isExpired = reason === 'expired'
  const isUsed = reason === 'used'

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-xl font-semibold text-foreground">
          {isExpired && 'Link expired'}
          {isUsed && 'Link already used'}
          {!isExpired && !isUsed && 'Invalid link'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isExpired &&
            'This sign-in link has expired. Request a new one to sign in.'}
          {isUsed &&
            'This sign-in link was already used. Request a new one to sign in again.'}
          {!isExpired && !isUsed &&
            'This sign-in link is invalid or has been revoked. Request a new one.'}
        </p>
        <div className="flex flex-col gap-3">
          {isExpired && (
            <Link href="/login?method=email">
              <Button className="w-full tally-button-primary">
                Resend login link
              </Button>
            </Link>
          )}
          <Link href="/app">
            <Button variant="outline" className="w-full">
              Back to app
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
