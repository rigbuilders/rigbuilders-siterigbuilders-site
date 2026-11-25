-- =====================================================================
-- Quotations — saved customer quotations (drafts + finalized)
-- =====================================================================
-- Managed only through admin-authorized API routes (service role bypasses RLS).
-- =====================================================================

create table if not exists public.quotations (
  id            uuid primary key default gen_random_uuid(),
  title         text,
  customer      text,
  valid_until   date,
  status        text not null default 'draft',   -- draft | final
  include_floor boolean not null default false,  -- pricing mode (false = percent only)
  gst_location  text not null default 'punjab',  -- punjab (intra) | outside (inter)
  gst_inclusive boolean not null default false,  -- are the listed prices GST-inclusive?
  delivery      numeric not null default 0,
  data          jsonb,                            -- snapshot of categories/parts
  total         numeric not null default 0,       -- grand total (incl. GST + delivery)
  created_by    uuid,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);
create index if not exists idx_quotations_created on public.quotations (created_at desc);

-- ---------------------------------------------------------------------
-- Customer contact + account linkage (added for the customer dashboard)
-- ---------------------------------------------------------------------
-- `customer` still holds the name (kept for backward-compat). These add the
-- optional contact fields, per-field visibility toggles for the printed quote,
-- the human quotation number (RB-QO-2026-001), and the linkage to the auto-
-- created website account + the customers directory row.
alter table public.quotations add column if not exists quotation_no    text;
alter table public.quotations add column if not exists customer_email   text;
alter table public.quotations add column if not exists customer_phone   text;
alter table public.quotations add column if not exists customer_address text;
alter table public.quotations add column if not exists show_email   boolean not null default true;
alter table public.quotations add column if not exists show_phone   boolean not null default true;
alter table public.quotations add column if not exists show_address boolean not null default true;
alter table public.quotations add column if not exists user_id     uuid;   -- linked auth.users id (customer's website login)
alter table public.quotations add column if not exists customer_id uuid;   -- -> public.customers.id
alter table public.quotations add column if not exists login_email_sent_at timestamptz; -- when the login-link email was sent
alter table public.quotations add column if not exists quote_date date;    -- the date shown on the quotation (editable, incl. finalized)

create unique index if not exists idx_quotations_no on public.quotations (quotation_no) where quotation_no is not null;
create index if not exists idx_quotations_user on public.quotations (user_id);

alter table public.quotations enable row level security;
-- Service-role admin routes bypass RLS (create/update/delete). The only public
-- access is a signed-in customer reading THEIR OWN finalized quotations for the
-- dashboard. Drafts (status <> 'final') stay invisible to customers.
drop policy if exists quotations_owner_select on public.quotations;
create policy quotations_owner_select on public.quotations
  for select
  using ( auth.uid() = user_id and status = 'final' );

-- =====================================================================
-- Customers — a light directory of people we've quoted / sold to.
-- =====================================================================
-- Deduplicated by email. `user_id` links to the website login once one has
-- been auto-created from a finalized quotation. Managed only via service-role
-- admin routes (RLS on, no public policy).
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  phone      text,
  address    text,
  user_id    uuid,                 -- auth.users id, once an account exists
  source     text default 'quotation',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists idx_customers_email on public.customers (lower(email)) where email is not null;
create index if not exists idx_customers_user on public.customers (user_id);

alter table public.customers enable row level security;
-- No public policy: only the service-role admin routes can read/write.

-- =====================================================================
-- Private storage bucket for archived quotation PDFs
-- =====================================================================
-- public = false → nothing is reachable by URL. Only the service-role admin
-- routes upload here; downloads to customers are still generated on demand by
-- /api/quotations/[id]/pdf (ownership-checked). Objects are stored as
-- "<quotation_no>.pdf".
insert into storage.buckets (id, name, public)
values ('quotations', 'quotations', false)
on conflict (id) do nothing;
-- No storage RLS policies needed: the service role bypasses them, and no other
-- role should ever read this bucket directly.
