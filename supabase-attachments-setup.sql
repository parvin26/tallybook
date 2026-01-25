-- Complete Attachments Setup for TALLY
-- Run this in Supabase SQL Editor to create attachments infrastructure

-- STEP 1: Create transaction_attachments table
create table if not exists public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  business_id uuid not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamp with time zone default now()
);

-- STEP 2: Create indexes for performance
create index if not exists idx_transaction_attachments_transaction_id
on public.transaction_attachments(transaction_id);

create index if not exists idx_transaction_attachments_business_id
on public.transaction_attachments(business_id);

-- STEP 3: Enable Row Level Security
alter table public.transaction_attachments enable row level security;

-- STEP 4: RLS Policy (temporary permissive for MVP)
drop policy if exists "Allow all transaction attachments access" on public.transaction_attachments;
create policy "Allow all transaction attachments access"
on public.transaction_attachments
for all
using (true)
with check (true);

-- STEP 5: Create Storage Bucket (if not exists)
-- Note: This must be run in Supabase Dashboard > Storage > Create Bucket
-- Bucket name: tally-attachments
-- Public: false (private bucket)
-- File size limit: 10MB (or as needed)
-- Allowed MIME types: image/*, application/pdf, etc.

-- After creating the bucket, set up storage policies:
-- Policy 1: Allow authenticated users to upload
-- Policy 2: Allow authenticated users to read their own files
-- Policy 3: Allow authenticated users to delete their own files

-- Note: After running this SQL, refresh the Supabase schema cache in the dashboard
