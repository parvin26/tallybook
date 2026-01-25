-- Complete Inventory Setup for TALLY
-- Run this in Supabase SQL Editor to create/verify inventory tables

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

-- STEP 2: Create inventory_movements table
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  business_id uuid not null,
  movement_type text not null check (movement_type in ('opening', 'adjustment', 'sale_deduction', 'expense_addition', 'manual_adjustment_add', 'manual_adjustment_remove', 'restock_add')),
  quantity_delta numeric not null,
  unit text not null,
  related_transaction_id uuid null,
  notes text null,
  occurred_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- STEP 3: Create indexes for performance
create index if not exists idx_inventory_movements_item_id
on public.inventory_movements(inventory_item_id);

create index if not exists idx_inventory_movements_business_id
on public.inventory_movements(business_id);

create index if not exists idx_inventory_items_business_id
on public.inventory_items(business_id);

-- STEP 4: Enable Row Level Security
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

-- STEP 5: RLS Policies (temporary permissive for MVP)
drop policy if exists "Allow all inventory access" on public.inventory_items;
create policy "Allow all inventory access"
on public.inventory_items
for all
using (true)
with check (true);

drop policy if exists "Allow all inventory movements access" on public.inventory_movements;
create policy "Allow all inventory movements access"
on public.inventory_movements
for all
using (true)
with check (true);

-- STEP 6: Add business_id to inventory_movements if missing (for backward compatibility)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'inventory_movements' 
    and column_name = 'business_id'
  ) then
    alter table public.inventory_movements add column business_id uuid;
    -- Update existing rows (if any) - this will need manual update or migration
    -- For now, leave as null and require business_id going forward
  end if;
end $$;

-- STEP 7: Add occurred_at if missing (for backward compatibility)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'inventory_movements' 
    and column_name = 'occurred_at'
  ) then
    alter table public.inventory_movements add column occurred_at timestamp with time zone default now();
    -- Set occurred_at = created_at for existing rows
    update public.inventory_movements set occurred_at = created_at where occurred_at is null;
  end if;
end $$;

-- STEP 8: Rename quantity to quantity_delta if needed (for backward compatibility)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'inventory_movements' 
    and column_name = 'quantity'
  ) and not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'inventory_movements' 
    and column_name = 'quantity_delta'
  ) then
    alter table public.inventory_movements rename column quantity to quantity_delta;
  end if;
end $$;

-- Note: After running this SQL, refresh the Supabase schema cache in the dashboard
-- The schema cache refresh is important for the TypeScript types to update
