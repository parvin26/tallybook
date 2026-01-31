# Implementation and Test Audit: Report Fixes and Related Items

**Scope:** Evidence-based confirmation of what was implemented vs not done, and whether tests were performed. No new fixes implemented.

---

## SECTION 1: IMPLEMENTATION STATUS TABLE

| Item | Status | Evidence (file path and line numbers) | Notes / Mismatches |
|------|--------|--------------------------------------|--------------------|
| **1. Fix StatCard display in Summary / Reports snapshot figures** | **Partially implemented** | **Summary:** `src/app/summary/page.tsx` L69–72: `safeRevenue`, `safeExpenses`, `safeProfit`, `safeMargin` = `Number(...) \|\| 0`. L237–259: StatCard receives `amount={formatCurrency(safeRevenue)}` (and same for expense, profit). Profit margin in Card L255–258: `safeMargin.toFixed(1)}%`. **StatCard:** `src/components/reports/StatCard.tsx` L14–15: expects `amount: string`, `title: string`; L31: renders `{amount}`. **Reports:** `src/app/reports/page.tsx` L18–24 calls `useReportsData()` with no args; L26–29 builds `safeRevenue/safeExpenses/safeProfit`; L52–68 passes `formatCurrency(safe*)` to StatCard. | Summary page: calculations and formatting are correct; StatCard receives formatted strings. **Reports page never loads** because `useReportsData()` runs inside the hook which calls `startOfToday()` at L36 of `useReportsData.ts` but **the hook has no import from date-fns** (see Section 3). So Reports throws ReferenceError before StatCards render. |
| **2. Add custom date selection to Business Health** | **Implemented** | `src/app/health/page.tsx` L17: `PeriodPreset` includes `'custom'`. L36–37: `customStartDate`, `customEndDate` state. L39–45: `getDateRange()` returns `{ start: new Date(customStartDate), end: new Date(customEndDate) }` when `periodPreset === 'custom' && customStartDate && customEndDate`. L51–52: `queryStartDate`, `queryEndDate` from `format(periodStart, 'yyyy-MM-dd')`, `format(periodEnd, 'yyyy-MM-dd')`. L55–58: `useReportsData({ startDate: queryStartDate, endDate: queryEndDate })`. L362–375: Custom button and date inputs (Start date, End date) when `isCustom`. | Matches proposed behavior: date inputs exist, range is passed into useReportsData and drives filtering. Health page builds dates itself (uses date-fns) and passes params, so it does not hit the missing import in the hook. |
| **3. Include Sales by Category report (and stocks insight)** | **Partially implemented** | **Summary:** `src/app/summary/page.tsx` L296–323: "Sales by payment method" section using `revenueByTypeEntries` (from `revenueByType`), progress bars and percentages. **Hook:** `src/hooks/useReportsData.ts` L99–108: `salesByItem` groups by `String(t.amount)` (key = amount value), not by category or item id/name. L127–138: return includes `salesByItem`. **Reports page:** `src/app/reports/page.tsx` has no section that renders `revenueByType` or `salesByItem`; only StatCards, ExpensePieChart, and Detailed Reports buttons. | "Sales by payment method" exists on Summary and uses correct key (payment method via `revenueByType`). "Sales by Category" (by product category or stock item) is not implemented: `salesByItem` uses **amount** as key (L104: `const key = String(t.amount)`), so it groups by sale amount, not category/item. No UI on Reports hub for sales breakdown. No stock/item-based report. |
| **4. Show attachments in transaction listing** | **Implemented** | **Fetch:** `src/hooks/useTransactions.ts` L104: `.select('*, transaction_attachments(*)')`; guest path L54–65 maps `t.attachments` to `transaction_attachments`. **Listing:** `src/components/TransactionListLovable.tsx` L128–161: when `transaction.transaction_attachments?.length > 0`, renders "Attachments:" and maps each attachment to a link; uses `getAttachmentUrl(attachment.storage_path)` for auth (on click) or `attachment.data_url` for guest; `href={attachment.data_url ?? '#'}`; click handler prevents row navigation, fetches signed URL when no data_url. | Transaction list fetch includes attachments (join in Supabase, mapping in guest). Listing shows filenames and links; auth path uses getAttachmentUrl (no raw storage_path exposed). Attachments **fetch error** in console (`[Attachments] Fetch error: {}`) comes from `getTransactionAttachments` in EditTransactionModal/transaction detail page, not from the list data source. |
| **5. Make logo larger in header** | **Implemented** | `src/components/AppHeader.tsx` L44 and L68: `<img src="/icon-192.png" width={60} height={60} alt="Tally" className="mr-2 rounded-md" />`. | Logo is 60×60 (was 32, then 44). No layout break observed in code (header has flex, fixed widths for left/right areas). |

---

## SECTION 2: TEST STATUS

| Item | Tested? | Evidence of testing | If not tested: minimal manual test and outcome |
|------|---------|---------------------|-------------------------------------------------|
| **1. StatCard / Summary figures** | **No** | No test files found (0 `*.test.*`, 0 `*.spec.*` in repo). No manual test notes, screenshots, or commit messages found in scope. | **Manual test:** (1) Open Summary with date range that has transactions. (2) Confirm StatCards show numeric values (not NaN or empty). (3) Confirm profit margin shows one decimal. **Outcome:** Summary works when visited; Reports does not load (ReferenceError). |
| **2. Business Health custom date** | **No** | No automated or documented manual test. | **Manual test:** (1) Open Business Health. (2) Click "Custom". (3) Pick start and end dates. (4) Confirm insights and copy update for that range. **Outcome:** Not run in this audit; implementation is present. |
| **3. Sales by Category** | **No** | No test. | **Manual test:** (1) Summary: confirm "Sales by payment method" section shows when there are sales. (2) Reports: no sales section exists; salesByItem is not rendered. **Outcome:** Summary section works; Reports has no sales breakdown; salesByItem key is wrong (amount not category). |
| **4. Attachments in transaction listing** | **No** | No test. | **Manual test:** (1) Ensure transactions are fetched with `transaction_attachments` (auth: Supabase join; guest: storage). (2) Open History or app home with recent transactions. (3) Confirm transactions with attachments show "Attachments:" and filename(s). (4) Click filename: auth should open signed URL; guest data_url. **Outcome:** Not run; implementation is present. Opening edit modal/detail can still log `[Attachments] Fetch error: {}` from getTransactionAttachments. |
| **5. Logo in header** | **No** | No test. | **Manual test:** (1) Open any page with AppHeader (e.g. Reports, Settings). (2) Confirm logo is visibly larger and layout is intact. **Outcome:** Not run; code shows 60×60. |

**Repo test coverage:** No `*.test.*` or `*.spec.*` files found; no evidence of automated tests for these features. No manual test checklist or screenshot evidence found in the audited files or docs.

---

## SECTION 3: CURRENT FAILURES STILL PRESENT

| # | Issue | Exact steps to reproduce | Console / stack | Suspected cause and code reference |
|---|--------|----------------------------|------------------|-------------------------------------|
| **1** | **Reports page crash** | (1) Open app. (2) Navigate to Reports (e.g. bottom nav → Reports, or `/reports`). | **Runtime ReferenceError: startOfToday is not defined** at `src/hooks/useReportsData.ts (38:17)`. Call stack: useReportsData → ReportsHubPage `src/app/reports/page.tsx (24:21)`. | **Missing import:** `useReportsData.ts` uses `startOfToday()`, `startOfMonth(today)`, `format(monthStart, 'yyyy-MM-dd')`, `format(today, 'yyyy-MM-dd')` on L36–41 but has **no import from `date-fns`**. Only imports: `useMemo`, `useTransactions`, `Transaction`. So `startOfToday` is undefined at runtime. |
| **2** | **Attachments fetch error in console** | (1) Open app (authenticated). (2) Open a transaction (detail page or Edit Transaction modal). | **Console error:** `[Attachments] Fetch error: {}` at `src/lib/attachments.ts (101:15)` in `getTransactionAttachments`. | Supabase query returns truthy `error`; when logged, the error object serializes as `{}` (no enumerable properties or different shape). Code path: L99–101 `if (error) { console.error(..., error); return []; }`. Suspected: RLS/session or Postgrest error shape. |
| **3** | **Incorrect / misleading “Sales by Item” data** | (1) Use Summary or any consumer of `salesByItem`. | No crash; data is grouped by **amount** not by category/item. | `useReportsData.ts` L102–105: `const key = String(t.amount)`; so `salesByItem` groups sales by numeric amount (e.g. all 10.00 sales together). Not by product category or stock item. Transaction type has no `item_id` or product category in the audited schema. |

---

## SECTION 4: NEXT ACTIONS

Ordered by impact and risk (highest impact, lowest risk first):

1. **Fix Reports crash (useReportsData missing date-fns import)**  
   - **Change:** In `src/hooks/useReportsData.ts`, add: `import { format, startOfMonth, startOfToday } from 'date-fns'`.  
   - **Why:** Removes ReferenceError so Reports page loads; StatCards and snapshot figures can then render.  
   - **Risk:** Low.  
   - **Verify:** Open `/reports`; page loads and shows Business Snapshot and StatCards.

2. **Improve attachments fetch error visibility**  
   - **Change:** In `src/lib/attachments.ts`, in the `if (error)` block, log a serializable shape, e.g. `console.error('[Attachments] Fetch error:', { message: error?.message, code: (error as any)?.code })` (or equivalent).  
   - **Why:** So the real failure (RLS, auth, table) can be diagnosed instead of `{}`.  
   - **Risk:** Low (logging only).  
   - **Verify:** Reproduce fetch failure; console shows message/code.

3. **Fix or remove salesByItem grouping key**  
   - **Change:** Either (a) rename/document as “sales by amount” and use only for amount-based insight, or (b) group by a valid dimension (e.g. payment_method for “sales by payment” is already `revenueByType` on Summary). If “Sales by Category” means product/stock, add item/category to transaction model and hook.  
   - **Why:** Avoids misleading “by item” report that is actually by amount.  
   - **Risk:** Depends on option; (a) is low.  
   - **Verify:** Summary “Sales by payment method” unchanged; any new sales report uses the intended key.

4. **Add minimal manual test checklist**  
   - **Change:** Add a short checklist (e.g. in docs or README) for: Reports loads; Summary figures and margin; Health custom date; Attachments in list and link behavior; Logo size.  
   - **Why:** Ensures future changes are validated.  
   - **Risk:** None.  
   - **Verify:** Run through checklist after any of the above fixes.

5. **Optional: Add automated tests**  
   - **Change:** e.g. one test that imports `useReportsData` with mocked useTransactions and asserts default date range and numeric outputs.  
   - **Why:** Prevents regressions like missing imports.  
   - **Risk:** Low if tests are isolated and mocked.  
   - **Verify:** `npm test` (or project test command) passes.

---

AUDIT COMPLETE. NO NEW FIXES IMPLEMENTED.
