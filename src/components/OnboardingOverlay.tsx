'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'tally_onboarding_complete'

const slides = [
  { title: 'Track money in & out', body: 'Record sales and expenses in seconds with clear payment types.' },
  { title: 'See the whole picture', body: 'Get quick snapshots plus P&L and balance sheet exports for lenders.' },
  { title: 'Keep receipts handy', body: 'Attach photos of invoices or receipts to every transaction.' },
  { title: 'Your data stays yours', body: 'We do not sell data. Tally is not a loan app and will never broker loans.' },
]

export function OnboardingOverlay() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setOpen(true)
    }
  }, [])

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  if (!open) return null

  const slide = slides[index]

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={complete} />
      <div className="relative w-full max-w-md bg-surface rounded-xl border border-divider shadow-xl p-5 space-y-4">
        <button
          onClick={complete}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-surface-secondary"
          aria-label="Close onboarding"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary">Welcome to Tally</p>
          <h2 className="text-lg font-semibold text-text-primary">{slide.title}</h2>
          <p className="text-sm text-text-secondary">{slide.body}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-[#29978C]' : 'bg-divider'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
                className="px-3 py-2 text-sm rounded-lg border border-divider text-text-primary hover:bg-surface-secondary"
              >
                Back
              </button>
            )}
            {index < slides.length - 1 ? (
              <button
                onClick={() => setIndex((prev) => Math.min(prev + 1, slides.length - 1))}
                className="px-3 py-2 text-sm rounded-lg bg-[#29978C] text-white hover:bg-[#238579]"
              >
                Next
              </button>
            ) : (
              <button
                onClick={complete}
                className="px-3 py-2 text-sm rounded-lg bg-[#29978C] text-white hover:bg-[#238579]"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
