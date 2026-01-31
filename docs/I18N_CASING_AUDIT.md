# I18N Casing Audit Report

**Date:** 2026-01-28  
**Scope:** All locale files and in-code UI strings. Casing consistency only; no key renames or business logic changes.  
**Status:** Audit only — no changes have been applied.

---

## SECTION 1: Languages and Coverage

### 1.1 Locale files and codes

| File | Locale code | Language |
|------|-------------|----------|
| `src/i18n/locales/en.json` | `en` | English |
| `src/i18n/locales/bm.json` | `bm` | Bahasa Malaysia |
| `src/i18n/locales/krio.json` | `krio` | Krio |

**Config:** `src/i18n/config.ts` registers `en`, `bm`, `krio` with `fallbackLng: 'en'`.

### 1.2 Coverage and partial implementation

- **en (English):** Reference locale. ~836 lines; full key set. No structural gaps.
- **bm (Bahasa Malaysia):** ~772 lines. Different top-level ordering (e.g. `account` first). Most keys present and translated; some report/onboarding keys may mirror or extend en. **Not partially implemented** — coverage is substantial.
- **krio:** ~727 lines. **Partially implemented.** Large blocks of keys have empty string values (`""`), including:
  - `common.*` (save, cancel, delete, edit, back, next, loading, etc.)
  - `auth.*` (login, phone, email, sendOTP, etc.)
  - `setup.*`, `home.*`, `transaction.*`, and many others
  When a key is empty, the app falls back to English. Casing fixes for krio should apply only to keys that have non-empty values to avoid changing behaviour.

### 1.3 Key count (approximate)

- En and bm: same logical key tree (same screens covered).
- Krio: same key tree; many values empty, so effective “translated” set is smaller.

---

## SECTION 2: Casing Style Guide Adopted

The following rules are used to evaluate and fix casing only (no meaning changes).

### 2.1 Element-type rules

| Element type | Rule | Example |
|--------------|------|--------|
| **A. Page titles and section headers** | **Title Case** | "Business Snapshot", "Transaction History", "Balance Sheet" |
| **B. Button labels** | **Sentence case**, keep short | "Record sale", "Save", "Not now", "Complete setup" |
| **C. Field labels** | **Sentence case** | "Business name", "Starting cash", "Amount" |
| **D. Helper text and descriptions** | **Sentence case** | "Used for Balance Sheet. Set your starting cash and bank balance." |
| **E. Error messages** | **Sentence case**, no shouting, no full uppercase | "Please enter a valid amount", "Couldn't save. Try again." |
| **F. Status badges and tags** | **Sentence case** | "Guest mode", "Not balanced", "Record sale" |

### 2.2 Special rules

- **Currency codes and abbreviations:** Remain uppercase (e.g. USD, RM, NLe, SLE).
- **Proper nouns:** Leave as-is (e.g. Tally, WhatsApp, Supabase, Bahasa Malaysia, Petaling Jaya).
- **Acronyms:** Remain uppercase when they are acronyms (FAQ, OTP, PDF, P&L). Brand "TALLY" can stay as product name.
- **Unit abbreviations:** Lowercase when standard (e.g. kg, g, l, ml, pcs).
- **Do not change meaning:** Only casing and trailing punctuation (if standardized); no rewording.

### 2.3 Inconsistencies to fix

- All-caps phrases that are not acronyms/currency (e.g. "RECORD SALE", "SAVE", "REVENUE", "TOTAL REVENUE").
- Mixed capitalization inside a single sentence.
- Section headers in all caps where Title Case is used elsewhere (e.g. "ASSETS" → "Assets", "TOTAL ASSETS" → "Total Assets").
- Button/CTA text in all caps → Sentence case.

---

## SECTION 3: Findings per Locale

### 3.1 English (en.json)

| Key | Current value | Recommended value | Reason | Screen context |
|-----|----------------|-------------------|--------|----------------|
| `home.recordSale` | `RECORD SALE` | `Record sale` | Button label; Sentence case | Home (main CTAs) |
| `home.recordExpense` | `RECORD EXPENSE` | `Record expense` | Button label; Sentence case | Home (main CTAs) |
| `transaction.save` | `SAVE` | `Save` | Button label; Sentence case | Sale / Expense forms |
| `summary.revenue` | `REVENUE` | `Revenue` | Section header; Title Case | Summary / P&L |
| `summary.expenses` | `EXPENSES` | `Expenses` | Section header; Title Case | Summary / P&L |
| `summary.totalRevenueLabel` | `TOTAL REVENUE` | `Total revenue` | Section subheader; Sentence case preferred for “label” | Summary |
| `summary.totalExpensesLabel` | `TOTAL EXPENSES` | `Total expenses` | Section subheader; Sentence case | Summary |
| `balanceSheet.assets` | `ASSETS` | `Assets` | Section header; Title Case | Balance Sheet (nav/section) |
| `balanceSheet.liabilities` | `LIABILITIES` | `Liabilities` | Section header; Title Case | Balance Sheet |
| `balanceSheet.equity` | `EQUITY` | `Equity` | Section header; Title Case | Balance Sheet |
| `balanceSheet.totalAssets` | `TOTAL ASSETS` | `Total assets` | Section header; Sentence/Title | Balance Sheet |
| `balanceSheet.totalLiabilities` | `TOTAL LIABILITIES` | `Total liabilities` | Section header | Balance Sheet |
| `balanceSheet.totalEquity` | `TOTAL EQUITY` | `Total equity` | Section header | Balance Sheet |
| `report.profitLoss.revenue` | `REVENUE` | `Revenue` | Section header | Reports / P&L |
| `report.profitLoss.expenses` | `EXPENSES` | `Expenses` | Section header | Reports / P&L |
| `transaction.existingFiles` | `Existing Files:` | `Existing files` | Field/section label; colon optional, Sentence case | Edit transaction modal |
| `welcome.getStarted` | `Get Started` | `Get started` | Button; Sentence case | Welcome / onboarding |
| `intro.actions.getStarted` | `Get started` | (no change) | Already sentence case | Intro overlay |
| `onboarding.about.title` | `What TALLY Is` | `What Tally is` | Title; “Tally” as proper noun, rest sentence | Onboarding about |
| `onboarding.language.comingSoon` | `Coming Soon` | `Coming soon` | Status text; Sentence case | Language picker |

**Keep as-is (acronyms / brand / currency):**

- `help.faq` → "FAQ"
- `paymentMethods.tng` → "TNG" (brand)
- Product name "TALLY" in legal/onboarding can stay or be normalized to "Tally" per brand guide.

### 3.2 Bahasa Malaysia (bm.json)

| Key | Current value | Recommended value | Reason | Screen context |
|-----|----------------|-------------------|--------|----------------|
| `auth.invalidPhone` | `masukkan nombor telefon yang sah` | `Masukkan nombor telefon yang sah` | Error message; first word capital (sentence case) | Login / auth |
| `nav` / home CTAs (if used) | — | — | See below for recordSale/recordExpense | — |
| `report.profitLoss.revenue` (or equivalent) | `PENDAPATAN` | `Pendapatan` | Section header; not acronym | Reports |
| `report.profitLoss.expenses` (or equivalent) | `PERBELANJAAN` | `Perbelanjaan` | Section header | Reports |
| `summary.totalRevenueLabel` (or equivalent) | `JUMLAH PENDAPATAN` | `Jumlah pendapatan` | Label; sentence case | Summary |
| `summary.totalExpensesLabel` (or equivalent) | `JUMLAH PERBELANJAAN` | `Jumlah perbelanjaan` | Label; sentence case | Summary |
| `transaction.save` (or equivalent) | `SIMPAN` | `Simpan` | Button; single word, standard capitalisation | Sale/Expense |
| Balance sheet section headers (assets, liabilities, etc.) | e.g. `ASET`, `JUMLAH ASET` | `Aset`, `Jumlah aset` | Section headers; sentence/title style | Balance Sheet |
| `home.recordSale` / `home.recordExpense` (if present) | e.g. `REKOD JUALAN` / `REKOD BELANJA` | `Rekod jualan` / `Rekod belanja` | Button labels; sentence case | Home |

**Note:** BM uses different key structure in places (e.g. `balanceSheet` at top level). Map by key path used in app, not only by en key name.

### 3.3 Krio (krio.json)

- Most keys are empty (`""`); app falls back to en. **No casing changes for empty values.**
- Non-empty values to check for casing (sample):
  - `report.balance.inventory.estimatedLabel`: "Stok (Estimet)" — acceptable; "Estimet" is transliteration.
  - `privacy.heading`, `terms.heading`: "Privacy Policy", "Terms & Conditions" — already consistent.
  - `stock.costPricePerUnit` / `sellingPricePerUnit`: "Cost Price (per unit)" etc. — English copy; if kept, match en casing.
- **Recommendation:** When filling krio translations later, apply the same style guide (sentence case for buttons, fields, errors; title case for page/section titles).

### 3.4 Trailing punctuation (optional)

- In en, some labels use a colon (e.g. "Existing Files:"). Standardise to either "Existing files" or "Existing files:" and mirror in bm/krio where present.
- Toast and error messages: no period vs period (e.g. "Saved" vs "Saved."). Prefer no trailing period for short toasts; one period for full sentences if used consistently.

---

## SECTION 4: Hardcoded Strings Found in Code

Strings that bypass i18n (literal in TS/TSX). Only UI-facing text listed; no env or debug messages.

| File | Line (approx) | String | Notes |
|------|----------------|--------|--------|
| `src/app/balance/page.tsx` | 164 | `'Generating Report...'` | Fallback for toast; should use key only or ensure key exists |
| `src/app/balance/page.tsx` | 192 | `'PDF downloaded'` | Fallback for toast |
| `src/app/balance/page.tsx` | 195 | `"Couldn't download PDF"` | Fallback for error toast |
| `src/app/reports/page.tsx` | 130 (comment) | `"Business Snapshot"` | Comment only; title from i18n |
| `src/app/reports/page.tsx` | 149, 155, 161 | `'Total Revenue'`, `'Total Expenses'`, `'Net Profit'` | Fallbacks for StatCard titles |
| `src/app/reports/page.tsx` | 271, 282 | `'Balance Sheet'`, `'Business Health'` | Fallbacks for link labels |
| `src/app/reports/page.tsx` | 294, 306, 315, 324, 331, 343, 359, 375, 384, 402, 410 | Various period selector and dialog fallbacks | All have t() primary; fallbacks are en literals |
| `src/components/PWAInstallBanner.tsx` | 62, 65, 69, 78, 86 | Install banner title, body, iOS hint, "Not now", "Install" | Fallbacks for pwa.installBanner.* |
| `src/lib/pdf-generator.ts` | 124, 143–145, 167, 191, 193, 228, 240, 260–263, 283 | "Stock Purchase", "Cash Sales", "Total Revenue", "Total Expenses", "Balance Sheet", "Balanced"/"Not Balanced", etc. | PDF content; not using t(). High impact for localized PDFs |
| `src/app/settings/page.tsx` | 59, 63, 65, 72 | `'Home Based Business'`, `'Food Processing'`, `'Services General'`, `'Manufacturing Small Scale'` | Category labels; may be legacy or override |
| `src/app/settings/page.tsx` | 471, 483, 467, 468 | `'Starting Cash'`, `'Starting Bank Balance'`, `'Opening balance'`, openingBalanceHint | Fallbacks for setup/settings |
| `src/components/EditTransactionModal.tsx` | 368 | `'Existing Files:'` | Fallback for transaction.existingFiles |
| `src/app/summary/page.tsx` | 79 | `'Generating Report...'` | Fallback toast |
| `src/app/setup/page.tsx` | 145, 156, 161, 170, etc. | `'Set Up Your Business'`, `'Business Name'`, `'Business Category'`, placeholders, etc. | Multiple fallbacks for setup.* |
| `src/app/onboarding/language/page.tsx` | 137 | `'Coming Soon'` | Fallback for onboarding.language.comingSoon |
| `src/app/about/page.tsx` | 8 | `"About Tally"` | AppShell title hardcoded; should use t() |
| `src/app/login/page.tsx` | 207, 217, 230, 243, 246, 257, 278 | Auth labels and "How it works" | Fallbacks for auth/onboarding |
| `src/app/transaction/[id]/page.tsx` | 123 | `'Transaction ID'` | Label fallback |
| `src/app/contacts/page.tsx` | 70 | `'Gagal menambah kenalan'` | Error toast in BM; should be key + fallback |
| `src/components/ContinueChoice.tsx` | 89, 92, 111 | Continue title, subtitle, "Email Link" | Fallbacks for auth.continueChoice.* and auth.emailSignInLink |
| `src/components/ImageCapture.tsx` | 76 | `'Attached'` | Fallback for transaction.attached |
| `src/components/AuthGuard.tsx` | 165 (comment) | "Preparing Tally…" | Comment; actual UI may use key |
| `src/lib/attachments.ts` | 46, 83, 162 | `'Upload failed'`, `'Save failed'`, `'Delete failed'` | Error returns; user-facing, should be keys or passed from caller |
| `src/lib/inventory.ts` | 146 | `'Unknown error'` | Generic error string |

**Not changed in this audit:** Logic, data, or keys; only documented for later i18n coverage.

---

## SECTION 5: Safe Batch-Fix Plan

### 5.1 Which files

- **Locale files (values only):**
  - `src/i18n/locales/en.json` — apply Section 2 and Section 3.1.
  - `src/i18n/locales/bm.json` — apply Section 3.2 (and 2 where applicable).
  - `src/i18n/locales/krio.json` — only non-empty values; apply same rules when editing.

- **Code (hardcoded strings):** Not part of this audit’s implementation. A separate task can replace literals with `t()` and add keys where missing.

### 5.2 How many strings

- **en.json:** ~20 distinct keys with casing changes (home.recordSale, home.recordExpense, transaction.save, summary.*, balanceSheet.*, report.profitLoss.revenue/expenses, etc.).
- **bm.json:** ~10–15 keys (invalidPhone, balance sheet headers, summary labels, transaction.save, recordSale/recordExpense if present).
- **krio.json:** Only non-empty entries; likely &lt;10 touched if at all.
- **Total (locale-only):** ~35–45 value edits across 3 files.

### 5.3 Risk notes

- **Meaning:** Casing-only edits must not change meaning. E.g. "Record sale" vs "Record Sale" is style only; "Total Revenue" → "Total revenue" is still the same concept.
- **Brand:** "TALLY" vs "Tally" — confirm with product/brand; audit recommends "Tally" in prose, keep "TALLY" only if brand requires it.
- **BM/Krio:** Sentence vs title case in these languages should follow local norms; BM recommendations above are conservative (first word capital for sentences, section headers capitalised).
- **Regression:** After batch fix, run a quick pass on Home, Records, Sale, Expense, Reports, Settings, Onboarding (see checklist below).

### 5.4 Safe edit rules (implementation phase)

- Only modify **translation values**; never rename or restructure keys.
- Prefer **minimal edits** (casing and optional trailing punctuation only).
- **Flag** any string where a casing change could be ambiguous (e.g. "Bank" vs "bank"); document and decide per key.
- **Manual spot checks** on key screens after applying fixes.

### 5.5 Checklist for manual spot checks (after applying fixes)

- [ ] **Home:** Main CTAs ("Record sale", "Record expense"), nav labels, any section headers.
- [ ] **Records / Transaction history:** Headers, filters, empty states, buttons.
- [ ] **Sale:** Form labels, "Save" button, payment/category labels, toasts.
- [ ] **Expense:** Same as Sale.
- [ ] **Reports:** "Business Snapshot", period selector, StatCard titles (Total Revenue, Total Expenses, Net Profit), P&L section headers (Revenue, Expenses), Balance Sheet section headers (Assets, Liabilities, Equity).
- [ ] **Settings:** Section titles, "Opening balance", language/currency labels, Export CSV, Support.
- [ ] **Onboarding:** Language/country screens, "Coming soon", about title, welcome/get started.

---

## Top 20 Highest-Impact Fixes (Summary)

1. **home.recordSale** (en): `RECORD SALE` → `Record sale` — primary Home CTA.
2. **home.recordExpense** (en): `RECORD EXPENSE` → `Record expense` — primary Home CTA.
3. **transaction.save** (en): `SAVE` → `Save` — used on Sale/Expense forms.
4. **summary.revenue** (en): `REVENUE` → `Revenue` — P&L section header.
5. **summary.expenses** (en): `EXPENSES` → `Expenses` — P&L section header.
6. **summary.totalRevenueLabel** (en): `TOTAL REVENUE` → `Total revenue`.
7. **summary.totalExpensesLabel** (en): `TOTAL EXPENSES` → `Total expenses`.
8. **balanceSheet.assets** (en): `ASSETS` → `Assets` — Balance Sheet.
9. **balanceSheet.liabilities** (en): `LIABILITIES` → `Liabilities`.
10. **balanceSheet.equity** (en): `EQUITY` → `Equity`.
11. **balanceSheet.totalAssets** (en): `TOTAL ASSETS` → `Total assets`.
12. **balanceSheet.totalLiabilities** (en): `TOTAL LIABILITIES` → `Total liabilities`.
13. **balanceSheet.totalEquity** (en): `TOTAL EQUITY` → `Total equity`.
14. **report.profitLoss.revenue** (en): `REVENUE` → `Revenue` — Reports/P&L.
15. **report.profitLoss.expenses** (en): `EXPENSES` → `Expenses` — Reports/P&L.
16. **transaction.existingFiles** (en): `Existing Files:` → `Existing files` — Edit transaction modal.
17. **auth.invalidPhone** (bm): `masukkan...` → `Masukkan nombor telefon yang sah` — first word capital for errors.
18. **About page title:** Replace hardcoded `"About Tally"` in `src/app/about/page.tsx` with `t()` (when implementing code changes).
19. **PDF generator:** Localise labels in `src/lib/pdf-generator.ts` (e.g. "Total Revenue", "Balance Sheet") via keys for localized PDFs.
20. **PWA install banner fallbacks:** Ensure `pwa.installBanner.*` keys exist and match casing style; fallbacks in `PWAInstallBanner.tsx` are secondary.

---

**AUDIT COMPLETE. NO CHANGES IMPLEMENTED.**
