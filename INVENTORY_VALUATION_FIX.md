# Inventory Valuation Fix - Implementation Summary

## Old Logic Issues

### Problem 1: Incorrect Average Cost Formula
**Location:** `src/app/balance/page.tsx:81`

```typescript
const avgCostPerUnit = totalStockPurchases / (totalStockQuantity + stockPurchases.length)
```

**Why it was wrong:**
- Mixed transaction counts with quantities: `stockPurchases.length` (count) added to `totalStockQuantity` (sum of quantities)
- This creates a mathematically incorrect average that doesn't represent actual unit cost
- Example: If you have 100 units total and 5 purchase transactions, it divides by 105 instead of using actual purchase quantities

### Problem 2: Arbitrary 50% Fallback
**Location:** `src/app/balance/page.tsx:85,93`

```typescript
inventoryValue = totalStockPurchases * 0.5
```

**Why it was wrong:**
- No basis in actual inventory data
- Assumes exactly 50% of purchased stock remains on hand
- Doesn't account for sales, adjustments, or actual quantities
- Makes Balance Sheet unreliable

## New Logic: Last Purchase Cost per Item

### Method Overview
Uses **Last Purchase Cost per Item** - a standard inventory valuation method suitable for MVP that:
- Uses actual purchase transaction data
- Accounts for actual quantities on hand
- Provides explainable, auditable calculations
- Clearly labels estimates when data is missing

### Step-by-Step Calculation

For each inventory item:

1. **Calculate unitsOnHand**
   - Sum all `quantity_delta` values from `inventory_movements` up to as at date
   - Handles both `quantity_delta` (new schema) and `quantity` (old schema) for compatibility
   - If `unitsOnHand <= 0`, inventory value = 0 (skip item)

2. **Find Stock Purchase Transactions**
   - Filter `inventory_movements` where:
     - `movement_type` = 'expense_addition' OR 'restock_add'
     - `related_transaction_id` exists
   - Look up transactions via `related_transaction_id`
   - Filter transactions where `transaction_type = 'expense'` AND `expense_category = 'stock_purchase'`

3. **Sort by Date (Most Recent First)**
   - Sort purchase movements by `transaction.transaction_date` descending

4. **Take Most Recent Purchase**
   - Use the most recent purchase transaction for this item

5. **Calculate unitCost**
   ```typescript
   unitCost = purchaseTransaction.amount / purchaseQuantity
   ```
   - `purchaseQuantity` = absolute value of `movement.quantity_delta` (or `movement.quantity` for old schema)

6. **Calculate itemInventoryValue**
   ```typescript
   itemInventoryValue = unitsOnHand * unitCost
   ```

7. **Sum Across All Items**
   ```typescript
   totalInventoryValue = sum of all itemInventoryValue
   ```

### Edge Cases Handled

- **No purchase record for item:** `isInventoryEstimated = true`, item contributes 0 to total
- **Invalid purchase quantity (0 or negative):** `isInventoryEstimated = true`, item contributes 0 to total
- **unitsOnHand <= 0:** Item contributes 0 to total (no calculation needed)
- **Schema compatibility:** Handles both `quantity_delta`/`occurred_at` (new) and `quantity`/`created_at` (old)

## Manual Override Mechanism

### Storage
- **Key:** `localStorage: tally-inventory-manual-override`
- **Format:** `JSON.stringify({ value: number })`

### Behavior
- Manual override takes precedence over calculated value
- Only affects Balance Sheet display
- Does not propagate to other reports (P&L, Business Health)
- Clearing localStorage reverts to calculated value automatically
- Label changes to "Inventory (Manual)" when override exists

### UI
- Edit icon (pencil) next to inventory label
- Click to set/remove manual value
- Confirmation dialog when removing override
- Helper text shows when manual override is active

## UI Labels and States

### Normal State (All items have purchase costs)
- **Label:** "Inventory"
- **Helper:** None

### Estimated State (Some items lack purchase costs)
- **Label:** "Inventory (Estimated)"
- **Helper:** "Inventory value is estimated until stock purchase costs are recorded."

### Manual Override State
- **Label:** "Inventory (Manual)"
- **Helper:** "This value was manually adjusted."

## Files Changed

1. **src/app/balance/page.tsx**
   - Removed broken calculation logic (lines 66-94)
   - Implemented Last Purchase Cost per Item method
   - Added manual override support
   - Updated UI to show labels and helper text
   - Added Edit icon for manual override

2. **src/i18n/locales/en.json**
   - Added `balance.inventory.*` keys (7 keys)

3. **src/i18n/locales/bm.json**
   - Added `balance.inventory.*` keys (7 keys) - Bahasa Malaysia translations

4. **src/i18n/locales/krio.json**
   - Added `balance.inventory.*` keys (7 keys) - Krio translations

## Verification Checklist

### Balance Sheet Accuracy
- [ ] Balance Sheet balances correctly (Assets = Liabilities + Equity)
- [ ] Inventory value uses actual purchase costs
- [ ] No arbitrary assumptions in calculation
- [ ] Estimates clearly labeled when data missing

### Manual Override
- [ ] Manual override saves to localStorage
- [ ] Override takes precedence over calculated value
- [ ] Removing override reverts to calculated value
- [ ] Label shows "Inventory (Manual)" when override active

### Edge Cases
- [ ] Items with no purchase records show as estimated
- [ ] Items with zero/negative stock contribute 0 to total
- [ ] Schema compatibility works (old and new movement schemas)

### i18n
- [ ] All labels translate correctly in English
- [ ] All labels translate correctly in Bahasa Malaysia
- [ ] All labels translate correctly in Krio
- [ ] No hardcoded text in Balance Sheet UI

## Data Dependencies

### Required Tables
- `inventory_items` - Item master data
- `inventory_movements` - Movement history (with `related_transaction_id`)
- `transactions` - Stock purchase transactions (`expense_category = 'stock_purchase'`)

### Required Fields
- `inventory_movements.quantity_delta` (or `quantity` for old schema)
- `inventory_movements.occurred_at` (or `created_at` for old schema)
- `inventory_movements.movement_type`
- `inventory_movements.related_transaction_id`
- `transactions.amount`
- `transactions.transaction_date`
- `transactions.expense_category`

## Why This Method is Suitable for MVP

1. **Uses Real Data:** Only uses actual purchase transactions and movements
2. **Explainable:** Each calculation step is clear and auditable
3. **No Guessing:** Missing data results in 0 value, not arbitrary estimates
4. **Standard Method:** Last Purchase Cost is a recognized inventory valuation method
5. **Scalable:** Can be enhanced later with FIFO/LIFO without breaking existing logic
