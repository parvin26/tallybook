-- T2: Create inventory_movements table
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null,
  quantity numeric not null,
  unit text not null,
  related_transaction_id uuid null,
  notes text null,
  created_at timestamp with time zone default now()
);

-- Create index for faster queries
create index if not exists idx_inventory_movements_item_id
on public.inventory_movements(inventory_item_id);

-- Enable RLS
alter table public.inventory_movements enable row level security;

-- Temporary permissive policy for MVP
create policy "Allow all inventory movements access"
on public.inventory_movements
for all
using (true)
with check (true);
