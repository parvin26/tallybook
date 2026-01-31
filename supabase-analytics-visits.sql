-- Analytics visits: Session Start tracking before onboarding (MVP).
-- Allows anonymous inserts for traffic-source analysis (Malaysia, Sierra Leone, Timor Leste, Kenya).
-- Run in Supabase SQL Editor.

create table if not exists public.analytics_visits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text null,
  timezone text null,
  browser_lang text null,
  created_at timestamptz default now()
);

create index if not exists idx_analytics_visits_created_at
  on public.analytics_visits(created_at);

-- Allow anonymous inserts for pre-onboarding tracking (no auth required)
alter table public.analytics_visits enable row level security;

drop policy if exists "Allow anonymous insert for visits" on public.analytics_visits;
create policy "Allow anonymous insert for visits"
  on public.analytics_visits for insert
  with check (true);

-- No select/update/delete for anon (optional: add service-role only read later)
drop policy if exists "Allow anon read visits" on public.analytics_visits;
