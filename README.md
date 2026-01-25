# TALLY MVP

Buku akaun digital untuk perniagaan kecil di Malaysia.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Businesses table policies
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- Transactions table policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = transactions.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = transactions.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = transactions.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Add deleted_at column to transactions (for soft delete)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
```

### 4. Configure OTP Provider (OR Use Test Mode)

**Option A: Test Mode (Development Only)**
- In development, you can bypass OTP by entering test codes: `123456`, `000000`, `111111`, `999999`
- The app will create a test user session automatically
- No SMS provider needed for testing

**Option B: Configure Real OTP Provider**
In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Phone provider
3. Configure SMS provider (Twilio, MessageBird, etc.)
4. Set up phone verification settings

**Option C: Configure Test Phone Numbers (Recommended for Testing)**
1. Go to Authentication > Phone Provider
2. Add test phone numbers (e.g., +60123456789)
3. Set test OTP codes for these numbers
4. This allows real OTP flow without SMS costs

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Features

- ✅ Phone OTP Authentication
- ✅ Business Setup Wizard
- ✅ Record Sale/Expense
- ✅ Transaction History
- ✅ Edit/Delete Transactions (with undo)
- ✅ Draft Preservation
- ✅ P&L Report with PDF Export
- ✅ Business Health Check
- ✅ Settings & Profile
- ✅ Dual Language (BM/EN)
- ✅ PWA Support

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the app:

```bash
npm run build
npm start
```

## Notes

- Default language is Bahasa Malaysia
- Transactions are soft-deleted (deleted_at column)
- Drafts are stored in localStorage (24h expiry)
- PWA icons need to be added to `/public/icons/`
