-- =====================================================================
-- Rig Builders — Row Level Security (RLS) policies
-- =====================================================================
--
-- WHY: Admin pages use the PUBLIC anon key and gate themselves only in the
-- browser. Without RLS, anyone with the anon key (it ships in the client
-- bundle) can read/write every table directly — all customer PII included.
-- RLS is the real server-side gate.
--
-- HOW server routes keep working: the SERVICE ROLE key bypasses RLS. Your
-- API routes (/api/payment/verify, /api/admin/sync-prices, blog routes,
-- lib/id-generator) use supabaseAdmin (service role), so they are unaffected.
--
-- ADMIN identity: admin pages run as a logged-in Supabase user, so their JWT
-- carries the admin email. Policies below authorize by that email.
--
-- ⚠️  REVIEW AND TEST BEFORE PRODUCTION. Run on a staging/branch database
--     first, then click through: storefront browsing, add-to-cart, checkout,
--     account > orders/addresses, and every /admin page. A wrong policy can
--     lock out the app. Adjust the admin email / table list to match reality.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: is the current request an admin?
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('rigbuilders123@gmail.com'),
    false
  );
$$;

-- =====================================================================
-- PUBLIC CATALOG — anyone may read; only admins may write
-- =====================================================================
alter table public.products   enable row level security;
alter table public.categories enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (true);

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- REVIEWS — public read; authenticated users write their own; admin all
-- =====================================================================
alter table public.reviews enable row level security;

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- USER-OWNED DATA — each user sees only their own rows; admin sees all
-- =====================================================================
alter table public.user_addresses        enable row level security;
alter table public.saved_configurations  enable row level security;

drop policy if exists addresses_own on public.user_addresses;
create policy addresses_own on public.user_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists addresses_admin on public.user_addresses;
create policy addresses_admin on public.user_addresses
  for select using (public.is_admin());

drop policy if exists saved_cfg_own on public.saved_configurations;
create policy saved_cfg_own on public.saved_configurations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- ORDERS — customers read ONLY their own; admin reads all.
-- Inserts happen via the service role (checkout API), which bypasses RLS,
-- so no public insert policy is granted here.
-- =====================================================================
alter table public.orders enable row level security;

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- ADMIN / OPS TABLES — admin only (service role still bypasses for API).
-- No anon or ordinary-user access at all.
-- =====================================================================
alter table public.orders_ops        enable row level security;
alter table public.order_items       enable row level security;
alter table public.procurement_items enable row level security;
alter table public.finance_ledger    enable row level security;
alter table public.coupons           enable row level security;
alter table public.counters          enable row level security;

drop policy if exists orders_ops_admin on public.orders_ops;
create policy orders_ops_admin on public.orders_ops
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin on public.order_items;
create policy order_items_admin on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists procurement_admin on public.procurement_items;
create policy procurement_admin on public.procurement_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists finance_admin on public.finance_ledger;
create policy finance_admin on public.finance_ledger
  for all using (public.is_admin()) with check (public.is_admin());

-- Coupons: only admin reads the table directly. The storefront never selects
-- this table — it calls validate_coupon(). Make sure that function is defined
-- with SECURITY DEFINER so it can read coupons on behalf of anon users:
--    alter function public.validate_coupon(text, numeric, uuid) security definer;
drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- Counters: used only by the server (id-generator, service role). No policies
-- granted → anon/authenticated get no access; service role bypasses RLS.
-- (RLS enabled above is sufficient to lock it down.)

-- =====================================================================
-- VERIFY
-- =====================================================================
-- Confirm RLS is enabled everywhere it should be:
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--   order by tablename;
--
-- Confirm the anon role cannot read a sensitive table (should return 0 rows
-- or a permission error when run with the anon key):
--   set role anon;  select count(*) from public.orders;  reset role;
-- =====================================================================
