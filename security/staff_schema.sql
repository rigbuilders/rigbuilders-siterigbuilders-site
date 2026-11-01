-- =====================================================================
-- Staff — assemblers / packagers for the thank-you note signature
-- =====================================================================
-- Additive. A small roster so the thank-you note's "assembled/packaged by"
-- name can be selected from a dropdown (and grow over time). Managed through
-- an admin-authorized API route (service role bypasses RLS).
-- =====================================================================

create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null default 'both',   -- assembler | packager | both
  active     boolean not null default true,
  created_at timestamptz default timezone('utc', now())
);

-- Plain unique on name so the admin API can upsert on conflict (name).
create unique index if not exists uq_staff_name on public.staff (name);

-- Seed the current team member (only if the table is empty).
insert into public.staff (name, role)
select 'Guninder Singh', 'both'
where not exists (select 1 from public.staff);

alter table public.staff enable row level security;
-- No public policy → only service-role (admin API routes) can read/write.
