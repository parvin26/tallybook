import crypto from 'crypto'

const TOKEN_BYTES = 32
const TOKEN_TTL_MINUTES = 10
const RATE_LIMIT_WINDOW_MINUTES = 15
const RATE_LIMIT_MAX_PER_EMAIL = 3

export function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

export function getExpiresAt(): Date {
  const d = new Date()
  d.setMinutes(d.getMinutes() + TOKEN_TTL_MINUTES)
  return d
}

export { TOKEN_TTL_MINUTES, RATE_LIMIT_WINDOW_MINUTES, RATE_LIMIT_MAX_PER_EMAIL }
