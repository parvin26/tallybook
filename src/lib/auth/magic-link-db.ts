/**
 * Server-only: magic link token storage and validation.
 * Uses supabaseAdmin. Do not import from client code.
 */

import { getSupabaseAdmin } from '@/lib/supabase/server-admin'
import {
  generateSecureToken,
  hashToken,
  getExpiresAt,
  RATE_LIMIT_WINDOW_MINUTES,
  RATE_LIMIT_MAX_PER_EMAIL,
} from './magic-link'

const TABLE = 'magic_link_tokens'

export type MagicLinkValidationResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' }

/**
 * Rate limit: max RATE_LIMIT_MAX_PER_EMAIL tokens per email in the last RATE_LIMIT_WINDOW_MINUTES.
 */
export async function checkRateLimit(email: string): Promise<boolean> {
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES)

  const supabase = getSupabaseAdmin()
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase().trim())
    .gte('created_at', windowStart.toISOString())

  if (error) {
    return false
  }
  return (count ?? 0) < RATE_LIMIT_MAX_PER_EMAIL
}

/**
 * Create a new magic link record. Returns raw token (send via email only); never log it.
 */
export async function createMagicLinkRecord(email: string): Promise<string> {
  const rawToken = generateSecureToken()
  const hashed = hashToken(rawToken)
  const expiresAt = getExpiresAt()

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from(TABLE).insert({
    email: email.toLowerCase().trim(),
    hashed_token: hashed,
    expires_at: expiresAt.toISOString(),
    used_at: null,
  })

  if (error) {
    console.error('[magic-link-db] createMagicLinkRecord insert failed', {
      message: error.message,
      code: error.code,
      details: error.details,
    })
    throw new Error(`Failed to store magic link token: ${error.message}`)
  }

  return rawToken
}

/**
 * Validate token from query param: hash, lookup, check not expired, not used.
 * If valid, mark as used and return email. Never log the raw token.
 */
export async function validateAndConsumeMagicToken(rawToken: string | null): Promise<MagicLinkValidationResult> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 16) {
    return { ok: false, reason: 'invalid' }
  }

  const hashed = hashToken(rawToken)
  const now = new Date().toISOString()

  const supabase = getSupabaseAdmin()
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('id, email, expires_at, used_at')
    .eq('hashed_token', hashed)
    .single()

  if (error || !row) {
    return { ok: false, reason: 'invalid' }
  }

  if (row.used_at) {
    return { ok: false, reason: 'used' }
  }

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' }
  }

  const { error: updateError } = await supabase
    .from(TABLE)
    .update({ used_at: now })
    .eq('id', row.id)

  if (updateError) {
    return { ok: false, reason: 'invalid' }
  }

  return { ok: true, email: row.email }
}
