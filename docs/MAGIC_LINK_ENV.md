# Magic Link Authentication – Environment Variables

Set these in your production environment (e.g. Vercel) and in `.env.local` for local development. Do not commit secrets.

Next.js reads `.env.local` automatically when you run `npm run dev`; our code uses `process.env.ZEPTOMAIL_API_KEY`, `process.env.ZEPTOMAIL_FROM_EMAIL`, etc.

## Required

| Variable | What to put | Where to get it |
|----------|-------------|------------------|
| `ZEPTOMAIL_API_KEY` | Send Mail token | ZeptoMail → your Agent (e.g. InfoTally) → **SMTP/API** tab → **API** section → **Send Mail token 1** (the same token shown in the cURL example in the `Authorization: Zoho-enczapikey <token>` header). Do **not** use the SMTP username/password. |
| `ZEPTOMAIL_FROM_EMAIL` | Verified sender address | A sender address verified for your Agent’s domain (e.g. `noreply@tallybook.app` for domain `tallybook.app`). Must be added and verified in ZeptoMail for the Agent. |
| `APP_BASE_URL` | App base URL | e.g. `https://tallybook.app` (no trailing slash). For local: `http://localhost:3000`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase project → **Project Settings** → **API** → `service_role` (secret). Server-only; never expose to client. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase project → **Project Settings** → **API** → Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Supabase project → **Project Settings** → **API** → `anon` public key. |

## Optional

| Variable | Description |
|----------|-------------|
| `ZEPTOMAIL_FROM_NAME` | Display name for the “From” field (default: `TALLY`). |

## Summary

- **ZeptoMail:** Use the **Send Mail token** from the API tab (`ZEPTOMAIL_API_KEY`). Use a **verified sender address** on your Agent (`ZEPTOMAIL_FROM_EMAIL`). Do not use SMTP username/password in the app.
- **Supabase:** Already used elsewhere; ensure service role and public URL/anon key are set.
- **Base URL:** Must match the app origin so the magic link in the email points to the correct site.
