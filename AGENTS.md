# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Tally is a single Next.js 16 PWA (Progressive Web App) — a digital ledger for small businesses. It uses npm as the package manager (`package-lock.json`). There is no monorepo, no Docker, and no separate backend services.

### Running the app

- **Dev server:** `npm run dev` (runs on `localhost:3000`)
- **Build:** `npm run build --webpack` (the `--webpack` flag is already in the `package.json` script; Next 16 defaults to Turbopack but next-pwa requires webpack)
- **Lint:** `npm run lint` — pre-existing lint errors (43 errors, 163 warnings) exist in the codebase; these are not regressions

### Environment variables

A `.env.local` file is required with at minimum:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

Without real Supabase credentials, the app works in **guest mode** (localStorage-only). Dummy placeholder values in `.env.local` are sufficient to start the dev server; the Supabase client will fail to connect but guest mode functions fully.

### Guest mode testing (no Supabase needed)

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000` — redirects to `/onboarding/country`
3. Select country (e.g., Malaysia), then language (e.g., English)
4. On the "Save your progress?" modal, click **"Continue without login"** to enter guest mode
5. All transactions are stored in localStorage; no network calls to Supabase required

### Gotchas

- The `next-pwa` package forces webpack mode. The `build` script already includes `--webpack`. If you see Turbopack/webpack mismatch warnings, this is expected.
- ESLint config uses flat config format (`eslint.config.mjs`). The `npm run lint` command runs `eslint` directly (ESLint 9 flat config).
- There are no automated test suites (no `jest`, `vitest`, or `playwright` configured). Testing is manual.
- The `public/sw.js` and `public/workbox-*.js` files are generated build artifacts that produce many lint warnings — these are expected and should not be fixed.
