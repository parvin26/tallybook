# Runtime Issues Audit: Reports ReferenceError & Attachments Fetch Error

**Scope:** Audit only. No fixes implemented.

---

## SECTION 1: REPRO STEPS

### ISSUE A: Attachments fetch error

**Steps to reproduce:**
1. Open the app (client-side).
2. Navigate to a transaction that may have attachments (e.g. open a transaction from History, or open Edit Transaction modal for a transaction that has attachments).
3. Either: open the transaction detail page (`/transaction/[id]`) or open the Edit Transaction modal for that transaction.
4. The app calls `getTransactionAttachments(transactionId)` (via React Query in EditTransactionModal or transaction detail page).
5. Open the browser console.

**Expected:** Attachments load and display; if the fetch fails (e.g. RLS, missing table), the console shows a clear error message (e.g. message, code).

**Actual:** Console shows `[Attachments] Fetch error: {}` and the error object appears as `{}`. The function returns `[]`, so the UI shows no attachments instead of crashing.

---

### ISSUE B: Reports runtime ReferenceError

**Steps to reproduce:**
1. Open the app (client-side).
2. Navigate to Reports (e.g. bottom nav → Reports, or route `/reports`).
3. The Reports page (`ReportsHubPage`) renders and calls `useReportsData()` with no arguments.

**Expected:** Reports page renders with Business Snapshot (this month) and StatCards; `useReportsData` defaults to current month via date-fns helpers.

**Actual:** Runtime ReferenceError: **startOfToday is not defined** at `src/hooks/useReportsData.ts (38:17)`. The hook calls `startOfToday()` (and `startOfMonth(today)`, `format(...)`) but never imports these from `date-fns`. The app shows the Next.js error overlay and Reports does not render.

---

## SECTION 2: TRACE AND CODE REFERENCES

### ISSUE A: Attachments fetch

**Call stack (from screenshot):**
- `getTransactionAttachments` @ `src/lib/attachments.ts (101:15)`
- Invoked by React Query `queryFn` from either:
  - `EditTransactionModal` @ `src/components/EditTransactionModal.tsx` L86: `queryFn: () => getTransactionAttachments(transaction.id)`
  - `transaction/[id]/page` @ `src/app/transaction/[id]/page.tsx` L49: `queryFn: () => getTransactionAttachments(transactionId)`

**Inputs at runtime:**
- `transactionId`: string (transaction.id from modal, or route param `transactionId` from detail page).
- No business_id or user_id passed; the Supabase query uses only `.eq('transaction_id', transactionId)`. RLS on `transaction_attachments` (if any) will use the current Supabase auth session.

**Imports in `src/lib/attachments.ts`:**
- `import { supabase } from './supabase/supabaseClient'` (L1). No other imports.

**Implementation (L90–107):**
```ts
export async function getTransactionAttachments(transactionId: string): Promise<TransactionAttachment[]> {
  try {
    const { data, error } = await supabase
      .from('transaction_attachments')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Attachments] Fetch error:', error)  // L101 – logs as {}
      return []
    }
    return (data || []) as TransactionAttachment[]
  } catch (error) {
    console.error('[Attachments] Fetch exception:', error)
    return []
  }
}
```

**Execution environment:** Client-side. Callers are client components (EditTransactionModal, transaction detail page) using React Query; Supabase client runs in the browser. Session availability depends on auth state (guest vs authenticated).

**Why error logs as `{}`:**
- The branch that logs is `if (error)` (L99–101), i.e. Supabase returned a truthy `error` from the `.from().select()` call.
- `console.error('[Attachments] Fetch error:', error)` showing `{}` implies the `error` value, when serialized (e.g. by the devtools or by string interpolation), has no enumerable properties or is an empty object.
- Supabase/Postgrest typically return an error object with `message`, `code`, `details`. Possible causes for `{}`: (1) the object’s useful properties are non-enumerable or getters that don’t serialize; (2) in some edge case (e.g. no session, RLS, or network) the client returns a different error shape; (3) bundler or environment alters the error object.

---

### ISSUE B: Reports ReferenceError

**Call stack (from screenshot):**
- `useReportsData` @ `src/hooks/useReportsData.ts (38:17)` — `const today = startOfToday()`
- `ReportsHubPage` @ `src/app/reports/page.tsx (24:21)` — `useReportsData()`

**Inputs at runtime:**
- `useReportsData()` is called with no arguments, so `params` is `{}`.
- The hook then computes default dates with `startOfToday()`, `startOfMonth(today)`, `format(monthStart, 'yyyy-MM-dd')`, `format(today, 'yyyy-MM-dd')` (L36–41). All of these require `date-fns`; none are imported in the hook file.

**Imports in `src/hooks/useReportsData.ts`:**
- L1: `import { useMemo } from 'react'`
- L2: `import { useTransactions } from './useTransactions'`
- L3: `import type { Transaction } from '@/types'`
- **No import from `date-fns`.** The file uses `startOfToday`, `startOfMonth`, and `format` on L36–41 but they are never imported.

**Imports in `src/app/reports/page.tsx`:**
- L4: `import { format, startOfMonth, startOfToday } from 'date-fns'` — the page correctly imports these for its own use (e.g. L26–27 for header display). The hook is a separate module and does not inherit the page’s imports.

**Execution environment:** Client-side. `src/app/reports/page.tsx` has `'use client'` (L1) and calls `useReportsData()`. The hook uses React hooks (`useMemo`, `useTransactions`) and is only used from client components; it does not need a `"use client"` directive for the ReferenceError. The error is purely missing imports in the hook file.

**Evidence that date-fns is the intended source:** Other files (e.g. `reports/page.tsx`, `health/page.tsx`, `summary/page.tsx`, `DateRangePicker.tsx`) import `startOfToday`, `startOfMonth`, `format` from `'date-fns'`. `package.json` lists `"date-fns": "^3.0.0"`. The hook’s usage pattern matches date-fns API.

---

## SECTION 3: ACTIONS REQUESTED VS ACTIONS DONE

| Requested action | Where requested | Implemented change (file and line) | Not implemented or incomplete | Evidence |
|------------------|-----------------|------------------------------------|-------------------------------|----------|
| useReportsData to support no-arg call and default to “this month” | User message: “useReportsData() with no args”, “default to this month” | In `useReportsData.ts`: default date logic added using `startOfToday()`, `startOfMonth(today)`, `format(monthStart, 'yyyy-MM-dd')`, `format(today, 'yyyy-MM-dd')` (L36–41). | **Missing:** No import of `startOfToday`, `startOfMonth`, or `format` from `date-fns` in the same file. The hook was given the logic but not the imports. | useReportsData.ts L1–3 (imports), L36–41 (usage). |
| Reports page to use newer design and call useReportsData() | User message: Reports page snippet with `useReportsData()` | reports/page.tsx uses `useReportsData()` (L18–24), has `'use client'`, imports date-fns for page-level display (L4, L26–27). | N/A for hook imports; page is correct. Hook file was not updated to add date-fns import when default dates were added. | reports/page.tsx L1, L4, L18–24, L26–27. |
| Attachments: show in transaction listing / edit modal; fetch when needed | Conversation: “Show attachments in TransactionListLovable”, “EditTransactionModal … attachments” | getTransactionAttachments used in EditTransactionModal (L86) and transaction/[id]/page (L49); attachments.ts implements fetch (L90–107), logs error and returns []. | **Incomplete:** Error is caught and logged but the logged value appears as `{}`, so the real cause (RLS, auth, table, network) is not visible. No improvement to error shape logging (e.g. error?.message, error?.code, or JSON.stringify). | attachments.ts L99–101; EditTransactionModal L84–88; transaction/[id]/page L47–51. |
| Attachments: graceful degradation when fetch fails | Implied by returning [] | On `if (error)` and on catch: return [] (L101, L104). | No change to how the error is logged; dev sees `{}` and cannot diagnose. | attachments.ts L99–104, L105–107. |

---

## SECTION 4: ROOT CAUSE ANALYSIS

### ISSUE B: startOfToday is not defined

**1. Missing date-fns import in useReportsData.ts (highest likelihood)**  
- **Evidence:** useReportsData.ts uses `startOfToday()`, `startOfMonth(today)`, `format(monthStart, 'yyyy-MM-dd')`, `format(today, 'yyyy-MM-dd')` on L36–41 and has no import from `date-fns`. The only imports are `useMemo`, `useTransactions`, and `Transaction`. So at runtime `startOfToday` is undefined and the first use throws ReferenceError.  
- **Conclusion:** Root cause is the missing import. Adding `import { format, startOfMonth, startOfToday } from 'date-fns'` to useReportsData.ts would resolve the error.

**2. Import removed or renamed during refactor (possible)**  
- **Evidence:** The default-date logic (paramStart/paramEnd, today, monthStart, startDate, endDate) was added to the hook in a prior change; the same change likely added the use of date-fns helpers but the import line was omitted or lost (e.g. copy-paste from another file that had the import, or merge conflict).  
- **Not proven:** Exact commit or refactor that introduced the logic without the import.

**3. Bundler / Turbopack tree-shaking (low likelihood)**  
- **Evidence:** Tree-shaking would remove unused imports, not define new identifiers. Here `startOfToday` is used but never imported, so it is undefined. No evidence that date-fns was ever imported in this file and then stripped.  
- **Conclusion:** Unlikely; the file simply has no date-fns import.

---

### ISSUE A: [Attachments] Fetch error: {}

**1. Supabase/Postgrest error object does not serialize with enumerable properties (highest likelihood)**  
- **Evidence:** The code path is `if (error) { console.error('[Attachments] Fetch error:', error); return []; }`. So Supabase returned a truthy `error`. In some environments or Postgrest versions, the error object may have `message`/`code` on the prototype or as getters, so when the console or serialization only shows own enumerable properties, it appears as `{}`.  
- **Not proven:** Actual Supabase/Postgrest version and error shape in this project without adding temporary logs (e.g. `error?.message`, `error?.code`, or `JSON.stringify(error)`).

**2. RLS or auth: request rejected with an error that has an unexpected shape (possible)**  
- **Evidence:** getTransactionAttachments only sends `transaction_id`; RLS on `transaction_attachments` (if enabled) will use the current session. If the user is guest or session is missing, the query may fail. The client might return an error object that doesn’t enumerate (e.g. internal representation).  
- **Not proven:** Whether RLS is enabled and what exact error Supabase returns for this query when unauthenticated or unauthorized.

**3. try/catch or caller not swallowing details (low likelihood for “why {}”) **  
- **Evidence:** The `{}` is logged in the `if (error)` branch, not in the catch. So the error is the Supabase-returned `error` value. No code in this file replaces it with `{}`. The “why it logs as {}” is therefore about the shape of that Supabase error, not about swallowing.  
- **Conclusion:** The empty-looking log is due to how the error object is serialized, not due to an empty object being assigned in our code.

---

## SECTION 5: FIX OPTIONS (DO NOT IMPLEMENT)

### ISSUE B: startOfToday is not defined

**Option 1: Add date-fns import to useReportsData.ts**  
- **Change:** In `src/hooks/useReportsData.ts`, add: `import { format, startOfMonth, startOfToday } from 'date-fns'` (e.g. after the existing imports).  
- **Why it fixes:** The hook would then have `startOfToday`, `startOfMonth`, and `format` in scope at L36–41, eliminating the ReferenceError.  
- **Risks:** None expected; date-fns is already used elsewhere.  
- **Test:** Open `/reports` (or navigate to Reports); confirm Reports hub renders with Business Snapshot and StatCards and no runtime error.

**Option 2: Move default date computation to callers**  
- **Change:** Remove default date logic from useReportsData; require callers (e.g. reports/page.tsx) to always pass `startDate` and `endDate`. Reports page already has `startOfToday()` and `startOfMonth(today)`; it would pass `format(monthStart, 'yyyy-MM-dd')` and `format(today, 'yyyy-MM-dd')` into the hook.  
- **Why it fixes:** The hook would no longer use date-fns; the ReferenceError would go away.  
- **Risks:** All call sites must pass dates; summary and health currently pass dates, reports would need to keep building them.  
- **Test:** Same as Option 1; also confirm summary and health still work.

**Option 3: Central “today/month” helper and use it in the hook**  
- **Change:** Add a small helper (e.g. in lib or in the hook file) that returns `{ startDate, endDate }` for “this month” using date-fns, and import that helper in useReportsData so the hook file only imports one symbol.  
- **Why it fixes:** The hook would get default dates without directly calling `startOfToday`/`startOfMonth`/`format`; the helper would have the date-fns import.  
- **Risks:** Slightly more indirection.  
- **Test:** Same as Option 1.

---

### ISSUE A: [Attachments] Fetch error: {}

**Option 1: Log stable error properties in getTransactionAttachments**  
- **Change:** In `src/lib/attachments.ts`, in the `if (error)` block (L99–101), log properties that are typically present on Supabase/Postgrest errors, e.g. `console.error('[Attachments] Fetch error:', { message: error?.message, code: error?.code, details: error?.details })` (or `JSON.stringify` of a small object). Keep `return []`.  
- **Why it helps:** Regardless of whether the error object serializes as `{}`, the log would show message/code/details so the real failure (RLS, auth, table missing, etc.) can be diagnosed.  
- **Risks:** Minimal; only logging.  
- **Test:** Reproduce the fetch failure (e.g. transaction with no session or RLS blocking), open console, confirm the new log shows a meaningful message/code.

**Option 2: Ensure session before calling getTransactionAttachments**  
- **Change:** In callers (EditTransactionModal, transaction/[id]/page), only enable the attachments query when the user is authenticated (or when in guest mode, skip the Supabase fetch and use transaction.transaction_attachments only). So the queryFn is not called when there is no session, avoiding the error path.  
- **Why it helps:** If the failure is due to “no session” or RLS, never calling the API in that case removes the error and the confusing `{}` log.  
- **Risks:** Need to define “when to fetch” clearly (e.g. guest vs auth) and ensure attachments still show from list data when appropriate.  
- **Test:** As guest, open transaction detail or edit modal; confirm no console error and attachments from list data if present. As authenticated user, confirm attachments still load.

**Option 3: Catch and re-log with serializable shape**  
- **Change:** In getTransactionAttachments, in the `if (error)` block, build a plain object, e.g. `const errPayload = { message: error?.message ?? String(error), code: (error as any)?.code }`, then `console.error('[Attachments] Fetch error:', errPayload)`, then `return []`.  
- **Why it helps:** Guarantees the log shows at least a string representation of the error.  
- **Risks:** Minimal.  
- **Test:** Same as Option 1.

---

AUDIT COMPLETE. NO CHANGES IMPLEMENTED.
