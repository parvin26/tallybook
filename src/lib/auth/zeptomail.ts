/**
 * ZeptoMail REST API: send transactional email (send-email endpoint).
 * Uses ZEPTOMAIL_API_KEY (Send Mail token from ZeptoMail API tab). No SMTP credentials.
 * From address must be ZEPTOMAIL_FROM_EMAIL (verified sender on your Agent).
 */

const ZEPTOMAIL_API = 'https://api.zeptomail.com/v1.1/email'

export interface SendMagicLinkEmailParams {
  to: string
  magicLink: string
  /** Override from address (default: process.env.ZEPTOMAIL_FROM_EMAIL) */
  fromAddress?: string
  /** Override from name (default: process.env.ZEPTOMAIL_FROM_NAME or "TALLY") */
  fromName?: string
}

function getFromAddress(): string {
  const addr = process.env.ZEPTOMAIL_FROM_EMAIL || process.env.ZEPTOMAIL_FROM_ADDRESS
  if (!addr?.trim()) {
    throw new Error('ZEPTOMAIL_FROM_EMAIL is not set')
  }
  return addr.trim()
}

function getFromName(): string {
  return (process.env.ZEPTOMAIL_FROM_NAME || 'TALLY').trim()
}

/** Build Authorization header: accept raw token or full "Zoho-enczapikey <token>" string. */
function getAuthHeader(): string {
  const raw = process.env.ZEPTOMAIL_API_KEY?.trim()
  if (!raw) throw new Error('ZEPTOMAIL_API_KEY is not set')
  if (raw.toLowerCase().startsWith('zoho-enczapikey ')) return raw
  return `Zoho-enczapikey ${raw}`
}

export async function sendMagicLinkEmail(params: SendMagicLinkEmailParams): Promise<void> {
  const authHeader = getAuthHeader()

  const fromAddress = params.fromAddress ?? getFromAddress()
  const fromName = params.fromName ?? getFromName()
  const toEmail = params.to.trim()

  const subject = 'Sign in to Tally'
  const htmlbody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.5;">
  <p>Click the link below to sign in to Tally:</p>
  <p><a href="${params.magicLink}" style="color: #1DB36B;">Sign in to Tally</a></p>
  <p>If you didn't request this, you can ignore this email.</p>
  <p style="color: #666; font-size: 12px;">This link expires in 10 minutes.</p>
</body>
</html>`.trim()

  const body = {
    from: {
      address: fromAddress,
      name: fromName,
    },
    to: [
      {
        email_address: {
          address: toEmail,
          name: toEmail,
        },
      },
    ],
    subject,
    htmlbody,
  }

  const res = await fetch(ZEPTOMAIL_API, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('[ZeptoMail] API error', {
      status: res.status,
      body: text,
      to: toEmail,
    })
    throw new Error(`ZeptoMail API error: ${res.status} ${text}`)
  }
}
