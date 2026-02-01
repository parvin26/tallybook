#!/usr/bin/env node
/**
 * Magic link env check and optional E2E test.
 * Loads .env.local if present, then validates env and optionally POSTs to send-magic-link API.
 *
 * Usage:
 *   node scripts/test-magic-link.mjs                    # validate env only
 *   node scripts/test-magic-link.mjs --send --email=you@example.com   # send test (dev server must be running)
 *
 * For env to be loaded when running this script, either:
 *   - Copy .env.local to .env and use a loader, or
 *   - Run from the project root so we can read .env.local and apply to process.env (below).
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnvLocal() {
  const path = join(rootDir, '.env.local')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnvLocal()

const REQUIRED = [
  'ZEPTOMAIL_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
]
const OPTIONAL = ['APP_BASE_URL', 'ZEPTOMAIL_FROM_ADDRESS', 'ZEPTOMAIL_FROM_NAME', 'ZEPTOMAIL_MAGIC_LINK_TEMPLATE_KEY']

function checkEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k].trim() === '')
  const present = REQUIRED.filter((k) => process.env[k]?.trim())
  return { missing, present }
}

async function main() {
  const args = process.argv.slice(2)
  const doSend = args.includes('--send')
  const emailArg = args.find((a) => a.startsWith('--email='))
  const testEmail = emailArg ? emailArg.replace(/^--email=/, '').trim() : null

  console.log('Magic link env check (Tally)\n')

  const { missing, present } = checkEnv()
  console.log('Required env:')
  for (const k of REQUIRED) {
    const set = present.includes(k)
    const value = process.env[k]
    const display = set ? (value.length > 12 ? value.slice(0, 8) + '...' : '***') : '(not set)'
    console.log(`  ${k}: ${set ? display : '(missing)'}`)
  }
  console.log('\nOptional env:')
  for (const k of OPTIONAL) {
    const set = !!process.env[k]?.trim()
    console.log(`  ${k}: ${set ? 'set' : '(not set)'}`)
  }

  if (missing.length > 0) {
    console.error('\nMissing required:', missing.join(', '))
    console.error('Add them to .env.local (see docs/MAGIC_LINK_ENV.md).')
    process.exit(1)
  }

  console.log('\nEnv check OK.')

  if (doSend && testEmail) {
    if (!testEmail.includes('@')) {
      console.error('Provide a valid email: --email=you@example.com')
      process.exit(1)
    }
    const baseUrl = process.env.TEST_MAGIC_LINK_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl.replace(/\/$/, '')}/api/auth/send-magic-link`
    console.log(`\nSending test magic link to ${testEmail} via ${url} ...`)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        console.log('Success:', data)
      } else {
        console.error('Response:', res.status, data)
        process.exit(1)
      }
    } catch (err) {
      console.error('Request failed:', err.message)
      console.error('Is the dev server running? Try: npm run dev')
      process.exit(1)
    }
  } else if (doSend && !testEmail) {
    console.error('Use --email=you@example.com to send a test magic link.')
    process.exit(1)
  }
}

main()
