-- Inventory Module — Ledger Principle (Single Source of Truth)
-- Run in Supabase SQL Editor. Ensures "Ghost Stock" cannot happen via backend trigger.
--
-- Tables:
--   inventory_items: id (uuid), business_id, name, quantity (default 0), unit, low_stock_threshold
--   inventory_movements: id (uuid), item_id (fk), business_id, type ('sale'|'restock'|'adjustment'),
--                       quantity_change (numeric), transaction_id (fk nullable), created_at
--
-- Trigger: On INSERT into inventory_movements, update inventory_items.quantity:
--   - type 'sale'       → subtract (app passes negative quantity_change)
--   - type 'restock'    → add (app passes positive quantity_change)
--   - type 'adjustment' → add or subtract (app passes signed quantity_change)

-- =============================================================================
-- 1. inventory_items
-- =============================================================================
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

create index if not exists idx_inventory_items_business_id
  on public.inventory_items(business_id);

-- =============================================================================
-- 2. inventory_movements
-- =============================================================================
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  business_id uuid not null,
  type text not null check (type in ('sale', 'restock', 'adjustment')),
  quantity_change numeric not null,
  transaction_id uuid null references public.transactions(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_inventory_movements_item_id
  on public.inventory_movements(item_id);
create index if not exists idx_inventory_movements_business_id
  on public.inventory_movements(business_id);
create index if not exists idx_inventory_movements_transaction_id
  on public.inventory_movements(transaction_id);

-- =============================================================================
-- 3. TRIGGER: auto-update inventory_items.quantity on movement insert
--    sale       → subtract (quantity_change is negative)
--    restock    → add (quantity_change is positive)
--    adjustment → add/subtract (quantity_change is signed)
-- =============================================================================
create or replace function public.sync_inventory_quantity_on_movement()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.inventory_items
  set
    quantity = quantity + NEW.quantity_change,
    updated_at = now()
  where id = NEW.item_id;
  return NEW;
end;
$$;

drop trigger if exists trg_inventory_movement_sync_quantity on public.inventory_movements;
create trigger trg_inventory_movement_sync_quantity
  after insert on public.inventory_movements
  for each row
  execute function public.sync_inventory_quantity_on_movement();

-- =============================================================================
-- 4. RLS (permissive for MVP; tighten by business_id in production)
-- =============================================================================
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Allow all inventory access" on public.inventory_items;
create policy "Allow all inventory access"
  on public.inventory_items for all using (true) with check (true);

drop policy if exists "Allow all inventory movements access" on public.inventory_movements;
create policy "Allow all inventory movements access"
  on public.inventory_movements for all using (true) with check (true);
