-- =============================================================================
-- Audit Hardening Migration (DESTRUCTIVE — run in Supabase SQL Editor)
-- MVP schema cleanup: transactions, constraints, RLS, single-business.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SIMPLIFY TRANSACTIONS (Problems #1, #2, #4)
-- -----------------------------------------------------------------------------

-- 1a. transaction_type: only 'sale' or 'expense'
--     Migrate out-of-scope values, then enforce.
UPDATE public.transactions
SET transaction_type = 'sale'
WHERE transaction_type = 'payment_received';

UPDATE public.transactions
SET transaction_type = 'expense'
WHERE transaction_type = 'payment_made';

-- Enforce enum via check (works for text column; if you use pg enum, recreate it)
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_transaction_type_check
  CHECK (transaction_type IN ('sale', 'expense'));

-- 1b. Payment: keep only payment_method + payment_reference
--     Ensure payment_method exists, then backfill from payment_type where needed
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method text;

UPDATE public.transactions
SET payment_method = COALESCE(payment_method,
  CASE
    WHEN payment_type = 'cash' THEN 'cash'
    WHEN payment_type = 'bank_transfer' THEN 'bank_transfer'
    WHEN payment_type IN ('duitnow', 'tng', 'boost', 'grabpay', 'shopeepay') THEN 'e_wallet'
    WHEN payment_type = 'credit' THEN 'card'
    ELSE 'other'
  END)
WHERE payment_method IS NULL AND payment_type IS NOT NULL;

UPDATE public.transactions
SET payment_method = 'cash'
WHERE payment_method IS NULL;

-- Enforce payment_method enum
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'e_wallet', 'other'));

-- Remove old payment columns
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS payment_type,
  DROP COLUMN IF EXISTS payment_provider;

-- 1c. Hard deletes: remove deleted_at
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS deleted_at;

-- -----------------------------------------------------------------------------
-- 2. CRITICAL CONSTRAINTS (Problem #6)
-- -----------------------------------------------------------------------------

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS amount_positive,
  DROP CONSTRAINT IF EXISTS valid_date,
  DROP CONSTRAINT IF EXISTS expense_category_logic;

ALTER TABLE public.transactions
  ADD CONSTRAINT amount_positive CHECK (amount > 0),
  ADD CONSTRAINT valid_date CHECK (
    transaction_date >= '2020-01-01'::date
    AND transaction_date <= (CURRENT_DATE + 365)
  ),
  ADD CONSTRAINT expense_category_logic CHECK (
    (transaction_type <> 'expense') OR (expense_category IS NOT NULL)
  );

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (Problem #15)
--    Ownership = business_id in a business owned by auth.uid()
-- -----------------------------------------------------------------------------

-- Helper: true if the user owns the business for the given business_id
-- We use a security definer function so policies can reference it cleanly,
-- or we use a subquery in each policy. Using subquery avoids new functions.

-- TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
-- Legacy permissive policies (if any)
DROP POLICY IF EXISTS "Allow all" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.transactions;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- INVENTORY_ITEMS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inventory access" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_select_own" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert_own" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_update_own" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete_own" ON public.inventory_items;

CREATE POLICY "inventory_items_select_own"
  ON public.inventory_items FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_items_insert_own"
  ON public.inventory_items FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_items_update_own"
  ON public.inventory_items FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_items_delete_own"
  ON public.inventory_items FOR DELETE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- INVENTORY_MOVEMENTS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inventory movements access" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_select_own" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_insert_own" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_update_own" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_delete_own" ON public.inventory_movements;

CREATE POLICY "inventory_movements_select_own"
  ON public.inventory_movements FOR SELECT
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_movements_insert_own"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_movements_update_own"
  ON public.inventory_movements FOR UPDATE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_movements_delete_own"
  ON public.inventory_movements FOR DELETE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 4. SINGLE BUSINESS CONSTRAINT (Problem #14)
--    One user = one business for MVP
-- -----------------------------------------------------------------------------

-- Fails if any user has more than one business; resolve duplicates before running.
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_user_id_key;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_user_id_key UNIQUE (user_id);

-- -----------------------------------------------------------------------------
-- DONE
-- -----------------------------------------------------------------------------
-- After running:
-- - Update app code to use payment_method (and payment_reference) only;
--   remove references to payment_type, payment_provider, deleted_at.
-- - Ensure transaction_type is only 'sale' | 'expense' in types and UI.
-- - Types in src/types/index.ts should match this schema.
-- =============================================================================
