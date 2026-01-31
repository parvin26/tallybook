'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-xl font-semibold text-foreground">
          This link has expired
        </h1>
        <p className="text-sm text-muted-foreground">
          Request a new sign in link to continue.
        </p>
        <Link href="/sign-in">
          <Button className="tally-button-primary w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    </main>
  )
}
