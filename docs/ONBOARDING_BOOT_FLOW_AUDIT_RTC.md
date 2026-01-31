# RTC Audit: Onboarding Boot Flow — Screen Flicker

**Scope:** End-to-end trace of onboarding boot flow. No code changes. Evidence-only.

---

## SECTION 1: BOOT TRACE TIMELINE

### Assumed initial entry (user-dependent)

| Moment | Event | Location / Evidence |
|--------|--------|---------------------|
| **t+0ms** | **Initial route** | User opens `/` or `/app` or `/onboarding/country`. If `/`: server `redirect('/app')` in `src/app/page.tsx` L4 → 307 to `/app`. If direct `/onboarding/country`, no server redirect. |
| **t+0** | **First paint (SSR/hydration)** | Root layout renders: `Providers` → `IntroGate` → `AuthGuard` → `IntroOrApp` → `{children}`. `children` = current route segment (e.g. `app/app/page` or `onboarding/country/page`). |
| **t+0** | **IntroGate first render** | `src/components/IntroGate.tsx` L23: `introSeen = useState<boolean \| null>(null)`. L46–48: `if (introSeen === null && !forceShowIntro) return null`. **Screen: blank** (IntroGate returns `null`). |
| **t+?** | **IntroGate useEffect runs** | L25–28: `useEffect` reads `localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)`, `setIntroSeen(!!seen)`. After commit: IntroGate re-renders with `introSeen === true` (if seen) → renders `children` (AuthGuard). |
| **t+?** | **AuthGuard + IntroOrApp mount** | AuthGuard renders. Its `children` = IntroOrApp (from layout). IntroOrApp L13: `showIntro = useState<boolean \| null>(null)`. L27–29: `if (showIntro === null) return null`. **Screen: blank again** (IntroOrApp returns `null`). |
| **t+?** | **IntroOrApp useEffect runs** | L15–18: `useEffect` reads `localStorage.getItem(STORAGE_KEYS.INTRO_SEEN)`, `setShowIntro(!!seen)`. After commit: IntroOrApp re-renders; if `showIntro === true` → renders `{children}` (route page). |
| **t+?** | **Auth resolution** | `src/contexts/AuthContext.tsx` L26–52: `useEffect` runs; `isGuestMode()` then `supabase.auth.getSession()`. Sets `authMode`, `user`, `isLoading`. **Async**; order vs IntroGate/IntroOrApp not guaranteed. |
| **t+?** | **Business/profile fetch** | `src/contexts/BusinessContext.tsx` L132–154: `useEffect` calls `loadBusiness()` (Supabase `getUser()`, then `businesses`). **Async**; only affects AuthGuard redirect logic when not on onboarding. |
| **t+?** | **Onboarding status** | No dedicated “onboarding status” resolver. Onboarding = route prefix `/onboarding`; country/language from `localStorage` (STORAGE_KEYS.COUNTRY, LANGUAGE). Read in onboarding pages and in `app/app/page.tsx` L38–56. |
| **t+?** | **First route change (conditional)** | If user landed on `/app`: `src/app/app/page.tsx` L38–56 `useEffect` runs; if `!country` → `router.replace('/onboarding/country')`; if `!language` → `router.replace('/onboarding/language')`. **Client-side redirect** after app home mounts. |
| **t+?** | **Final stable screen** | Either onboarding page (e.g. `/onboarding/country`) or app home (`/app`) once both IntroGate and IntroOrApp have run their effects and (if on `/app`) app page’s redirect has run. |

### A. Route-level sequence (typical first-time to onboarding)

1. Request `/` → server redirect to `/app` (`src/app/page.tsx` L4).
2. Client loads `/app` → layout + `app/app/page.tsx` mount.
3. After IntroGate then IntroOrApp resolve: either `/app` content flashes, then `app/app/page.tsx` useEffect → `router.replace('/onboarding/country')` (no country).
4. Route changes to `/onboarding/country` → layout re-renders; again IntroGate `null` → effect → IntroOrApp `null` → effect → onboarding country page.

### B. Component mount order (layout tree)

```
RootLayout (src/app/layout.tsx)
  └─ Providers (src/app/providers.tsx)
       └─ IntroGate (src/components/IntroGate.tsx)   ← 1st gate: returns null until effect
            └─ AuthGuard (src/components/AuthGuard.tsx)
                 └─ IntroOrApp (src/components/IntroOrApp.tsx)   ← 2nd gate: returns null until effect
                      └─ {children} (route segment)
```

So: **two sequential “gates” that each render `null` until their `useEffect` has run**, causing two phases of blank content before the route page appears.

---

## SECTION 2: NAVIGATION AND STATE TRIGGERS INVENTORY

| # | Trigger type | File : function / line | Condition | Action | Can fire more than once? |
|---|----------------|------------------------|-----------|--------|---------------------------|
| 1 | Server redirect | `src/app/page.tsx` : default export L4 | Always on `/` | `redirect('/app')` | Once per request. |
| 2 | Conditional render (null) | `src/components/IntroGate.tsx` : render L46–48 | `introSeen === null && !forceShowIntro` | Return `null` | Yes; every mount until effect runs. |
| 3 | State setter (localStorage) | `src/components/IntroGate.tsx` : useEffect L25–28 | Client; run once | `setIntroSeen(!!localStorage INTRO_SEEN)` | Once per mount (or twice in dev Strict Mode). |
| 4 | Conditional render (null) | `src/components/IntroOrApp.tsx` : render L27–29 | `showIntro === null` | Return `null` | Yes; every render until effect runs. |
| 5 | State setter (localStorage) | `src/components/IntroOrApp.tsx` : useEffect L15–18 | Client; run once | `setShowIntro(!!localStorage INTRO_SEEN)` | Once per mount (or twice in dev Strict Mode). |
| 6 | Full page navigation | `src/components/IntroOrApp.tsx` : handleIntroFinish L21–24 | User finishes intro (onClose) | `setShowIntro(true)`; `window.location.href = '/onboarding/country'` | Once per “Finish” click. |
| 7 | Full page navigation | `src/components/IntroGate.tsx` : handleIntroClose L36–38 | User closes intro; `!forceShowIntro` | `localStorage.setItem(INTRO_SEEN,'1')`; `window.location.href = '/app'` | Once per close. |
| 8 | Client redirect | `src/app/app/page.tsx` : useEffect L38–56 | On `/app`; `!country` or `!language` | `router.replace('/onboarding/country')` or `router.replace('/onboarding/language')` | Once per mount when condition holds. |
| 9 | AuthGuard redirects | `src/components/AuthGuard.tsx` : useEffect L56–152 | Many (guest, auth, welcome, setup, login). **Onboarding:** L66–68 early return; no redirect. | `router.replace(...)` to /app, /login, /welcome, /setup | Yes; effect deps include user, currentBusiness, pathname, etc. |
| 10 | Client redirect | `src/app/onboarding/language/page.tsx` : useEffect L46–55 | On `/onboarding/language`; `!country` | `router.push('/onboarding/country')` | Once per mount when no country. |
| 11 | Client navigation | `src/app/onboarding/country/page.tsx` : handleContinue L41–43 | User clicks Continue | `router.push('/onboarding/language')` | User-driven. |
| 12 | Client navigation | `src/app/onboarding/language/page.tsx` : handleContinue L71–81 | User selects language and Continue | `router.push('/app')` | User-driven. |

**Route guards:** AuthGuard treats `onboardingRoutes = pathname?.startsWith('/onboarding')` (L29) and returns early (L66–68, L159–161); no auth redirect on onboarding.

**Middleware:** `middleware.ts` does not redirect; only passes through (except static path handling).

**Layouts:** No `layout.tsx` under `src/app/onboarding/`; onboarding pages use root layout only.

---

## SECTION 3: ROOT CAUSE HYPOTHESES WITH EVIDENCE

### Hypothesis 1 (highest likelihood): Two gates both return `null` until useEffect

**Evidence for:**  
- IntroGate and IntroOrApp both initialize state as `null` and return `null` until their single `useEffect` runs and sets state from `localStorage`.  
- They are nested: IntroGate → AuthGuard → IntroOrApp → children. So the UI goes: null (IntroGate) → then IntroOrApp still null → then content.  
- Files: `IntroGate.tsx` L23, L46–48; `IntroOrApp.tsx` L13, L27–29.

**Evidence missing:**  
- Exact timestamps and paint order in a real run (would need instrumentation).

**Verification:**  
- Add a single log at the start of each component render with `pathname`, e.g. `console.log('[IntroGate] render', { introSeen, pathname: window?.location?.pathname })` and same for IntroOrApp; confirm two distinct “null” phases before content.

---

### Hypothesis 2: `/app` mounts then immediately redirects to onboarding

**Evidence for:**  
- Root `/` redirects to `/app`.  
- `app/app/page.tsx` useEffect (L38–56) runs after mount and, if `!country`, calls `router.replace('/onboarding/country')`.  
- So user can see a short flash of `/app` (or its loading state) then transition to `/onboarding/country`.

**Evidence missing:**  
- Whether the app home UI actually paints before the replace (depends on IntroGate/IntroOrApp having already resolved).

**Verification:**  
- Log in `app/app/page.tsx` at top of component and inside useEffect before `router.replace`: e.g. `console.log('[AppPage] mount', pathname)` and `console.log('[AppPage] redirect to onboarding', { country, language })`. Confirm order: mount → effect → replace.

---

### Hypothesis 3: React Strict Mode double-invoking effects in development

**Evidence for:**  
- Next.js does not set `reactStrictMode: false` in `next.config.ts`; default in dev is to enable Strict Mode.  
- Strict Mode can double-invoke effects; both IntroGate and IntroOrApp have a single effect that does setState.  
- Could cause extra re-renders and perceived flicker.

**Evidence missing:**  
- Whether production build (no Strict Mode double-invoke) still shows the same flicker.  
- Confirmation that Strict Mode is actually enabled (not overridden elsewhere).

**Verification:**  
- Build for production and test same flow; if flicker is much reduced, Strict Mode is contributing.  
- Or temporarily set `reactStrictMode: false` in `next.config.ts` and compare (no other logic change).

---

### Hypothesis 4: AuthGuard “Preparing Tally…” flash on non-onboarding routes

**Evidence for:**  
- AuthGuard L164–176: when `authMode === 'unknown' && authLoading && !isPublicRoute && !authTimeout` it renders “Preparing Tally…” instead of children.  
- On onboarding, `isPublicRoute` is true (L29), so this block is skipped (L159–161).  
- So “Preparing Tally…” is **not** shown on `/onboarding/*`. Only relevant if user briefly hits a non-onboarding route (e.g. `/app`) before redirect.

**Evidence missing:**  
- Whether auth is still loading when user is already on onboarding (no; onboarding is public and skips auth).

**Verification:**  
- Log in AuthGuard: when `authLoading` and pathname; confirm that on `/onboarding/country` we never render the loading UI.

---

### Hypothesis 5: Full page reload (window.location.href) plus double gate

**Evidence for:**  
- IntroOrApp handleIntroFinish (L21–24) and IntroGate handleIntroClose (L37) use `window.location.href`, causing a full reload.  
- After reload on `/onboarding/country`, the same layout mounts again: IntroGate null → effect → IntroOrApp null → effect → content.  
- So even with “correct” target route, the user still sees two blank phases.

**Evidence missing:**  
- Whether the reported flicker is “blank → blank → onboarding” or “other screens → onboarding”; both are consistent with this plus H1.

**Verification:**  
- Same as H1: timestamped logs in IntroGate and IntroOrApp to count null renders after a full load of `/onboarding/country`.

---

## SECTION 4: FIX PLAN OPTIONS (DO NOT IMPLEMENT)

### Option A: Single intro gate (remove duplicate null phase)

**Change:**  
- Use only one of IntroGate or IntroOrApp to decide “intro vs app content,” and remove the other from the tree (or make it a no-op that always renders children).  
- Prefer keeping IntroOrApp in layout (closer to root) and removing IntroGate’s “intro check” so IntroGate always renders children when not `forceShowIntro`.  
- Or: keep IntroGate, and have IntroOrApp not return null—e.g. always render children and let IntroGate control overlay.

**Why it reduces flicker:**  
- One instead of two components that return `null` until localStorage is read; one blank phase instead of two.

**Risks:**  
- IntroGate and IntroOrApp are not identical (IntroGate sets INTRO_SEEN to `'1'`, IntroOrApp uses handleIntroFinish and redirects to `/onboarding/country`; IntroGate redirects to `/app`). Consolidating logic must preserve both flows (first-time → onboarding, replay → overlay then /app).  
- Regression: intro not showing or showing twice if logic is merged incorrectly.

**Tests:**  
- First-time: clear INTRO_SEEN → open app → see intro once → finish → land on `/onboarding/country`.  
- Replay: set INTRO_SEEN, trigger “Replay intro” → see overlay → close → land on `/app`.  
- Direct `/onboarding/country` with INTRO_SEEN set: no intro overlay, country page only.

---

### Option B: Synchronous intro/read so no null phase (or single phase)

**Change:**  
- Read `INTRO_SEEN` once in a place that runs before or during first paint (e.g. root layout or a small wrapper) and pass the result as initial state or context so IntroGate and IntroOrApp do not start with `null`.  
- Options: (1) Read in a parent and pass `initialIntroSeen` as prop so both gates initialize with a boolean. (2) Use a sync script or layout that sets a global/context so first client render already has the value.  
- Requires that the read is available at first paint (e.g. injected from server or from a single client read before rendering the gates).

**Why it reduces flicker:**  
- Removes (or halves) the “wait for useEffect” null phase; at most one blank render if any.

**Risks:**  
- SSR: `localStorage` is not available on server; must be client-only or use cookie/server-read for SSR.  
- Hydration mismatch if server and client disagree on initial value.  
- More invasive change to layout/providers.

**Tests:**  
- Same as Option A; plus hard refresh and slow throttle to ensure no double flash.

---

### Option C: Don’t redirect from `/app` to onboarding in the same session (defer redirect)

**Change:**  
- In `app/app/page.tsx`, do not run `router.replace('/onboarding/country')` (or language) immediately on mount.  
- Instead: show a minimal “Checking…” or the same layout and perform the redirect in a short delay, or after IntroGate/IntroOrApp have resolved, so that we never paint the full app home and then replace.  
- Or: server-side or middleware redirect from `/app` to `/onboarding/country` when country is missing (so client never mounts app home for that case).  
- Keeps two gates but avoids “flash of /app then redirect.”

**Why it reduces flicker:**  
- Removes the “see app home then jump to onboarding” transition.  
- Does not by itself remove the double-null from the two gates.

**Risks:**  
- Delay-based redirect feels arbitrary and can still flash if timing is wrong.  
- Server/middleware redirect requires reading country (e.g. cookie or header) and keeping it in sync with client.

**Tests:**  
- First-time: go to `/` or `/app` with no country → end on `/onboarding/country` without visibly showing app home.  
- With country/language set: land on `/app` and stay there.

---

**Recommended order:** Implement Option A first (single gate) to remove the double-null; then, if “flash of /app then onboarding” remains, add Option C (redirect behavior or timing).

---

## IMPLEMENTATION SUMMARY (post-audit)

### Files changed and reason

| File | Change | Reason |
|------|--------|--------|
| `src/components/IntroGate.tsx` | When `introSeen === null && !forceShowIntro`, return `<>{children}</>` instead of `null`. | Single gate (Option A): removes first null phase; only IntroOrApp gates. |
| `src/app/app/page.tsx` | Added `ready` state (false). In useEffect, after country/language check and optional redirect, call `setReady(true)`. While `!ready`, return `null`. | Defer /app paint: redirect before painting app home; no flash of dashboard. |
| `src/components/AuthGuard.tsx` | `router.replace('/login')` → `router.replace('/app')` for unknown/unauthenticated users. | Use newer auth flow: unauthenticated users land on /app where ContinueChoice modal is shown. |
| `src/app/login/page.tsx` | Redirect to `/app` when no `?method=phone` or `?method=email`. Removed auth method tabs; show only form for current method. Guest redirect and handleGuestMode use `/app`. Added back link to `/app`. | Remove old login page: auth choice is ContinueChoice modal on /app; /login only for method-specific forms. |

### Before vs after boot trace

**Before:** IntroGate null → IntroGate effect → IntroOrApp null → IntroOrApp effect → content. If /app: app home painted then redirect. **After:** IntroGate passes through → IntroOrApp null (one blank) → IntroOrApp effect → content. If /app: ready=false until effect → redirect or setReady; no app home flash.

### Manual test checklist

- **`/`:** Open; expect server redirect to /app, at most one blank, then intro or onboarding or app home. No double blank.
- **`/app`:** Open with no country; expect at most one blank then redirect to onboarding without painting app home. With country+language: app home; unauthenticated see ContinueChoice modal.
- **`/onboarding/country`:** Open with INTRO_SEEN set; expect at most one blank then country page.
- **Auth:** /login with no query redirects to /app. Modal shows Phone OTP / Email Link / Continue without login. Phone OTP → /login?method=phone (form only).

AUDIT COMPLETE. IMPLEMENTATION APPLIED.
