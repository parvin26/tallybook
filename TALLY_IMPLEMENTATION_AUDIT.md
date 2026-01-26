# TALLY Implementation Audit Report
**Date:** Generated from codebase scan  
**Scope:** Complete feature inventory, user flows, gaps, and roadmap

---

## O1: Evidence-Based Feature Inventory

| Feature | Status | Routes | Key Files | Storage | Backend Deps | Notes |
|---------|--------|--------|-----------|---------|--------------|-------|
| **Onboarding** |
| Country Selection | Working | `/onboarding/country` | `src/app/onboarding/country/page.tsx` | `localStorage: tally-onboarding-country` | None | Stores country ID (malaysia/sierra-leone) |
| Language Selection | Working | `/onboarding/language` | `src/app/onboarding/language/page.tsx` | `localStorage: tally-language` | None | Filters by country, redirects if no country |
| About Tally | Working | `/onboarding/about` | `src/app/onboarding/about/page.tsx` | None | None | Info page, navigates to start |
| Start/Complete | Working | `/onboarding/start` | `src/app/onboarding/start/page.tsx` | `localStorage: tally_onboarding_completed` | None | Sets completion flag, redirects to `/` |
| Onboarding Overlay | Partially Working | Home page | `src/components/OnboardingOverlay.tsx` | `localStorage: tally_onboarding_completed`, `sessionStorage: tally_intro_seen_session` | None | Shows on home if not completed, separate from welcome |
| Welcome Modal | Working | `/welcome` | `src/app/welcome/page.tsx` | `localStorage: tally-welcome-seen` | None | Modal overlay, 5 slides, blocks body scroll |
| **Auth** |
| Phone OTP Login | Working | `/login` | `src/app/login/page.tsx` | `sessionStorage: phone` | Supabase Auth | Test mode in dev, formats phone to +60 |
| Email Magic Link | Working | `/login` | `src/app/login/page.tsx` | None | Supabase Auth | Shows confirmation state, redirects on click |
| OTP Verification | Working | `/verify` | `src/app/verify/page.tsx` | `sessionStorage: phone` | Supabase Auth | Test codes in dev, checks business after auth |
| Guest Mode | Working | `/login` | `src/app/login/page.tsx`, `src/lib/guest-storage.ts` | `localStorage: tally-guest-mode`, `tally-guest-transactions`, `tally-guest-business` | None | Enables via button, stores transactions locally |
| Logout | Working | `/settings` | `src/app/settings/page.tsx`, `src/contexts/AuthContext.tsx` | Clears: `dev-bypass-auth`, `tally-welcome-seen`, `tally_intro_seen_session`, guest mode | Supabase Auth | Uses `router.replace('/login')`, clears React Query cache |
| AuthGuard | Working | All routes | `src/components/AuthGuard.tsx` | Checks: `dev-bypass-auth`, `tally_onboarding_completed`, `tally-welcome-seen` | Supabase Auth | Allows guest mode, dev bypass, public routes |
| Guest Data Import | Working | On login | `src/components/GuestDataImport.tsx` | Reads: `tally-guest-transactions` | Supabase `transactions` table | Shows dialog if guest data exists, imports in batches |
| **Core Bookkeeping** |
| Record Sale | Working | `/sale` | `src/app/sale/page.tsx` | Draft: `localStorage: sale-draft-{businessId}` | Supabase `transactions`, `transaction_attachments`, `inventory_movements` | Supports guest mode, stock deduction, attachments |
| Record Expense | Working | `/expense` | `src/app/expense/page.tsx` | Draft: `localStorage: expense-draft-{businessId}` | Supabase `transactions`, `transaction_attachments` | Supports guest mode, payment method, attachments |
| Transaction List | Working | `/`, `/history` | `src/components/TransactionList.tsx`, `src/hooks/useTransactions.ts` | None | Supabase `transactions` | Reads from guest storage in guest mode |
| Transaction Detail | Working | `/transaction/[id]` | `src/app/transaction/[id]/page.tsx` | None | Supabase `transactions`, `transaction_attachments` | View/edit/delete transaction |
| **Reports** |
| Profit & Loss | Working | `/summary` | `src/app/summary/page.tsx` | None | Supabase `transactions` | Period presets, revenue/expense breakdown, PDF export |
| Balance Sheet | Working | `/balance` | `src/app/balance/page.tsx` | None | Supabase `transactions`, `inventory_items` | Calculates assets/liabilities/equity, inventory valuation, PDF export |
| Business Health | Working | `/health` | `src/app/health/page.tsx` | None | Supabase `transactions` | Insights: consistency, cash direction, momentum, stability, products, payment methods |
| Reports Hub | Working | `/reports` | `src/app/reports/page.tsx` | None | None | Links to P&L, Balance Sheet, Business Health |
| **Settings** |
| Account/Profile | Working | `/settings` | `src/app/settings/page.tsx` | `localStorage: tally-business-profile` | Supabase `businesses` | Edit business profile, language, country, PWA install |
| Language Change | Working | `/settings` | `src/app/settings/page.tsx` | `localStorage: tally-language` | None | Modal selector, updates i18n, persists |
| Business Profile Edit | Working | `/settings` | `src/app/settings/page.tsx`, `src/lib/businessProfile.ts` | `localStorage: tally-business-profile` | Supabase `businesses` | Logo upload, name, category, location |
| **PWA** |
| Install Detection | Working | All pages | `src/lib/pwa.ts` | In-memory: `deferredPrompt` | None | Listens for `beforeinstallprompt` event |
| Install Card | Working | `/settings` | `src/app/settings/page.tsx` | None | None | Shows if `canInstall()` returns true |
| Install State | Working | All pages | `src/lib/pwa.ts` | None | None | Checks `display-mode: standalone` and `navigator.standalone` |
| **i18n** |
| Language System | Working | All pages | `src/i18n/config.ts` | `localStorage: tally-language` | None | Loads en/bm/krio, fallback to en |
| Translation Hook | Working | All pages | `react-i18next` | None | None | `useTranslation()` hook used throughout |
| Audit Script | Working | CLI | `scripts/export-i18n-csv.mjs` | None | None | Exports keys to CSV, identifies missing translations |
| Locale Files | Working | Build time | `src/i18n/locales/{en,bm,krio}.json` | None | None | JSON files, loaded at init |

---

## O2: User Journey Flow Diagram

### First-Time User (No Auth)
```
1. Visit / → middleware.ts (passes through, no redirect)
   ↓
2. AuthGuard.tsx (line 102-108): No user, not public route → router.replace('/login')
   ↓
3. /login → User selects auth method (Phone OTP or Email)
   ↓
4a. Phone OTP: Enter phone → /verify → Enter OTP → Supabase auth → Check business
   ↓
4b. Email Magic Link: Enter email → Confirmation shown → Click link in email → Supabase auth → Check business
   ↓
5. AuthGuard.tsx (line 111-117): Check onboarding → If not completed → router.replace('/onboarding/country')
   ↓
6. /onboarding/country → Select country → localStorage.setItem('tally-onboarding-country', 'malaysia')
   ↓
7. /onboarding/language → Filter languages by country → Select language → localStorage.setItem('tally-language', 'en')
   ↓
8. /onboarding/about → Info page → /onboarding/start
   ↓
9. /onboarding/start → Click Start → localStorage.setItem('tally_onboarding_completed', 'true') → router.push('/')
   ↓
10. AuthGuard.tsx (line 120-126): Check welcome → If not seen → router.replace('/welcome')
   ↓
11. /welcome → Modal overlay → Skip/Next → localStorage.setItem('tally-welcome-seen', 'true') → router.push('/')
   ↓
12. AuthGuard.tsx (line 129-132): Check business → If no business → router.replace('/setup')
   ↓
13. /setup → Create business → Supabase insert → refreshBusiness() → router.push('/')
   ↓
14. / → Home page → OnboardingOverlay may show (if tally_onboarding_completed not set)
```

### Guest Mode User
```
1. Visit /login → Click "Continue without login"
   ↓
2. enableGuestMode() → localStorage.setItem('tally-guest-mode', 'true')
   ↓
3. router.push('/') → AuthGuard.tsx (line 88-96): guestMode=true → Allow access
   ↓
4. / → Record sale/expense → saveGuestTransaction() → localStorage: tally-guest-transactions
   ↓
5. Later: Login → GuestDataImport.tsx detects guest data → Show import dialog → Import or discard
```

### Returning Authenticated User
```
1. Visit / → AuthGuard.tsx: user exists → Check onboarding (completed) → Check welcome (seen) → Check business (exists)
   ↓
2. / → Home page → useTransactions() → Fetch from Supabase → Display transactions
```

---

## O3: Gaps and Regressions with Root Cause

### P0: Production Blockers

#### Gap 1: Payment Method Migration Not Applied
**What is missing:** Database columns `payment_method`, `payment_provider`, `payment_reference` may not exist in production Supabase.

**Root cause:** Migration file exists (`supabase-expense-payment-method-migration.sql`) but may not have been run in production database.

**Evidence:**
- File: `supabase-expense-payment-method-migration.sql` (lines 5-8) defines columns
- File: `src/app/expense/page.tsx` (lines 132-136) uses these columns in insert
- File: `src/app/sale/page.tsx` does NOT use payment_method (only payment_type)

**Exact location:**
- Migration: `supabase-expense-payment-method-migration.sql:5-8`
- Usage: `src/app/expense/page.tsx:132-136`

**Minimal fix:**
1. Run migration SQL in Supabase production database
2. Verify columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN ('payment_method', 'payment_provider', 'payment_reference')`

**Risks if not fixed:**
- Expense recording will fail in production with column not found error
- Payment method data will not be stored

#### Gap 2: Onboarding Completion Check Inconsistency
**What is broken:** Two separate onboarding systems exist:
1. `OnboardingOverlay` checks `tally_onboarding_completed` (line 41)
2. `AuthGuard` checks `tally_onboarding_completed` (line 112)
3. `/onboarding/start` sets `tally_onboarding_completed` (line 13)
4. But `/onboarding/country` and `/onboarding/language` don't require this flag

**Root cause:** Onboarding flow can be bypassed by directly visiting `/onboarding/country` without completing the flow.

**Evidence:**
- File: `src/components/OnboardingOverlay.tsx:41` checks `tally_onboarding_completed`
- File: `src/components/AuthGuard.tsx:112` checks `tally_onboarding_completed`
- File: `src/app/onboarding/country/page.tsx` has no completion check
- File: `src/app/onboarding/start/page.tsx:13` sets flag

**Exact location:**
- `src/components/AuthGuard.tsx:111-117`
- `src/app/onboarding/country/page.tsx` (no guard)

**Minimal fix:**
- Add completion check in `/onboarding/country` to redirect to `/` if already completed
- OR remove `OnboardingOverlay` if it's redundant with welcome page

**Risks if not fixed:**
- Users can skip onboarding by direct URL access
- Inconsistent UX between overlay and dedicated pages

### P1: Onboarding UX Regressions

#### Gap 3: Country Selection Next Button Debug Code
**What is incomplete:** Debug logging and debug UI still present in production code.

**Evidence:**
- File: `src/app/onboarding/country/page.tsx:63,76,80,85,157-161` contains `console.log` and debug div

**Exact location:**
- `src/app/onboarding/country/page.tsx:157-161` (debug div)

**Minimal fix:**
- Remove debug div (lines 157-161)
- Remove or gate console.log statements with `process.env.NODE_ENV === 'development'`

**Risks if not fixed:**
- Debug info visible to users in production
- Console noise in production

#### Gap 4: Onboarding Overlay Uses Hardcoded English
**What is broken:** `OnboardingOverlay` component has hardcoded English strings instead of i18n keys.

**Evidence:**
- File: `src/components/OnboardingOverlay.tsx:12-16` has hardcoded slide content
- File: `src/components/OnboardingOverlay.tsx:130` has hardcoded "Welcome to Tally"
- File: `src/components/OnboardingOverlay.tsx:166,175,181,189` has hardcoded "Back", "Skip", "Next", "Get Started"

**Exact location:**
- `src/components/OnboardingOverlay.tsx:12-16,130,166,175,181,189`

**Minimal fix:**
- Replace hardcoded strings with `t()` calls
- Add keys to `en.json`, `bm.json`, `krio.json`

**Risks if not fixed:**
- Overlay always shows English regardless of language selection
- Inconsistent with rest of app

### P2: Data Correctness Blockers

#### Gap 5: Balance Sheet Inventory Valuation Logic
**What is incomplete:** Inventory value calculation uses fallback estimation that may not match actual inventory.

**Evidence:**
- File: `src/app/balance/page.tsx:66-94` calculates inventory value
- Line 81: `avgCostPerUnit = totalStockPurchases / (totalStockQuantity + stockPurchases.length)` - incorrect formula
- Line 85: Fallback uses `totalStockPurchases * 0.5` which is arbitrary

**Exact location:**
- `src/app/balance/page.tsx:66-94`

**Minimal fix:**
- Use actual inventory item costs if available
- OR use last purchase price per item
- OR document that this is an estimate

**Risks if not fixed:**
- Balance Sheet may not balance if inventory value is wrong
- Users may see incorrect asset totals

#### Gap 6: Payment Method Not Stored for Sales
**What is missing:** Sale transactions don't store `payment_method` field, only `payment_type`.

**Evidence:**
- File: `src/app/sale/page.tsx:153-162` inserts sale transaction
- Only sets `payment_type`, not `payment_method`
- File: `src/app/expense/page.tsx:132-136` sets both `payment_type` and `payment_method`

**Exact location:**
- `src/app/sale/page.tsx:153-162`

**Minimal fix:**
- Add `payment_method` field to sale insert
- Map `paymentType` to `payment_method` (same logic as expense)

**Risks if not fixed:**
- Inconsistent data model between sales and expenses
- Reports may not correctly categorize payment methods for sales

### P3: Polish Issues

#### Gap 7: PWA Install Card Shows "Installed" Incorrectly
**What is broken:** `isStandalone()` may return true on desktop browsers that don't support PWA.

**Evidence:**
- File: `src/lib/pwa.ts:44-58` checks `display-mode: standalone` and `navigator.standalone`
- File: `src/app/settings/page.tsx` uses `isStandalone()` to show "Installed" state
- Desktop browsers may match `display-mode: standalone` even when not installed

**Exact location:**
- `src/lib/pwa.ts:44-58`
- `src/app/settings/page.tsx` (PWA install card section)

**Minimal fix:**
- Add additional check: only show "Installed" if `deferredPrompt === null` AND `isStandalone() === true`
- OR check for `beforeinstallprompt` event history

**Risks if not fixed:**
- Users see "Installed" when app is not actually installed
- Confusion about install state

#### Gap 8: Telemetry Consent Always Shows
**What is incomplete:** `TelemetryConsent` component may show on every page load if consent was never given.

**Evidence:**
- File: `src/components/TelemetryConsent.tsx:28-35` checks `hasTelemetryConsent()`
- If `localStorage.getItem('tally-telemetry-consent')` is null, it shows dialog
- But if user closes browser without accepting/declining, it shows again

**Exact location:**
- `src/components/TelemetryConsent.tsx:28-35`

**Minimal fix:**
- Set a default value (e.g., 'false') if user dismisses without choosing
- OR add a "Don't ask again" option

**Risks if not fixed:**
- Consent dialog may appear repeatedly
- Poor UX

---

## O4: File Index by Domain

### Routing and Middleware
- `middleware.ts` - Next.js middleware (passes through, no redirects)
- `src/app/layout.tsx` - Root layout (server component)
- `src/app/providers.tsx` - Client providers wrapper
- `src/components/AuthGuard.tsx` - Route protection and redirects

### Onboarding
- `src/app/onboarding/country/page.tsx` - Country selection
- `src/app/onboarding/language/page.tsx` - Language selection
- `src/app/onboarding/about/page.tsx` - About Tally info
- `src/app/onboarding/start/page.tsx` - Completion page
- `src/components/OnboardingOverlay.tsx` - Home page overlay (separate from welcome)
- `src/app/welcome/page.tsx` - Welcome modal (5 slides)

### Auth
- `src/app/login/page.tsx` - Login page (Phone OTP + Email magic link + Guest mode)
- `src/app/verify/page.tsx` - OTP verification
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/lib/guest-storage.ts` - Guest mode storage utilities
- `src/components/GuestDataImport.tsx` - Import guest data on login

### i18n
- `src/i18n/config.ts` - i18next configuration
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/bm.json` - Bahasa Malaysia translations
- `src/i18n/locales/krio.json` - Krio translations
- `scripts/export-i18n-csv.mjs` - Translation audit script

### Supabase
- `src/lib/supabase/supabaseClient.ts` - Supabase client initialization
- Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

### Transactions
- `src/hooks/useTransactions.ts` - Transaction fetching hook (supports guest mode)
- `src/app/sale/page.tsx` - Record sale page
- `src/app/expense/page.tsx` - Record expense page
- `src/app/transaction/[id]/page.tsx` - Transaction detail page
- `src/app/history/page.tsx` - Transaction history page
- `src/components/TransactionList.tsx` - Transaction list component

### Reports
- `src/app/summary/page.tsx` - Profit & Loss report
- `src/app/balance/page.tsx` - Balance Sheet report
- `src/app/health/page.tsx` - Business Health insights
- `src/app/reports/page.tsx` - Reports hub
- `src/lib/pdf-generator.ts` - PDF export utilities

### PWA
- `src/lib/pwa.ts` - PWA install detection and prompts
- `public/manifest.json` - PWA manifest (referenced in layout.tsx:8)

### Business Context
- `src/contexts/BusinessContext.tsx` - Business state management
- `src/app/setup/page.tsx` - Business setup page
- `src/lib/businessProfile.ts` - Business profile storage (localStorage)

### Telemetry
- `src/lib/telemetry.ts` - Privacy-safe telemetry tracking
- `src/components/TelemetryConsent.tsx` - Consent dialog

---

## O5: Prioritized Fix Roadmap

### P0: Production Blockers

#### Task 1: Verify Payment Method Migration
**Owner action:** Run SQL migration in Supabase production database
**Files to touch:** None (database only)
**Test checklist:**
- [ ] Run `supabase-expense-payment-method-migration.sql` in Supabase SQL Editor
- [ ] Verify columns exist: `SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN ('payment_method', 'payment_provider', 'payment_reference')`
- [ ] Record an expense in production, verify `payment_method` is saved
- [ ] Check Vercel logs for any column errors

#### Task 2: Fix Onboarding Completion Consistency
**Owner action:** Add completion check to `/onboarding/country` or remove redundant overlay
**Files to touch:**
- `src/app/onboarding/country/page.tsx` (add redirect if completed)
- OR `src/app/page.tsx` (remove OnboardingOverlay if welcome page handles it)
**Test checklist:**
- [ ] Complete onboarding flow, verify cannot access `/onboarding/country` directly
- [ ] Verify OnboardingOverlay doesn't show if welcome page already shown
- [ ] Test guest mode onboarding flow

### P1: Onboarding UX Regressions

#### Task 3: Remove Debug Code from Country Selection
**Owner action:** Remove debug logging and UI
**Files to touch:**
- `src/app/onboarding/country/page.tsx` (remove lines 63,76,80,85,157-161)
**Test checklist:**
- [ ] Verify no debug output in browser console
- [ ] Verify no debug div visible on page
- [ ] Test country selection still works

#### Task 4: Internationalize OnboardingOverlay
**Owner action:** Replace hardcoded strings with i18n keys
**Files to touch:**
- `src/components/OnboardingOverlay.tsx` (replace hardcoded strings)
- `src/i18n/locales/en.json` (add keys)
- `src/i18n/locales/bm.json` (add keys)
- `src/i18n/locales/krio.json` (add keys)
**Test checklist:**
- [ ] Change language to BM, verify overlay shows BM text
- [ ] Change language to Krio, verify overlay shows Krio text
- [ ] Verify all buttons and text are translated

### P2: Data Correctness Blockers

#### Task 5: Fix Inventory Valuation in Balance Sheet
**Owner action:** Improve inventory value calculation or document as estimate
**Files to touch:**
- `src/app/balance/page.tsx` (fix calculation logic lines 66-94)
**Test checklist:**
- [ ] Create inventory items with known costs
- [ ] Record stock purchase transactions
- [ ] View Balance Sheet, verify inventory value matches expected
- [ ] Verify Balance Sheet balances (Assets = Liabilities + Equity)

#### Task 6: Add Payment Method to Sales
**Owner action:** Store payment_method field for sale transactions
**Files to touch:**
- `src/app/sale/page.tsx` (add payment_method to insert, line 153-162)
**Test checklist:**
- [ ] Record a sale with different payment types
- [ ] Verify `payment_method` column is populated in Supabase
- [ ] Verify Business Health report correctly categorizes payment methods for sales

### P3: Polish

#### Task 7: Fix PWA Install State Detection
**Owner action:** Improve isStandalone() logic
**Files to touch:**
- `src/lib/pwa.ts` (improve isStandalone check)
- `src/app/settings/page.tsx` (update install card logic)
**Test checklist:**
- [ ] Test on desktop Chrome (should not show "Installed" unless actually installed)
- [ ] Test on mobile Chrome (should show install button if not installed)
- [ ] Test on iOS Safari (should show install instructions)

#### Task 8: Fix Telemetry Consent Persistence
**Owner action:** Set default value if user dismisses
**Files to touch:**
- `src/components/TelemetryConsent.tsx` (set default on dismiss)
**Test checklist:**
- [ ] Dismiss consent dialog without choosing
- [ ] Refresh page, verify dialog doesn't show again
- [ ] Accept consent, verify tracking works
- [ ] Decline consent, verify no tracking events stored

---

## What the App Currently Does Correctly Without Changes

### Verified Working Features (Code Evidence)

1. **Authentication Flow**
   - Phone OTP login works: `src/app/login/page.tsx:54-100` sends OTP, `src/app/verify/page.tsx:140-168` verifies
   - Email magic link works: `src/app/login/page.tsx:102-125` sends link, Supabase handles callback
   - Guest mode works: `src/lib/guest-storage.ts` stores transactions locally, `src/components/AuthGuard.tsx:88-96` allows access
   - Logout works: `src/contexts/AuthContext.tsx:41-70` clears state, `src/app/settings/page.tsx:196-222` redirects to `/login`

2. **Onboarding Flow**
   - Country selection persists: `src/app/onboarding/country/page.tsx:75` saves to localStorage
   - Language selection filters by country: `src/app/onboarding/language/page.tsx:32-39` filters languages
   - Onboarding completion flag works: `src/app/onboarding/start/page.tsx:13` sets flag, `src/components/AuthGuard.tsx:112` checks it

3. **Transaction Recording**
   - Sales save correctly: `src/app/sale/page.tsx:153-162` inserts to Supabase, supports guest mode (line 151-162)
   - Expenses save correctly: `src/app/expense/page.tsx:125-144` inserts to Supabase with payment_method, supports guest mode (line 123-137)
   - Draft saving works: `src/app/sale/page.tsx:111-121` auto-saves drafts to localStorage

4. **Reports**
   - P&L calculates correctly: `src/app/summary/page.tsx:60-100` filters transactions by date, calculates revenue/expenses
   - Balance Sheet calculates assets/liabilities: `src/app/balance/page.tsx:96-325` computes from transactions
   - Business Health generates insights: `src/app/health/page.tsx:57-347` analyzes transaction patterns

5. **i18n System**
   - Language switching works: `src/app/settings/page.tsx` changes language, `src/i18n/config.ts:21` loads from localStorage
   - Translation keys resolve: `useTranslation()` hook used throughout, fallback to 'en' works (line 22)

6. **PWA Detection**
   - Install prompt captured: `src/lib/pwa.ts:21-30` listens for beforeinstallprompt
   - Standalone detection works: `src/lib/pwa.ts:44-58` checks display-mode and navigator.standalone

7. **Guest Data Import**
   - Import dialog shows: `src/components/GuestDataImport.tsx:15-20` checks for guest transactions on login
   - Import works: `src/components/GuestDataImport.tsx:30-60` imports in batches to Supabase

8. **Navigation**
   - AuthGuard redirects correctly: `src/components/AuthGuard.tsx` handles all redirect scenarios
   - Public routes accessible: `src/components/AuthGuard.tsx:29` defines public routes, allows access

---

**End of Audit Report**
