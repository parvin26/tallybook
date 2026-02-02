# Magic Link / OTP Email – Debug & Root Cause

## 1. Stack and current symptom

- **Auth provider:** Supabase Auth (client: `@supabase/supabase-js` + `@supabase/ssr`).
- **Magic link email:** Not sent by Supabase. Tally uses a **custom flow**:
  1. User requests sign-in → `POST /api/auth/send-magic-link` (email in body).
  2. API creates a one-time token in Supabase table `magic_link_tokens`, builds link `{APP_BASE_URL}/auth/magic?token=...`, and sends the email via **ZeptoMail** (template API).
  3. User clicks link → `/auth/magic` validates token, then uses Supabase Admin `generateLink` to get a real magic link and redirects there → user is signed in.

- **Symptom:** Magic link / OTP emails never arrive. Likely causes: missing or wrong env (ZeptoMail key, Supabase service role, or table), ZeptoMail API/template/from-address misconfiguration, or errors being swallowed (fixed below).

---

## 2. Relevant config files

| File | Purpose |
|------|--------|
| `src/app/api/auth/send-magic-link/route.ts` | API that creates token and calls ZeptoMail |
| `src/lib/auth/zeptomail.ts` | ZeptoMail send-email API client |
| `src/lib/auth/magic-link-db.ts` | Token create/validate using Supabase (service role) |
| `src/lib/auth/magic-link.ts` | Token generation/hashing (no I/O) |
| `src/lib/supabase/server-admin.ts` | Server Supabase client (service role) |
| `src/app/auth/magic/page.tsx` | Validates token, calls `generateLink`, redirects |
| `docs/MAGIC_LINK_ENV.md` | Env vars list |

**Supabase client usage:**
- **Browser:** `src/lib/supabase/browser.ts` → `supabaseClient.ts` (anon key).
- **Server (cookies):** `src/lib/supabase/server.ts` (anon key).
- **Server (admin):** `src/lib/supabase/server-admin.ts` (service role) – used by magic-link-db and `/auth/magic`.

---

## 3. Environment variables

| Variable | Required | Used in | Notes |
|----------|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All Supabase clients | e.g. `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + server (cookies) | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | server-admin, magic-link-db, /auth/magic | Server-only, never expose |
| `ZEPTOMAIL_API_KEY` | Yes | zeptomail.ts | ZeptoMail “Send Mail” token |
| `APP_BASE_URL` | Yes (prod) | send-magic-link route, /auth/magic | e.g. `https://tallybook.app` (no trailing slash) |
| `ZEPTOMAIL_FROM_EMAIL` | Yes | zeptomail.ts | Verified sender address on your Agent (e.g. `noreply@tallybook.app`) |
| `ZEPTOMAIL_FROM_NAME` | No | zeptomail.ts | Display name (default: TALLY) |

**Where they are loaded:** Next.js loads `.env.local` (and deployment env) into `process.env` for API routes and server code. Client-only vars must be `NEXT_PUBLIC_*`.

**Common issues:**
- `ZEPTOMAIL_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` missing → API returns 500; previously no detail, now logged and (in dev) returned as `code: 'MISSING_ENV'` or `DB_ERROR` / `EMAIL_ERROR`.
- `APP_BASE_URL` wrong in production (e.g. still `https://tallybook.app` while testing on Vercel preview URL) → link in email points to wrong domain.

---

## 4. Magic link call – payload and errors

**Trigger:**  
- **ContinueChoice modal (Save your progress?):** `fetch('/api/auth/send-magic-link', { method: 'POST', body: JSON.stringify({ email, name }) })`.  
- **Login page (email):** same, `body: JSON.stringify({ email })`.

**API route (`send-magic-link/route.ts`):**
- Validates `email` (required, must contain `@`).
- Checks rate limit (max 3 per email per 15 min).
- Creates token via `createMagicLinkRecord(email)` (Supabase insert into `magic_link_tokens`).
- Builds `magicLink = ${APP_BASE_URL}/auth/magic?token=${encodeURIComponent(rawToken)}`.
- Calls `sendMagicLinkEmail({ to: email, magicLink })` (ZeptoMail send-email API: `from` from `ZEPTOMAIL_FROM_EMAIL`, `subject`, `htmlbody` with link).
- Returns `{ ok: true }` or 4xx/5xx with `error` (and in dev, `code` / `detail` / `missing`).

**Fixes applied:**
- Env check at start: if `ZEPTOMAIL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `NEXT_PUBLIC_SUPABASE_URL` is missing → 500 and `[send-magic-link] Missing env: ...` in server log; in dev, response includes `code: 'MISSING_ENV'`, `missing: [...]`.
- Errors from `createMagicLinkRecord` and `sendMagicLinkEmail` are logged with `[send-magic-link] createMagicLinkRecord` / `sendMagicLinkEmail` and (in dev) stack; DB errors log Supabase `message`, `code`, `details`. ZeptoMail non-ok response logs `[ZeptoMail] API error` with status, body, and recipient email (never the API key).
- 500 responses in dev include `code` and `detail` so the UI or network tab shows the real failure (e.g. "ZEPTOMAIL_API_KEY is not set" or ZeptoMail error body).
- Success in dev logs `[send-magic-link] OK email=... baseUrl=...`.

---

## 5. Supabase / ZeptoMail dashboard checklist

**Supabase (project)**
- [ ] **Table:** `public.magic_link_tokens` exists (see `supabase/migrations/20260131000000_magic_link_tokens.sql`). If not, run the migration.
- [ ] **Auth → URL Configuration:**  
  - **Site URL:** e.g. `https://tallybook.app` (or your production URL).  
  - **Redirect URLs:** include `https://tallybook.app/app` (and `https://tallybook.app/auth/callback` if you use Supabase OAuth/magic links elsewhere). For local: `http://localhost:3000/app`, `http://localhost:3000/auth/callback`.
- [ ] **Service role key:** Project Settings → API → `service_role` (secret). Set as `SUPABASE_SERVICE_ROLE_KEY` in env.

**ZeptoMail**
- [ ] **SMTP/API:** Agent has “Send Mail” token; set as `ZEPTOMAIL_API_KEY`.
- [ ] **From address:** Set `ZEPTOMAIL_FROM_EMAIL` to a verified sender on your Agent (e.g. `noreply@tallybook.app` for domain `tallybook.app`). The app uses the send-email API with `from`, `to`, `subject`, `htmlbody` (no template key).
- [ ] No rate limits or blocks on the agent; check ZeptoMail logs for bounces or errors.

**Redirect URL summary**
- Magic link in email: `{APP_BASE_URL}/auth/magic?token=...` (your app).
- After token validation, app calls Supabase `admin.generateLink` with `redirectTo: ${APP_BASE_URL}/app`. That Supabase-generated link must be allowed in **Redirect URLs** (e.g. `https://tallybook.app/app`).

---

## 6. Logs and network requests

**Where to see logs**
- **Local:** Terminal where you run `npm run dev`. Look for `[send-magic-link]`, `[ZeptoMail]`, `[magic-link-db]`.
- **Production (e.g. Vercel):** Project → Deployments → select deployment → “Functions” / “Logs”, or “Runtime Logs”. Filter by function path containing `send-magic-link`.

**Frontend (login / ContinueChoice)**
- In DevTools → Network, find the request to `/api/auth/send-magic-link` (method POST, body `{ "email": "..." }`).
- Check: **Status** (200 = success; 400 invalid email; 429 rate limit; 500 = server error – in dev response body may include `code`, `detail`, `missing`).
- If 500, open the response body; in dev it now includes the error detail.

---

## 7. Redirect URLs and link validity

- **Defined in:**  
  - `src/app/api/auth/send-magic-link/route.ts`: `APP_BASE_URL` (env, default `https://tallybook.app`).  
  - `src/app/auth/magic/page.tsx`: same for `redirectTo`.
- **Rules:** Use absolute URLs; no trailing slash on base; same protocol (http vs https) and host as the app the user is using. For local, set `APP_BASE_URL=http://localhost:3000` in `.env.local` so the link in the email points to localhost.

---

## 8. End-to-end test script

**Script:** `scripts/test-magic-link.mjs`

- **Env only:**  
  `node scripts/test-magic-link.mjs`  
  Loads `.env.local` from project root, checks required env (ZeptoMAIL, Supabase service role, Supabase URL), prints what’s set/missing. Exits 1 if any required is missing.

- **Send test email (local):**  
  1. Start dev server: `npm run dev`.  
  2. Run: `node scripts/test-magic-link.mjs --send --email=your@email.com`  
  Script POSTs to `http://localhost:3000/api/auth/send-magic-link` (or `TEST_MAGIC_LINK_BASE_URL` if set). Success/error and response body are printed. Check your inbox (and spam).

---

## 9. Root-cause summary

- **Why emails weren’t arriving (most likely):**
  1. **Missing env in deployment or .env.local:** `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, or `SUPABASE_SERVICE_ROLE_KEY` not set → ZeptoMail not called or DB insert fails → generic 500, no email.
  2. **Errors swallowed:** API route caught all errors and returned a generic “Failed to send magic link” with no logging or detail → hard to see if it was env, DB, or ZeptoMail.
  3. **ZeptoMail/Supabase misconfiguration:** Wrong or unverified from-address, wrong template key, or `magic_link_tokens` table missing / RLS blocking insert (service role should bypass RLS if table exists).

- **Fixes applied (in repo):**
  1. Env check at start of `POST /api/auth/send-magic-link`: return 500 and log missing vars; in dev return `code: 'MISSING_ENV'`, `missing: [...]`.
  2. Structured logging: `createMagicLinkRecord` and `sendMagicLinkEmail` errors logged with phase and detail; ZeptoMail API errors log status and body; DB errors log Supabase message/code/details.
  3. Dev-only error detail in 500 response (`code`, `detail`, `missing`) so UI/network tab shows root cause.
  4. Test script: `scripts/test-magic-link.mjs` for env check and optional E2E send against local API.

- **Recommended (your side):**
  1. Set in `.env.local` (and Vercel/env): `ZEPTOMAIL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASE_URL` (and optional ZeptoMail from/template).
  2. Ensure `magic_link_tokens` exists (run migration if needed).
  3. In ZeptoMail: verify sender, correct template and merge field for magic link.
  4. In Supabase: add production (and local) redirect URLs for `/app` (and `/auth/callback` if used).

---

## 10. How to test (short checklist)

**Local**
1. Add to `.env.local`: `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `APP_BASE_URL=http://localhost:3000`.
2. Run `node scripts/test-magic-link.mjs` → expect “Env check OK”.
3. Run `npm run dev`, then `node scripts/test-magic-link.mjs --send --email=your@email.com` → expect HTTP 200, “Success”, and an email (check spam).
4. In app: open “Save your progress?” or login with email, submit your email → check Network for 200 and inbox.

**Production**
1. In Vercel (or host) set: `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASE_URL` (e.g. `https://tallybook.app`), and existing Supabase public vars.
2. Deploy and open “Send magic link” flow; check deployment logs for `[send-magic-link]` / `[ZeptoMail]` on success or failure.
3. Request a magic link to a real address; confirm email arrives and link opens and signs you in.
