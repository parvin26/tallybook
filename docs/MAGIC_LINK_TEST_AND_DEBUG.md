# Magic Link – Env Verification, Expected Output, Debug, Checklist

## 1. Env usage verification

All magic-link related code uses these **exact** keys:

| Env key | Where used | Purpose |
|---------|------------|---------|
| `ZEPTOMAIL_API_KEY` | `src/lib/auth/zeptomail.ts`, `src/app/api/auth/send-magic-link/route.ts`, `scripts/test-magic-link.mjs` | Send Mail token. Code accepts **either** the raw token (e.g. `wSsVR61/...`) **or** the full `Zoho-enczapikey <token>` string; the header is built correctly in both cases. |
| `ZEPTOMAIL_FROM_EMAIL` | `src/lib/auth/zeptomail.ts`, route env check, test script | Verified sender address (e.g. `noreply@tallybook.app`). |
| `APP_BASE_URL` | `src/app/api/auth/send-magic-link/route.ts`, `src/app/auth/magic/page.tsx` | Base URL for magic link and redirect (local: `http://localhost:3000`, prod: `https://tallybook.app`). |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/server-admin.ts`, `src/lib/auth/magic-link-db.ts`, route env check, test script | Server-only; used for `magic_link_tokens` and `/auth/magic` generateLink. |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/server-admin.ts`, `server.ts`, `browser.ts`, route env check, test script | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/server.ts`, `browser.ts` | Used by Supabase client (not by send-magic-link route; required for app auth). |

**Old names:**  
- `ZEPTOMAIL_FROM_ADDRESS` is still read in `zeptomail.ts` only as a **fallback** if `ZEPTOMAIL_FROM_EMAIL` is not set. The route and test script require `ZEPTOMAIL_FROM_EMAIL`. No code relies on `ZEPTOMAIL_FROM_ADDRESS` alone for the magic-link flow.  
- No other legacy ZeptoMail env names are used.

---

## 2. Expected output for each step

Run from the project root. Assume `.env.local` has all required vars set.

### Step 1: `npm run dev`

**Success:**  
- Terminal shows Next.js starting (e.g. `▲ Next.js 16.x.x`, `- Local: http://localhost:3000`, `- Environments: .env.local`).  
- No error about missing env (env is read by Next.js for API routes when they run).

**Failure:**  
- If a required env var is missing and you hit the API, you’ll get 500 and see `[send-magic-link] Missing env: ...` in this terminal when you trigger send-magic-link.

---

### Step 2: `node scripts/test-magic-link.mjs` (env check only)

**Success (all required set in .env.local):**

```
Magic link env check (Tally)

Required env:
  ZEPTOMAIL_API_KEY: wSsVR61...   (or similar masked)
  ZEPTOMAIL_FROM_EMAIL: noreply...
  SUPABASE_SERVICE_ROLE_KEY: eyJ...
  NEXT_PUBLIC_SUPABASE_URL: https://...

Optional env:
  APP_BASE_URL: set
  ZEPTOMAIL_FROM_NAME: (not set)

Env check OK.
```

Exit code 0.

**Failure (e.g. missing ZEPTOMAIL_FROM_EMAIL):**

```
...
Required env:
  ZEPTOMAIL_API_KEY: wSsVR61...
  ZEPTOMAIL_FROM_EMAIL: (missing)
  ...
Missing required: ZEPTOMAIL_FROM_EMAIL
Add them to .env.local (see docs/MAGIC_LINK_ENV.md).
```

Exit code 1.

---

### Step 3: `node scripts/test-magic-link.mjs --send --email=MY_TEST_EMAIL`

**Prerequisite:** Dev server is running (`npm run dev`) so `http://localhost:3000/api/auth/send-magic-link` is up.

**Success:**

- Script output:
  - `Sending test magic link to MY_TEST_EMAIL via http://localhost:3000/api/auth/send-magic-link ...`
  - `HTTP status: 200`
  - `Success: { ok: true }`
- Exit code 0.
- In the **dev server** terminal: `[send-magic-link] OK email=MY_TEST_EMAIL baseUrl=http://localhost:3000`
- An email arrives at `MY_TEST_EMAIL` (inbox or spam) with subject “Sign in to Tally” and a link to `http://localhost:3000/auth/magic?token=...`

**Failure cases:**

1. **Dev server not running**  
   - Script: `Request failed: fetch failed` (or similar), “Is the dev server running? Try: npm run dev”.  
   - Fix: Start `npm run dev` and run the script again.

2. **Missing env (e.g. on server)**  
   - Script: `HTTP status: 500`, `Error response body: { error: '...', code: 'MISSING_ENV', missing: ['ZEPTOMAIL_FROM_EMAIL'] }`.  
   - Fix: Add the listed vars to `.env.local` and restart `npm run dev`.

3. **ZeptoMail API error (e.g. 401)**  
   - Script: `HTTP status: 500`, `Detail: ZeptoMail API error: 401 ...`  
   - Dev server: `[send-magic-link] sendMagicLinkEmail: ZeptoMail API error: 401 ...` and `[ZeptoMail] API error { status: 401, body: '...', to: 'MY_TEST_EMAIL' }`.  
   - Fix: See “Debug instructions” below (ZeptoMail 401).

4. **Supabase insert error (e.g. table missing)**  
   - Script: `HTTP status: 500`, `Detail: Failed to store magic link token: ...`  
   - Dev server: `[send-magic-link] createMagicLinkRecord: ...` and `[magic-link-db] createMagicLinkRecord insert failed { message: '...', code: '...', details: ... }`.  
   - Fix: See “Debug instructions” below (Supabase insert).

---

## 3. Debug instructions (likely errors and fixes)

| What you see | Cause | Fix |
|--------------|--------|-----|
| **ZeptoMail 401** in `[ZeptoMail] API error` and in API response `detail` | Wrong or malformed API token. | Set `ZEPTOMAIL_API_KEY` to the **Send Mail token** from ZeptoMail API tab (the value that goes after `Zoho-enczapikey ` in the cURL example). You can use either the raw token or the full `Zoho-enczapikey <token>` string; the code normalizes it. Ensure no extra spaces or quotes. |
| **ZeptoMail 4xx** (e.g. 400) with body about “from” / “sender” | Sender not allowed or not verified. | Set `ZEPTOMAIL_FROM_EMAIL` to an address that is **verified** for your ZeptoMail Agent (e.g. `noreply@tallybook.app` for domain `tallybook.app`). In ZeptoMail, add and verify that sender for the Agent. |
| **ZeptoMail 5xx** or timeout | ZeptoMail service issue or network. | Retry; check ZeptoMail status/dashboard. |
| **`[magic-link-db] createMagicLinkRecord insert failed`** with e.g. `relation "magic_link_tokens" does not exist` | Table not created. | Run the migration: `supabase/migrations/20260131000000_magic_link_tokens.sql` (create `public.magic_link_tokens`). |
| **Same** with RLS or permission error | Permissions. | Service role bypasses RLS; ensure `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** secret from Supabase Project Settings → API. |
| **`MISSING_ENV`** with `missing: ['ZEPTOMAIL_FROM_EMAIL']` (or others) | Env not set where the API runs. | Add the listed vars to `.env.local` for local, or to Vercel (or host) Environment Variables for production. Restart dev server or redeploy. |
| **Rate limit** | Too many requests for same email. | Script/API returns 429. Wait ~15 minutes or use a different test email. |

---

## 4. Final checklist

### In the UI on http://localhost:3000

- [ ] **Option A – ContinueChoice modal:** Add a transaction or use the app until the “Save your progress?” (or similar) modal appears → choose “Email Link” (or “Sign in with email”) → enter **Name (optional)** and **Email address** → Submit. You should see success and an email at that address.
- [ ] **Option B – Login page:** Go to `/login?method=email` (or use the link that opens the email form). Enter your email and submit. You should see a success message and receive the email.

### Network tab (DevTools → Network)

- [ ] After submitting the form, find the request to **`/api/auth/send-magic-link`** (method **POST**).
- [ ] **Success:** Status **200**, response body `{ "ok": true }`.
- [ ] **Failure:** Status **400** (invalid email), **429** (rate limit), or **500** (server error). For 500, open the response body: in dev you’ll see `error`, and possibly `code`, `detail`, `missing` (e.g. `MISSING_ENV`, ZeptoMail error message).

### Server logs (terminal where `npm run dev` is running)

- [ ] **Success:** One line like `[send-magic-link] OK email=... baseUrl=http://localhost:3000`.
- [ ] **Failure:**  
  - `[send-magic-link] Missing env: ...` → add missing vars to `.env.local`.  
  - `[send-magic-link] createMagicLinkRecord: ...` and `[magic-link-db] createMagicLinkRecord insert failed ...` → fix DB (migration, service role).  
  - `[send-magic-link] sendMagicLinkEmail: ...` and `[ZeptoMail] API error { status: ..., body: ..., to: ... }` → fix ZeptoMail (token, sender, or see response body).

### Production (Vercel) – same config

- [ ] In Vercel: **Project → Settings → Environment Variables**. Confirm for **Production** (and Preview if you use it):  
  `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `APP_BASE_URL` (= `https://tallybook.app`), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Redeploy** after changing env (e.g. “Redeploy” on latest deployment) so the new values are used.
- [ ] Trigger magic link from the **production** URL (e.g. https://tallybook.app) and check:  
  - Network: `POST .../api/auth/send-magic-link` → 200 and `{ "ok": true }`.  
  - Email received; link in email points to `https://tallybook.app/auth/magic?token=...` and works.
- [ ] Optional: In Vercel **Deployments → select deployment → Logs / Functions**, trigger magic link and look for `[send-magic-link] OK` or `[ZeptoMail] API error` to confirm server-side behavior.
