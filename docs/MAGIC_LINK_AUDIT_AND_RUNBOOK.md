# Magic Link – Re-Audit, Env, Test Sequence, UI → Backend Mapping

## 1. Status: Code and env wiring vs docs

**Consistent with docs:**

- **`src/app/api/auth/send-magic-link/route.ts`**  
  Env check uses: `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`. Dev-only: rate limit skipped when `NODE_ENV === 'development'`; 429 not returned in dev. On 500, in dev returns `code` and `detail` (and `missing` for MISSING_ENV). Logging: `[send-magic-link]` for missing env, createMagicLinkRecord, sendMagicLinkEmail, unexpected.

- **`src/lib/auth/magic-link-db.ts`**  
  Uses `getSupabaseAdmin()` for insert. Logs masked `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY defined` before insert. Insert wrapped in try/catch; on Supabase `error` object logs message/code/details; on throw (e.g. `TypeError: fetch failed`) logs full error via `logFullError` (name, message, stack, cause, causeStack). No drift.

- **`src/lib/auth/zeptomail.ts`**  
  Send-email API: `https://api.zeptomail.com/v1.1/email`, body `from` / `to` / `subject` / `htmlbody`. Uses `ZEPTOMAIL_API_KEY` (raw or full `Zoho-enczapikey ...`), `ZEPTOMAIL_FROM_EMAIL` (fallback `ZEPTOMAIL_FROM_ADDRESS`). On !res.ok logs `[ZeptoMail] API error` with status, body, to (never API key). Throws with message including status and body. Consistent.

- **`src/lib/supabase/server-admin.ts`**  
  Uses `createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })`. Plain `@supabase/supabase-js` createClient, no SSR/cookie helpers. Consistent.

- **`scripts/test-magic-link.mjs`**  
  Loads `.env.local`, checks REQUIRED: `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`. Optional: `APP_BASE_URL`, `ZEPTOMAIL_FROM_NAME`. `--send` POSTs to localhost, prints HTTP status and error body/detail/missing. Consistent.

**Note (not a drift):**  
The route’s env check does **not** require `APP_BASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The route only needs the four vars above to run; `APP_BASE_URL` is used when building the magic link (defaults to `https://tallybook.app` if unset). `NEXT_PUBLIC_SUPABASE_ANON_KEY` is used by the Supabase browser/server clients elsewhere, not by the send-magic-link API itself. Docs correctly list all six as required for the full app; the API route itself enforces only the four.

**Conclusion:** Code and env wiring are **consistent** with the docs in the places above. Nothing obvious has drifted or been lost from the previous setup.

---

## 2. Env expectations (no secrets)

**Magic-link flow expects these env vars:**

| Variable | Where used | Server vs client | Local (.env.local) | Vercel |
|----------|------------|------------------|---------------------|--------|
| `ZEPTOMAIL_API_KEY` | route (env check), zeptomail.ts | Server only | Yes | Yes (Production / Preview as needed) |
| `ZEPTOMAIL_FROM_EMAIL` | route (env check), zeptomail.ts | Server only | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | route (env check), server-admin.ts, magic-link-db.ts | Server only | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | route (env check), server-admin.ts, magic-link-db (logging) | Server (and client via NEXT_PUBLIC_*) | Yes | Yes |
| `APP_BASE_URL` | route (build magic link URL), auth/magic page (redirectTo) | Server only | Yes (e.g. `http://localhost:3000` for local) | Yes (e.g. `https://tallybook.app`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/server clients (not send-magic-link route) | Client + server | Yes | Yes |

**How they are used:**

- **Route:** Before doing anything, checks that `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` are non-empty. If any missing → 500 with `code: 'MISSING_ENV'` and `missing: [...]` in dev.
- **ZeptoMail:** Reads `ZEPTOMAIL_API_KEY` and `ZEPTOMAIL_FROM_EMAIL` (and optional `ZEPTOMAIL_FROM_NAME`). Sends email via REST API.
- **Supabase (magic-link):** `server-admin` builds client from `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Used to insert into `magic_link_tokens` and later in `/auth/magic` for generateLink.
- **APP_BASE_URL:** Used in the link in the email (`{APP_BASE_URL}/auth/magic?token=...`) and in redirect after token use. Wrong value = wrong link domain.

Visually confirm `.env.local` and Vercel have these keys set (values not printed here).

---

## 3. Fresh minimal test sequence (today’s code)

Run from project root. Dev server must be running for step 3.

**Step 1: `npm run dev`**

- **Success:** Next.js starts; you see something like `▲ Next.js 16.x.x`, `- Local: http://localhost:3000`, `- Environments: .env.local`, `✓ Ready in ...` or `✓ Starting...`. Process keeps running.
- **Failure:** Port in use (it may say “using port 3001”); that’s still success for the app, use that port in step 3. If “.env.local” is missing from “Environments”, env may not load for the API.

**Step 2: `node scripts/test-magic-link.mjs`**

- **Success:**  
  - “Required env:” lists all four with a short mask or “***”, “Optional env:” for APP_BASE_URL and ZEPTOMAIL_FROM_NAME.  
  - “Env check OK.”  
  - Exit code 0.
- **Failure:** One or more “(missing)” under Required env, then “Missing required: …” and exit 1. Fix: add those keys to `.env.local` (no need to restart dev for this script; it reads .env.local itself).

**Step 3: `node scripts/test-magic-link.mjs --send --email=parvinjeet.kaur@gmail.com`**

- **Success:**  
  - “Sending test magic link to parvinjeet.kaur@gmail.com via http://localhost:3000/api/auth/send-magic-link …”  
  - “HTTP status: 200”  
  - “Success: { ok: true }”  
  - Exit 0.  
  In the **dev server** terminal: one line `[send-magic-link] OK email=parvinjeet.kaur@gmail.com baseUrl=...`.  
  Inbox (or spam): email “Sign in to Tally” with link to `http://localhost:3000/auth/magic?token=...`.

- **Likely failures and what to look for in the dev server:**

| Script output | Dev server log lines to look for | Meaning |
|---------------|-----------------------------------|--------|
| HTTP 500, `code: 'MISSING_ENV'`, `missing: [...]` | `[send-magic-link] Missing env: ...` | One or more of the four required env vars not set where the API runs. Add to .env.local and restart `npm run dev`. |
| HTTP 500, `code: 'DB_ERROR'`, `detail: '...'` | `[send-magic-link] createMagicLinkRecord: ...` and either `[magic-link-db] createMagicLinkRecord insert failed { message, code, details }` or `[magic-link-db] createMagicLinkRecord insert threw (...) { name, message, stack, cause, causeStack }` | Supabase problem: table missing, RLS, wrong key, or network (e.g. ENOTFOUND). Check masked URL and “SUPABASE_SERVICE_ROLE_KEY defined” line; if details say `getaddrinfo ENOTFOUND` → DNS/network on your machine. |
| HTTP 500, `code: 'EMAIL_ERROR'`, `detail: 'ZeptoMail API error: 401 ...'` (or 4xx/5xx) | `[send-magic-link] sendMagicLinkEmail: ...` and `[ZeptoMail] API error { status: ..., body: ..., to: ... }` | ZeptoMail: bad token, unverified sender, or API/body issue. Check token and ZEPTOMAIL_FROM_EMAIL. |
| HTTP 429 | (none; rate limit only in production) | In current code 429 is not returned in dev. If you see 429, NODE_ENV may not be 'development' or an older build is running. |
| Request failed / ECONNREFUSED | (none) | Dev server not running or wrong port. Start `npm run dev` and, if it’s on 3001, set `TEST_MAGIC_LINK_BASE_URL=http://localhost:3001` when running the script. |

---

## 4. UI error “We couldn’t send the sign-in link…” → backend cause

**Which response shapes from `/api/auth/send-magic-link` cause this message**

- The modal shows that text whenever the **request to `/api/auth/send-magic-link` is not OK** (except 429):
  - **400:** invalid email → generic error path, so same message.
  - **429:** “Too many requests…” (different copy); in dev you shouldn’t see 429.
  - **500:** any server error (missing env, DB_ERROR, EMAIL_ERROR, unexpected) → “We couldn’t send the sign-in link…” (and in dev, with extra hint if we send `detail` or `missing`).
- So: **any 4xx (other than 429) or 5xx** from the API can produce that UI message. The most common in your setup is **500**.

**How to read extra debug info in the Network tab**

1. Open DevTools → Network.
2. Submit “Send Sign In Link” in the modal.
3. Find the request: **Method** POST, **Name** `send-magic-link` (or path containing it).
4. Click it → **Response** (or **Preview**). You’ll see JSON, e.g.:
   - `{ "error": "Failed to send magic link", "code": "MISSING_ENV", "missing": ["ZEPTOMAIL_FROM_EMAIL"] }`
   - `{ "error": "Failed to send magic link", "code": "DB_ERROR", "detail": "Failed to store magic link token: TypeError: fetch failed" }`
   - `{ "error": "Failed to send magic link", "code": "EMAIL_ERROR", "detail": "ZeptoMail API error: 401 ..." }`
5. In **development**, `code` and `detail` (and `missing`) are present and tell you the backend cause. The UI may also append `(detail)` or `(Missing: …)` to the red message if we pass them.

**Main backend failure branches that can produce that UI error (and what to check first)**

| Branch | What you see in dev (response / logs) | Check first |
|--------|----------------------------------------|-------------|
| **Missing env** | 500, `code: 'MISSING_ENV'`, `missing: [...]`; server: `[send-magic-link] Missing env: ...` | Ensure `.env.local` has `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`. Restart `npm run dev`. |
| **Supabase DB / network** | 500, `code: 'DB_ERROR'`, `detail` with e.g. “TypeError: fetch failed” or “Failed to store magic link token”; server: `[magic-link-db] createMagicLinkRecord: Supabase URL (masked) ... \| SUPABASE_SERVICE_ROLE_KEY defined: true/false` and either “insert failed” or “insert threw”. If `detail` or server log contains **getaddrinfo ENOTFOUND** for `*.supabase.co` | DNS/network from your machine (VPN, firewall, DNS). Try other network or DNS (e.g. 8.8.8.8). Confirm `NEXT_PUBLIC_SUPABASE_URL` is correct and table `magic_link_tokens` exists; confirm `SUPABASE_SERVICE_ROLE_KEY` is the service_role secret. |
| **ZeptoMail 4xx/5xx** | 500, `code: 'EMAIL_ERROR'`, `detail: 'ZeptoMail API error: 401 ...'` (or 400/5xx); server: `[ZeptoMail] API error { status, body, to }` | ZeptoMail: correct Send Mail token in `ZEPTOMAIL_API_KEY`, verified sender in `ZEPTOMAIL_FROM_EMAIL`. Check ZeptoMail dashboard and `body` in the log. |
| **Unexpected throw** | 500, `code: 'UNEXPECTED'`, `detail: ...`; server: `[send-magic-link] unexpected: ...` | Inspect `detail` and server stack; fix the underlying bug or env. |

**Order of checks when you see “We couldn’t send the sign-in link…”**

1. **Network tab** → response body: note `code` and `detail` (and `missing` if present).
2. **Dev server terminal** → lines starting with `[send-magic-link]` and `[magic-link-db]` or `[ZeptoMail]`.
3. If `code === 'MISSING_ENV'` → fix env and restart dev.
4. If `code === 'DB_ERROR'` and message or log says **ENOTFOUND** / **fetch failed** → treat as DNS/network first; then confirm Supabase URL and key and table.
5. If `code === 'EMAIL_ERROR'` → fix ZeptoMail token and sender.

No env values are modified in this runbook; adjust `.env.local` and Vercel manually based on the checks above.
