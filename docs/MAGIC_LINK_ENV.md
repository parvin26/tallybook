# Magic Link Authentication – Environment Variables

Set these in your production environment (e.g. Vercel, `.env.local` for local). Do not commit secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_BASE_URL` | Yes | Base URL of the app, e.g. `https://tallybook.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only; never expose to client) |
| `ZEPTOMAIL_API_KEY` | Yes | ZeptoMail Send Mail API token |
| `ZEPTOMAIL_MAGIC_LINK_TEMPLATE_KEY` | No | Template key (defaults to TALLY magic link template) |
| `ZEPTOMAIL_FROM_ADDRESS` | No | From email (must be verified in ZeptoMail) |
| `ZEPTOMAIL_FROM_NAME` | No | From display name |

Existing Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must also be set.
