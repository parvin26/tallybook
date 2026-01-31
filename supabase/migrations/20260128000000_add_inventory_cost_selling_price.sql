-- Add cost_price and selling_price to inventory_items for stock valuation and sale pre-fill.
-- Run in Supabase SQL Editor or via Supabase CLI.

alter table public.inventory_items
  add column if not exists cost_price numeric not null default 0,
  add column if not exists selling_price numeric not null default 0;

comment on column public.inventory_items.cost_price is 'Cost per unit (buy price) for balance sheet stock value';
comment on column public.inventory_items.selling_price is 'Selling price per unit for sale amount pre-fill';
