-- Step 2: Payment Method Schema Verification Queries
-- Run these in Supabase SQL Editor (Production)

-- Query 1: Check if payment method columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name IN ('payment_method', 'payment_provider', 'payment_reference')
ORDER BY column_name;

-- Expected result if columns exist:
-- payment_method | text | YES | null
-- payment_provider | text | YES | null
-- payment_reference | text | YES | null

-- Query 2: Check existing transaction data
SELECT 
  COUNT(*) as total_transactions,
  COUNT(payment_method) as transactions_with_payment_method,
  COUNT(payment_provider) as transactions_with_provider,
  COUNT(payment_reference) as transactions_with_reference,
  COUNT(DISTINCT payment_method) as unique_payment_methods
FROM public.transactions;

-- Query 3: Sample transactions to verify data
SELECT 
  id,
  transaction_type,
  payment_type,
  payment_method,
  payment_provider,
  payment_reference,
  amount,
  transaction_date
FROM public.transactions
ORDER BY created_at DESC
LIMIT 10;

-- Query 4: Verify index exists (optional, for performance)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
  AND indexname = 'idx_transactions_payment_method';
