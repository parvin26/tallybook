'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface TallyLogoProps {
  size?: number
  className?: string
}

export function TallyLogo({ size = 28, className = '' }: TallyLogoProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push('/')}
      className={`flex items-center justify-center ${className}`}
      aria-label="Go to home"
    >
      <Image
        src="/icon-512.png"
        width={size}
        height={size}
        alt="Tally Logo"
        className="rounded-xl"
        priority
      />
    </button>
  )
}
