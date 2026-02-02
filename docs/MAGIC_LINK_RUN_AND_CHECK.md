# Magic Link – Run Steps & Field Checklist

## Confirmation: no remaining TODOs or missing pieces

- **`src/app/api/auth/send-magic-link/route.ts`** – Env check (ZEPTOMAIL_API_KEY, ZEPTOMAIL_FROM_EMAIL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL), rate limit, createMagicLinkRecord, sendMagicLinkEmail, error logging and dev-only `code`/`detail`/`missing`. Complete.
- **`src/lib/auth/zeptomail.ts`** – getAuthHeader (raw token or full `Zoho-enczapikey ...`), getFromAddress (ZEPTOMAIL_FROM_EMAIL / ZEPTOMAIL_FROM_ADDRESS fallback), send-email API with from/to/subject/htmlbody, error logging (status, body, to; never API key). Complete.
- **`scripts/test-magic-link.mjs`** – loadEnvLocal, REQUIRED (ZEPTOMAIL_API_KEY, ZEPTOMAIL_FROM_EMAIL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL), env check output, --send POST to localhost, HTTP status and error body/detail/missing. Complete.
- **MAGIC_LINK docs** (MAGIC_LINK_ENV.md, MAGIC_LINK_DEBUG.md, MAGIC_LINK_TEST_AND_DEBUG.md) – No TODOs; env list, debug table, and test instructions are complete.

---

## Step-by-step: what to run and what you’ll see

Run from the **project root**. Use your real email for `MY_EMAIL`.

---

### Step 1: Start the dev server

**Command:**

```bash
npm run dev
```

**Exact success output (conceptually):**

- Next.js version line (e.g. `▲ Next.js 16.x.x`).
- `- Local: http://localhost:3000` (or next free port if 3000 is in use).
- `- Environments: .env.local`.
- `✓ Ready in ...` or `✓ Starting...`.
- Process keeps running; no env-related errors.

**Most likely failure:**

- **Port in use:** “Port 3000 is in use... using port 3001”. Not a failure; use `http://localhost:3001` for the next steps (or stop the other process and use 3000).
- **Env not loaded:** No “.env.local” in the “Environments” line. Fix: ensure `.env.local` is in the project root and restart `npm run dev`.

---

### Step 2: Env check (no send)

**Command (in a second terminal, same project root):**

```bash
node scripts/test-magic-link.mjs
```

**Exact success output:**

```
Magic link env check (Tally)

Required env:
  ZEPTOMAIL_API_KEY: Zoho-enc...   (or 8 chars + ... if longer)
  ZEPTOMAIL_FROM_EMAIL: noreply...
  SUPABASE_SERVICE_ROLE_KEY: eyJhbG...
  NEXT_PUBLIC_SUPABASE_URL: https://...

Optional env:
  APP_BASE_URL: set
  ZEPTOMAIL_FROM_NAME: (not set)

Env check OK.
```

- Script exits with code **0**.

**Most likely failure:**

- **Missing required:** One or more “Required env” lines show `(missing)`; then:
  - `Missing required: ZEPTOMAIL_API_KEY, ZEPTOMAIL_FROM_EMAIL, ...`
  - `Add them to .env.local (see docs/MAGIC_LINK_ENV.md).`
  - Exit **1**.
- **Fix:** Add the listed vars to `.env.local` (no need to change existing values). Re-run the script; no need to restart `npm run dev` for this script (it reads `.env.local` itself).

---

### Step 3: Send test magic link

**Command (dev server still running from Step 1; same project root):**

```bash
node scripts/test-magic-link.mjs --send --email=MY_EMAIL
```

Replace `MY_EMAIL` with your real email (e.g. `you@gmail.com`).

**Exact success output:**

- `Sending test magic link to MY_EMAIL via http://localhost:3000/api/auth/send-magic-link ...`
- `HTTP status: 200`
- `Success: { ok: true }`
- Script exits with code **0**.

**In the terminal where `npm run dev` is running:**

- One line: `[send-magic-link] OK email=MY_EMAIL baseUrl=http://localhost:3000`

**In your inbox (MY_EMAIL):**

- Email from `noreply@tallybook.app` (or your ZEPTOMAIL_FROM_EMAIL), subject “Sign in to Tally”, with a link like `http://localhost:3000/auth/magic?token=...`. Check spam if you don’t see it.

**Most likely failures (from our logging):**

| What you see | Fix |
|--------------|-----|
| **Script:** `Request failed: fetch failed` / `ECONNREFUSED` … **“Is the dev server running?”** | Start or keep `npm run dev` running, then run the script again. |
| **Script:** `HTTP status: 500` and `Error response body: { error: '...', code: 'MISSING_ENV', missing: ['...'] }` | Add the listed vars to `.env.local`. Restart `npm run dev`, then run the script again. |
| **Script:** `HTTP status: 500` and `Detail: ZeptoMail API error: 401 ...` **Dev terminal:** `[send-magic-link] sendMagicLinkEmail: ZeptoMail API error: 401 ...` and `[ZeptoMail] API error { status: 401, body: '...', to: 'MY_EMAIL' }` | ZeptoMail token invalid or malformed. Ensure `ZEPTOMAIL_API_KEY` is either the raw Send Mail token or the full `Zoho-enczapikey <token>` string (no extra spaces/quotes). Re-run. |
| **Script:** `HTTP status: 500` and `Detail: ZeptoMail API error: 4xx ...` (e.g. 400) with body about “from”/“sender” **Dev terminal:** `[ZeptoMail] API error { status: 4xx, body: '...', to: 'MY_EMAIL' }` | Sender not verified. Ensure `ZEPTOMAIL_FROM_EMAIL` (e.g. `noreply@tallybook.app`) is verified for your ZeptoMail Agent. Fix in ZeptoMail dashboard, then re-run. |
| **Script:** `HTTP status: 500` and `Detail: Failed to store magic link token: ...` **Dev terminal:** `[send-magic-link] createMagicLinkRecord: ...` and `[magic-link-db] createMagicLinkRecord insert failed { message: '...', code: '...', details: ... }` | DB issue (e.g. table missing). Run migration for `magic_link_tokens`. Ensure `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** secret. Re-run. |
| **Script:** `HTTP status: 429` and `Error response body: { error: 'Too many requests...' }` | Rate limit (same email too many times). Wait ~15 minutes or use a different `--email=...`. |

---

## Field checklist

### Testing magic link in the browser (http://localhost:3000)

- [ ] Start dev server: `npm run dev`; open http://localhost:3000 (or the port shown).
- [ ] **Path A – “Save your progress?”:** Use the app until the modal appears → choose “Email Link” (or “Sign in with email”) → enter your email → Submit. Expect success message; check inbox (and spam) for “Sign in to Tally”.
- [ ] **Path B – Login:** Go to http://localhost:3000/login?method=email → enter your email → Submit. Expect success message; check inbox (and spam).
- [ ] **Network:** DevTools → Network → find `POST /api/auth/send-magic-link` → Status **200**, response body `{ "ok": true }`.
- [ ] **Server log:** In the `npm run dev` terminal, one line: `[send-magic-link] OK email=... baseUrl=http://localhost:3000`.
- [ ] **Email:** Open the link in the email; it should go to http://localhost:3000/auth/magic?token=... and then sign you in / redirect to the app.

### Testing on Vercel production after push and redeploy

- [ ] Push your branch and ensure the project redeploys (or trigger a redeploy so it uses current env).
- [ ] In Vercel: **Project → Settings → Environment Variables**. Confirm for **Production**: `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `APP_BASE_URL` (= `https://tallybook.app`), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Open your **production** URL (e.g. https://tallybook.app).
- [ ] Trigger magic link the same way as local (modal “Email Link” or `/login?method=email`), using your email.
- [ ] **Network:** `POST .../api/auth/send-magic-link` → Status **200**, body `{ "ok": true }`.
- [ ] **Email:** Receive “Sign in to Tally”; link should be `https://tallybook.app/auth/magic?token=...`. Click it; you should be signed in on production.
- [ ] Optional: **Vercel → Deployments → [latest] → Logs / Functions** → trigger magic link again and look for `[send-magic-link] OK` or `[ZeptoMail] API error` to confirm server-side behavior.
