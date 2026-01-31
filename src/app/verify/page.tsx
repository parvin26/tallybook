import type { Viewport } from 'next'
import { Suspense } from 'react'
import { VerifyContent } from './VerifyContent'

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

function VerifyFallback() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg p-8 border border-divider shadow-sm animate-pulse">
          <div className="h-6 w-24 bg-muted rounded mb-6" />
          <div className="h-8 w-3/4 bg-muted rounded mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded mb-8" />
          <div className="h-14 w-full bg-muted rounded mb-6" />
          <div className="h-12 w-full bg-muted rounded" />
        </div>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  )
}
