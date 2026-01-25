-- STEP 1: Create inventory_items table
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  quantity numeric not null default 0,
  unit text not null,
  low_stock_threshold numeric null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- STEP 2: Enable Row Level Security
alter table public.inventory_items enable row level security;

-- STEP 3: RLS Policy for MVP (temporary - allow all access)
create policy "Allow all inventory access"
on public.inventory_items
for all
using (true)
with check (true);

-- Note: After running this SQL, refresh the Supabase schema cache in the dashboard
