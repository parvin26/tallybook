import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createMagicLinkRecord } from '@/lib/auth/magic-link-db'
import { sendMagicLinkEmail } from '@/lib/auth/zeptomail'

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://tallybook.app'
const isDev = process.env.NODE_ENV === 'development'

function getEnvCheck(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = []
  if (!process.env.ZEPTOMAIL_API_KEY) missing.push('ZEPTOMAIL_API_KEY')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (missing.length) return { ok: false, missing }
  return { ok: true }
}

function logError(phase: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  console.error(`[send-magic-link] ${phase}:`, message)
  if (stack && isDev) console.error(stack)
}

export async function POST(request: NextRequest) {
  const envCheck = getEnvCheck()
  if (!envCheck.ok) {
    console.error('[send-magic-link] Missing env:', envCheck.missing.join(', '))
    return NextResponse.json(
      {
        error: 'Failed to send magic link',
        ...(isDev && { code: 'MISSING_ENV', missing: envCheck.missing }),
      },
      { status: 500 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
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

    let rawToken: string
    try {
      rawToken = await createMagicLinkRecord(email)
    } catch (err) {
      logError('createMagicLinkRecord', err)
      return NextResponse.json(
        {
          error: 'Failed to send magic link',
          ...(isDev && { code: 'DB_ERROR', detail: err instanceof Error ? err.message : String(err) }),
        },
        { status: 500 }
      )
    }

    const magicLink = `${APP_BASE_URL}/auth/magic?token=${encodeURIComponent(rawToken)}`

    try {
      await sendMagicLinkEmail({
        to: email,
        magicLink,
      })
    } catch (err) {
      logError('sendMagicLinkEmail', err)
      return NextResponse.json(
        {
          error: 'Failed to send magic link',
          ...(isDev && { code: 'EMAIL_ERROR', detail: err instanceof Error ? err.message : String(err) }),
        },
        { status: 500 }
      )
    }

    if (isDev) {
      console.log(`[send-magic-link] OK email=${email} baseUrl=${APP_BASE_URL}`)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('unexpected', err)
    return NextResponse.json(
      {
        error: 'Failed to send magic link',
        ...(isDev && { code: 'UNEXPECTED', detail: err instanceof Error ? err.message : String(err) }),
      },
      { status: 500 }
    )
  }
}
