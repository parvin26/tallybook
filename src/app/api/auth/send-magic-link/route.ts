import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createMagicLinkRecord } from '@/lib/auth/magic-link-db'
import { sendMagicLinkEmail } from '@/lib/auth/zeptomail'

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://tallybook.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const allowed = await checkRateLimit(email)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const rawToken = await createMagicLinkRecord(email)
    const magicLink = `${APP_BASE_URL}/auth/magic?token=${encodeURIComponent(rawToken)}`

    await sendMagicLinkEmail({
      to: email,
      magicLink,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
