# Verification: Wrapper/Bottom Nav & Reports Implementation

**Scope:** Confirm what was requested vs implemented for (A) wrapper/footer overlap mitigation and (B) the five report-related items; document test evidence and remaining failures. Verification only; no fixes implemented.

---

## SECTION 1: WHAT WAS REQUESTED VS WHAT WAS DONE

### Table 1: Wrapper and bottom nav changes

| Requested | Implemented (file:line) | Not implemented | Evidence |
|-----------|-------------------------|------------------|----------|
| Reserve space so last content (Save, notes) stays above fixed nav | **Yes.** AppShell `main` has `paddingBottom: calc(88px + env(safe-area-inset-bottom) + 48px)` (AppShell.tsx L7–9, L26–30). BottomNav fixed, height 88px, paddingBottom safe-area (BottomNav.tsx L22–27). Sale/expense content div has `pb-48` and a spacer `div.h-24` after Save (sale L285, L453–454; expense L207, L334–335). | Reserve is only at document end; when user scrolls so Notes/attachments are “in view,” they sit in the same vertical band as the nav and are overlapped. No 100dvh or dedicated “above nav” band. | AppShell.tsx L7–9, L22–30; BottomNav.tsx L8, L22–27; sale/page.tsx L285, L453–454; expense/page.tsx L207, L334–335; globals.css L71–72 (body safe-area). |
| Prevent footer overlapping main content | Same as above. | Overlap still occurs when Attachments and Notes are in view (per WRAPPER_BOTTOM_NAV_AUDIT.md). | As above. |
| Use safe-area insets | **Yes.** Body: `padding-top/bottom: env(safe-area-inset-*)` (globals.css L71–72). Main: safe-area in paddingBottom. BottomNav: `paddingBottom: env(safe-area-inset-bottom)`. | Not verified on real iOS/Android viewport. | globals.css L68–72; AppShell L30; BottomNav L27. |

### Table 2: Reports and related changes

| Requested | Implemented (file:line) | Not implemented | Evidence |
|-----------|-------------------------|------------------|----------|
| 1) StatCard display correction (Summary/Reports snapshot figures) | **Yes.** useReportsData returns `totalRevenue`, `totalExpenses`, `netProfit` as `Number(...) \|\| 0` (useReportsData.ts L132–134). Summary and Reports pass `formatCurrency(safeRevenue)` etc. to StatCard. StatCard accepts `amount: string` and renders it (StatCard.tsx L14–17, L31). | — | useReportsData.ts L129–136; summary/page.tsx L237–254; reports/page.tsx L50–69; StatCard.tsx. |
| 2) Business Health custom date selection | **Yes.** health/page.tsx has `customStartDate`, `customEndDate` state (L37–38), period preset including `custom` (L41–42), date inputs (L381, L385; L449, L453), and passes `queryStartDate`/`queryEndDate` into useReportsData (L56–59). Custom range drives filtering. | — | health/page.tsx L37–42, L52–59, L356, L381–385, L424, L449–453. |
| 3) Sales by category report (and stocks insight) | **Partially.** Summary has “Sales by payment method” (revenueByType) (summary L297–301). useReportsData exposes `salesByItem` but it groups by **transaction amount** (`key = String(t.amount)`), not by category or item (useReportsData.ts L102–111). Reports hub does not render salesByItem or a “Sales by category” section. | A true “sales by category” or “sales by item” using category/item id or name is not implemented. salesByItem is “sales by amount” and is not shown on Reports page. | useReportsData.ts L102–111; reports/page.tsx (no salesByItem usage); summary L154, L297–301 (revenueByType only). |
| 4) Attachments shown in transaction listing | **Yes.** useTransactions fetches with `.select('*, transaction_attachments(*)')` (useTransactions.ts L104). TransactionListLovable renders `transaction.transaction_attachments` with labels and clickable links; uses `getAttachmentUrl(storage_path)` for signed URL or `data_url` for guest (TransactionListLovable.tsx L129–160). | — | useTransactions.ts L54–65 (guest), L104 (supabase); TransactionListLovable.tsx L129–160. |
| 5) Larger logo in header | **Yes.** AppHeader uses `<img src="/icon-192.png" width={60} height={60} ... />` for both logo positions (L45 and L69). | — | AppHeader.tsx L45, L69. |

---

## SECTION 2: TEST EVIDENCE

### Wrapper and bottom nav

- **Automated tests:** None. No `*.test.*` or `*.spec.*` files in the repo.
- **Manual test evidence:** No written manual test report or screenshots found in repo. WRAPPER_BOTTOM_NAV_AUDIT.md states overlap still occurs when Notes/attachments are in view.
- **Conclusion:** No test evidence found that the current layout was validated on real mobile viewport or safe-area conditions.

**Minimal manual test checklist (to run, not executed in this verification):**

1. Record Sale: Open `/sale`, scroll until Attachments block and Notes textarea are in view → PASS if neither is covered by the bottom nav; FAIL if nav overlaps.
2. Record Expense: Same for `/expense`.
3. Keyboard on Notes: Focus Notes field on sale/expense, open virtual keyboard → PASS if input remains visible above nav; FAIL if nav covers input.

### Reports and attachments

- **Automated tests:** None.
- **Manual test evidence:** No test report or commit message cited for StatCard, Health dates, attachments list, or logo.
- **Conclusion:** No test evidence found for the five report-related items.

**Minimal manual test checklist (to run):**

1. StatCard: Open Summary and Reports; confirm Revenue, Expense, Net Profit show numbers (not NaN/blank) and format correctly.
2. Business Health dates: Open Health, set period to Custom, pick start/end dates; confirm numbers and charts update for that range.
3. Sales by category: Reports page has no “Sales by category” section; Summary has “Sales by payment method” only — confirm expected behavior or known gap.
4. Attachments in list: Open History/transaction list; for a transaction with attachments, confirm “Attachments:” and links appear; click link and confirm URL resolves or signed URL works.
5. Logo: Confirm header logo is 60×60 and layout is not broken.

---

## SECTION 3: CURRENT STATUS AND FAILURES

### A. Wrapper / bottom nav (from audit and code)

- **Failure:** Bottom nav still overlaps content when Attachments and Notes are in view.
- **Reproduction:** Mobile (or narrow) viewport → Record Sale or Record Expense → scroll so Attachments block and “Notes (optional)” textarea are visible → tab bar overlaps the notes/attachments area.
- **Reason (from WRAPPER_BOTTOM_NAV_AUDIT.md):** (1) Reserve is at the **end** of the document (main’s paddingBottom + page pb-48 + h-24 spacer). When the user scrolls to bring notes “into view,” notes sit in the same viewport band as the fixed nav. (2) AppShell uses `min-h-screen` (100vh), not dynamic viewport (e.g. 100dvh), so layout height can extend below the visible viewport on mobile. (3) No rule keeps the notes/attachments block a minimum distance above the viewport bottom.
- **Console:** No specific console errors required for this layout issue.

### B. Reports and attachments

- **startOfToday is not defined:** **Fixed.** useReportsData.ts has `import { format, startOfMonth, startOfToday } from 'date-fns'` (L2). Reports page loads without this runtime error.
- **[Attachments] Fetch error {}:** **Fixed.** getTransactionAttachments in src/lib/attachments.ts now logs `{ message, code, details }` (L101–105) and the catch logs `err?.message ?? String(error)` (L111). If Supabase returns an error, the console will show a serializable message instead of `{}`. (Underlying RLS or API errors may still occur; they are now visible.)
- **Sales by category / salesByItem:** **Incorrect semantics.** salesByItem groups by `String(t.amount)` (useReportsData.ts L106), so it is “sales by amount” (e.g. “$10”, “$25”), not by product category or item. Reports hub does not display salesByItem or a “Sales by category” report. Summary shows “Sales by payment method” (revenueByType) only.
- **Attachments in transaction list:** Implementation is correct (fetch includes transaction_attachments; list shows links). If “attachments errors” persist, they are likely (a) getTransactionAttachments used elsewhere failing (e.g. RLS) and now log a clear message, or (b) broken storage_path / signed URL — would need reproduction and console output to diagnose.

---

## SECTION 4: RECOMMENDED NEXT FIXES

Ordered by impact and risk:

1. **Bottom nav overlap (high impact):** Increase effective bottom reserve and/or tie it to the visible viewport. Options from WRAPPER_BOTTOM_NAV_AUDIT.md: (A) Increase main paddingBottom and/or page pb-48 / h-24 so that when notes are in view there is more space below them; (B) Use 100dvh (with fallback) for shell min-height so the “bottom” aligns with visual viewport; (C) On sale/expense, give the form block (attachments + notes + Save + spacer) a minimum bottom margin equal to nav height + safe-area + gap so that block stays above the nav when scrolled into view. Validate on a short mobile viewport (e.g. 600px height).
2. **Sales by category (medium impact):** Either (a) Rename/document salesByItem as “sales by amount” and do not expose as “by category,” or (b) Implement real sales by category/item (e.g. by expense_category, item id, or product name if available in schema) and add a “Sales by category” (or “by item”) section on the Reports page. Depends on data model.
3. **Attachments (lower priority if links work):** If attachment links in the transaction list still fail, verify storage bucket policy and RLS for transaction_attachments and storage; use the new console logging to capture exact error message/code and fix accordingly.

---

VERIFICATION COMPLETE. NO NEW FIXES IMPLEMENTED.
