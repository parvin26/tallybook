/**
 * ZeptoMail REST API: send transactional email using a template.
 * Uses ZEPTOMAIL_API_KEY (Send Mail token). Do not hardcode secrets.
 */

const ZEPTOMAIL_API = 'https://api.zeptomail.com/v1.1/email/template'

export interface SendMagicLinkEmailParams {
  to: string
  magicLink: string
  /** From address must be a verified sender in ZeptoMail */
  fromAddress?: string
  fromName?: string
}

const DEFAULT_FROM = {
  address: process.env.ZEPTOMAIL_FROM_ADDRESS || 'noreply@tallybook.app',
  name: process.env.ZEPTOMAIL_FROM_NAME || 'TALLY',
}

export async function sendMagicLinkEmail(params: SendMagicLinkEmailParams): Promise<void> {
  const apiKey = process.env.ZEPTOMAIL_API_KEY
  if (!apiKey) {
    throw new Error('ZEPTOMAIL_API_KEY is not set')
  }

  const templateKey = process.env.ZEPTOMAIL_MAGIC_LINK_TEMPLATE_KEY || '2d6f.6ab191e397e3f5dc.k1.0bf52340-fe32-11f0-9bc2-525400114fe6.19c1133d374'

  const body = {
    template_key: templateKey,
    from: {
      address: params.fromAddress ?? DEFAULT_FROM.address,
      name: params.fromName ?? DEFAULT_FROM.name,
    },
    to: [
      {
        email_address: {
          address: params.to,
          name: params.to,
        },
      },
    ],
    merge_info: {
      magic_link: params.magicLink,
    },
  }

  const res = await fetch(ZEPTOMAIL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-enczapikey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ZeptoMail API error: ${res.status} ${text}`)
  }
}
