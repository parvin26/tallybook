-- Migration: Add Payment Method fields to transactions table
-- Run this in Supabase SQL Editor

-- Add new columns for payment method tracking
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method: cash, bank_transfer, card, e_wallet';
COMMENT ON COLUMN public.transactions.payment_provider IS 'Provider name (e.g., Maybank, Visa, DuitNow)';
COMMENT ON COLUMN public.transactions.payment_reference IS 'Reference number or last 4 digits';

-- Create index for payment_method queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method 
ON public.transactions(business_id, payment_method) 
WHERE payment_method IS NOT NULL;

-- Migrate existing data: set payment_method based on payment_type for backward compatibility
UPDATE public.transactions
SET payment_method = CASE
  WHEN payment_type = 'cash' THEN 'cash'
  WHEN payment_type = 'bank_transfer' THEN 'bank_transfer'
  WHEN payment_type IN ('duitnow', 'tng', 'boost', 'grabpay', 'shopeepay') THEN 'e_wallet'
  WHEN payment_type = 'credit' THEN 'card'
  ELSE 'cash' -- Default fallback
END
WHERE payment_method IS NULL;
