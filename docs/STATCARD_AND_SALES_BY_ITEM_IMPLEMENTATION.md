# StatCard Fix & Sales by Item Implementation

## SECTION 1: StatCard fix (what changed, why, file:line)

### Problem
On the Reports page, StatCard values (RM amounts) were clipped or partially hidden on mobile.

### Root cause (audit)
- **StatCard.tsx L29:** Container had `overflow-x-auto overflow-y-hidden`, which can clip content when the amount is long.
- **StatCard.tsx L31:** Amount used `whitespace-nowrap`, so long amounts could not wrap and were clipped on narrow viewports.
- No responsive font scaling: `text-xl md:text-2xl` was the same on very small screens.

### Changes (file:line)

**src/components/reports/StatCard.tsx**

| Line | Before | After | Why |
|------|--------|-------|-----|
| 29 | `min-w-0 flex-1 overflow-x-auto overflow-y-hidden` | `min-w-0 flex-1 overflow-visible` | Removes vertical clipping and avoids horizontal scroll; amount is no longer clipped. |
| 31 | `text-xl md:text-2xl font-bold tabular-nums whitespace-nowrap` | `text-base sm:text-xl md:text-2xl font-bold tabular-nums break-all` | Responsive font (smaller on mobile); amount can break/wrap if needed so it stays visible. |

### Diff summary
- **L29:** `overflow-x-auto overflow-y-hidden` → `overflow-visible`
- **L31:** `text-xl md:text-2xl` → `text-base sm:text-xl md:text-2xl`, `whitespace-nowrap` → `break-all`

### Validation
- On smallest viewport (e.g. 320px width), long amounts like "RM 1,234,567.89" or "-RM 1,234,567.89" should display fully (wrapping or scaling down) and not be clipped by the card.
- No before/after screenshots were captured in this implementation; recommend capturing manually for regression checks.

---

## SECTION 2: Sales by item (schema source, query changes, aggregation, UI)

### Schema source
- **No** `transaction_items`, `sale_items`, or `line_items` table. Sales are stored as:
  - **transactions:** one row per sale with a single `amount` (total).
  - **inventory_movements:** one row per stock deduction with `item_id`, `transaction_id`, `type: 'sale'`, `quantity_change` (negative for sale).
- Current UX: one sale = one optional stock item (one movement per sale). Schema supports multiple movements per transaction (future multi-item sales); amount is prorated when multiple movements share a transaction.

### Query and data flow
1. **getSaleMovements(businessId)** — **src/lib/inventory-service.ts** (new, after getMovements): returns all `inventory_movements` with `type = 'sale'` for the business (guest: from localStorage; auth: Supabase).
2. **useSaleMovements()** — **src/hooks/useInventory.ts**: hook that calls `getSaleMovements(businessId)` with React Query key `['sale-movements', businessId]`.
3. **useReportsData** — **src/hooks/useReportsData.ts**: uses `useTransactions()`, `useInventory()`, and `useSaleMovements()`. Filters sale movements to those whose `transaction_id` is in the date-filtered sale transactions; aggregates by `item_id` (quantity = sum of |quantity_change|, amount = transaction amount attributed per movement, prorated when multiple movements share a transaction); joins item name from `inventoryItems`; returns `salesByItem: SalesByItemEntry[]` sorted by amount desc.

### Aggregation code (useReportsData.ts)
- **SalesByItemEntry** (L17–22): `{ itemId, itemName, quantity, amount }`.
- **salesByItem** useMemo (L105–141): build `saleIds` from filtered sales; filter `saleMovements` to `transaction_id in saleIds`; count movements per transaction for proration; aggregate by `item_id`: quantity += |quantity_change|, amount += (transaction amount / movements per transaction); map itemId → itemName from inventoryItems; sort by amount descending.

### UI changes
- **src/app/reports/page.tsx:** Destructure `salesByItem` from `useReportsData()` (L24). New block (L79–108): when `salesByItem.length > 0`, render a "Sales by item" card with a table (Item, Qty, Amount). Uses `t('report.salesByItem.title')`, `t('report.salesByItem.item')`, `t('report.salesByItem.qty')`, `t('report.salesByItem.amount')` with fallbacks.
- **src/i18n/locales/en.json:** Added `report.salesByItem.title`, `report.salesByItem.item`, `report.salesByItem.qty`, `report.salesByItem.amount`.

### File:line evidence
- **src/lib/inventory-service.ts:** New `getSaleMovements` after `getMovements` (approx. L296–323).
- **src/hooks/useInventory.ts:** Import `getSaleMovements`; new `useSaleMovements()` using `useBusiness()` and `getSaleMovements(businessId)`.
- **src/hooks/useReportsData.ts:** Import `useInventory`, `useSaleMovements`; extend `SalesByItemEntry` to `itemId`, `itemName`, `quantity`, `amount`; replace previous `salesByItem` (grouped by amount) with aggregation from sale movements + transactions + inventory items.
- **src/app/reports/page.tsx:** Add `salesByItem` to destructuring; add Sales by item table section and i18n keys.

---

## SECTION 3: Manual test log

Run on a mobile viewport or narrow window. Report period for Reports hub is default “this month” (useReportsData with no params).

### StatCard (Business Snapshot)

| Step | Action | Expected | Result (PASS/FAIL) |
|------|--------|----------|---------------------|
| 1 | Open Reports page, mobile width (~375px) | StatCards show Total Revenue, Total Expenses, Net Profit. | _To fill_ |
| 2 | Ensure at least one sale with a large amount (e.g. RM 1234567.89) in current month | Amount is fully visible in the Revenue card, not clipped. | _To fill_ |
| 3 | Resize to very narrow (e.g. 320px) | Amount text scales or wraps; no overflow clip. | _To fill_ |

### Sales by item

| Step | Action | Expected | Result (PASS/FAIL) |
|------|--------|----------|---------------------|
| 1 | Create a sale with “Deduct from stock” enabled, select Item A, Qty 2, Amount RM 100. Save. | Sale and stock movement recorded. | _To fill_ |
| 2 | Create another sale with Item B, Qty 1, Amount RM 50. Save. | Second sale and movement recorded. | _To fill_ |
| 3 | Open Reports page (same month). | “Sales by item” section appears with two rows. | _To fill_ |
| 4 | Check first row (Item A): Qty 2, Amount RM 100. Second row (Item B): Qty 1, Amount RM 50. | Item names, quantities, and amounts match. | _To fill_ |
| 5 | Change system date or use Business Health with custom date range so the above sales are outside the range (e.g. last month). Open Reports; Reports hub uses “this month” by default. | If Reports hub had a date selector for “this month” vs custom, switching to a range that excludes those sales would show no (or different) Sales by item rows. Currently Reports hub has no date selector and uses default month — so for “date range changes results” test, use Business Health or Summary with custom dates to confirm filtering elsewhere; or add a date selector to Reports later. For now: confirm Sales by item only includes sales in the default month. | _To fill_ |

### Notes for tester
- Sales by item only includes sales that have at least one **inventory_movements** row (type `sale`). Sales recorded without “Deduct from stock” do not appear in Sales by item.
- Reports hub uses default start/end (current month). To verify date filtering for Sales by item, you would need a Reports-level date control or open Summary/Health and confirm their date range filters affect their data; Sales by item logic uses the same `filteredTransactions` (date-filtered) and movements whose `transaction_id` is in that set.

---

Implementation complete. Fill in PASS/FAIL after running the manual tests.
