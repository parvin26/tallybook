# P0 Execution Plan: Payment Method Schema & Onboarding Authority

## Step 2: Payment Method Schema Verification

### Verification Checklist

#### 1. Check Production Supabase Schema

Run this SQL query in Supabase SQL Editor (Production):

```sql
-- Check if payment method columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('payment_method', 'payment_provider', 'payment_reference')
ORDER BY column_name;
```

**Expected Result:**
- If columns exist: Returns 3 rows (payment_method, payment_provider, payment_reference)
- If columns missing: Returns 0 rows

#### 2. If Columns Missing: Apply Migration

**File to use:** `supabase-expense-payment-method-migration.sql`

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase-expense-payment-method-migration.sql`
3. Run in production database
4. Verify with query from step 1

#### 3. Verify Migration Success

Run this query to check existing data:

```sql
-- Check if any transactions have payment_method set
SELECT 
  COUNT(*) as total_transactions,
  COUNT(payment_method) as transactions_with_payment_method,
  COUNT(payment_provider) as transactions_with_provider,
  COUNT(payment_reference) as transactions_with_reference
FROM transactions;
```

**Expected Result:**
- `transactions_with_payment_method` should match `total_transactions` (migration backfills)
- Or be 0 if no transactions exist yet

#### 4. Test Expense Recording in Production Preview

**Test Steps:**
1. Deploy current code to Vercel preview
2. Login to production Supabase account
3. Navigate to `/expense`
4. Record an expense with:
   - Payment Method: Bank Transfer
   - Provider: "Maybank"
   - Reference: "1234"
5. Check Supabase `transactions` table
6. Verify row has:
   - `payment_method = 'bank_transfer'`
   - `payment_provider = 'Maybank'`
   - `payment_reference = '1234'`

**Success Criteria:**
- ✅ No errors in browser console
- ✅ No errors in Vercel function logs
- ✅ Transaction saved with all three fields populated

---

## Step 3: Onboarding Authority Consolidation

### Decision: Remove OnboardingOverlay

**Rationale:**
- Welcome modal (`/welcome`) already handles first-time user orientation
- OnboardingOverlay creates duplicate logic and inconsistent state
- Linear onboarding pages (`/onboarding/*`) handle country/language/preferences
- Single source of truth reduces bugs

### Implementation Plan

#### Phase 1: Disable OnboardingOverlay (Safe)

**File:** `src/app/page.tsx`

**Change:**
```typescript
// REMOVE this line:
<OnboardingOverlay />

// OR comment it out:
// <OnboardingOverlay />
```

**Verification:**
- [ ] Home page loads without overlay
- [ ] Onboarding flow still works via `/onboarding/country`
- [ ] Welcome modal still shows after onboarding

#### Phase 2: Remove OnboardingOverlay Component (After Phase 1 Verified)

**Files to modify:**
1. `src/app/page.tsx` - Remove import and usage
2. `src/components/OnboardingOverlay.tsx` - Delete file (or keep for reference)

**Verification:**
- [ ] App builds without errors
- [ ] No references to OnboardingOverlay in codebase
- [ ] Onboarding flow works end-to-end

#### Phase 3: Clean Up Overlay Storage Keys (Optional)

**Storage keys used by OnboardingOverlay:**
- `tally_onboarding_completed` - Still used by AuthGuard, keep it
- `tally_intro_seen_session` - Only used by overlay, can be removed from code

**Files to check:**
- `src/components/AuthGuard.tsx` - Uses `tally_onboarding_completed` (keep)
- `src/app/onboarding/start/page.tsx` - Sets `tally_onboarding_completed` (keep)
- `src/components/OnboardingOverlay.tsx` - Uses both (will be deleted)

**Action:** No code changes needed, keys will naturally become unused

---

## Verification Checklist for Both Steps

### After Step 2 (Payment Method Schema):
- [ ] Migration SQL run in production Supabase
- [ ] Columns verified with SQL query
- [ ] One expense recorded successfully in production preview
- [ ] Payment method fields saved correctly

### After Step 3 (Onboarding Authority):
- [ ] OnboardingOverlay removed from home page
- [ ] Onboarding flow works: `/onboarding/country` → `/onboarding/language` → `/onboarding/about` → `/onboarding/start` → `/`
- [ ] Welcome modal shows after onboarding completion
- [ ] No duplicate onboarding prompts
- [ ] AuthGuard still enforces onboarding completion check

---

## Rollback Plan

### If Payment Method Migration Fails:
1. Check Supabase logs for error
2. Verify table permissions
3. Run migration in test database first
4. Check for existing column conflicts

### If Onboarding Removal Breaks Flow:
1. Re-enable OnboardingOverlay in `src/app/page.tsx`
2. Investigate which step failed
3. Check AuthGuard redirect logic
4. Verify localStorage keys are set correctly

---

## Next Steps After P0 Resolution

Once both P0 issues are verified:

1. **P1 Regressions** (Debug code, translations)
2. **P2 Data Correctness** (Inventory valuation, sales payment_method)
3. **P3 Polish** (PWA install, telemetry consent)

Do not proceed to P1 until P0 is fully verified in production.
