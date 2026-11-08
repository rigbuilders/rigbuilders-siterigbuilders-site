-- =====================================================================
-- Per-distributor product scoping (brand / category / individual product)
-- =====================================================================
-- Lets you restrict what each distributor sees and can price. Enforcement is
-- in the DATABASE (view + the write function), never the app — a distributor
-- querying the view directly still only gets their allowed rows.
--
-- DENY-BY-DEFAULT, but this migration SEEDS every existing distributor with a
-- 'all' grant in the same transaction, so nobody goes dark when it is applied.
-- A distributor with NO scope rows sees nothing. (The admin "add distributor"
-- flow also creates an 'all' row by default — restrict from there.)
--
-- Safe to run in one session. Idempotent where practical.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Scope table
-- ---------------------------------------------------------------------
create table if not exists public.distributor_scope (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.distributor_users(user_id) on delete cascade,
  scope_type  text not null check (scope_type in ('all','category','brand','product')),
  category    text,       -- set when scope_type = 'category'
  brand       text,       -- set when scope_type = 'brand'
  product_id  uuid,       -- set when scope_type = 'product'
  created_at  timestamptz not null default now()
);
create index if not exists idx_distributor_scope_user on public.distributor_scope (user_id);

alter table public.distributor_scope enable row level security;
-- Distributors may read their own grants (optional/transparency). All writes
-- happen through the admin API with the service role (which bypasses RLS).
drop policy if exists distributor_scope_self on public.distributor_scope;
create policy distributor_scope_self on public.distributor_scope
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. Visibility helper — does the CURRENT distributor see this product?
--    SECURITY DEFINER so it can read distributor_scope from inside the view
--    (which runs as owner) and from the write function.
-- ---------------------------------------------------------------------
create or replace function public.distributor_sees_product(
  p_id uuid, p_category text, p_brand text
) returns boolean
  language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from distributor_scope s
    where s.user_id = auth.uid()
      and (
        s.scope_type = 'all'
        or (s.scope_type = 'category' and s.category = p_category)
        or (s.scope_type = 'brand'    and s.brand    = p_brand)
        or (s.scope_type = 'product'  and s.product_id = p_id)
      )
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Re-scope the view (same columns — only the WHERE changes)
-- ---------------------------------------------------------------------
create or replace view public.distributor_products as
  select id,
         coalesce(breadcrumb_name, name) as display_name,
         nickname, category, brand, image_url, mrp, distributor_price, in_stock
    from products p
   where is_distributor()
     and public.distributor_sees_product(p.id, p.category, p.brand);

-- ---------------------------------------------------------------------
-- 4. Enforce scope on the write path too (unchanged logic + a scope check)
-- ---------------------------------------------------------------------
create or replace function public.distributor_update_price(
  p_id uuid, p_distributor_price numeric, p_in_stock boolean
) returns void
  language plpgsql security definer set search_path to 'public'
as $$
declare
  old_price numeric;
  old_stock boolean;
  v_cat text;
  v_brand text;
begin
  if not is_distributor() then
    raise exception 'Not authorised';
  end if;
  if p_distributor_price is null or p_distributor_price <= 0 then
    raise exception 'Price must be greater than zero';
  end if;

  select distributor_price, in_stock, category, brand
    into old_price, old_stock, v_cat, v_brand
    from products where id = p_id;
  if not found then
    raise exception 'No such product';
  end if;

  -- NEW: a scoped distributor can only price products inside their scope.
  if not distributor_sees_product(p_id, v_cat, v_brand) then
    raise exception 'Not authorised for this product';
  end if;

  update products
     set distributor_price = p_distributor_price,
         in_stock = coalesce(p_in_stock, in_stock)
   where id = p_id;

  insert into distributor_price_log
    (product_id, changed_by, old_price, new_price, old_in_stock, new_in_stock)
  values
    (p_id, auth.uid(), old_price, p_distributor_price, old_stock, p_in_stock);
end;
$$;

-- ---------------------------------------------------------------------
-- 5. When a scoped distributor adds a product, grant them access to it so it
--    doesn't vanish from their own portal. (No-op for 'all' distributors.)
-- ---------------------------------------------------------------------
create or replace function public.distributor_add_product(
  p_nickname text, p_category text, p_distributor_price numeric, p_mrp numeric DEFAULT NULL::numeric
) returns uuid
  language plpgsql security definer set search_path to 'public'
as $$
declare
  new_id uuid;
begin
  if not is_distributor() then
    raise exception 'Not authorised';
  end if;
  if coalesce(trim(p_nickname), '') = '' then
    raise exception 'A nickname is required';
  end if;

  insert into products
    (nickname, name, category, brand, price, mrp, distributor_price,
     in_stock, listing_status, listing_created, auto_generated, generated_notes)
  values
    (trim(p_nickname), trim(p_nickname), p_category, '', 0, p_mrp,
     p_distributor_price, true, 'draft', 'false', false,
     'added by a distributor — needs research')
  returning id into new_id;

  if not exists (
    select 1 from distributor_scope
    where user_id = auth.uid()
      and (scope_type = 'all' or (scope_type = 'product' and product_id = new_id))
  ) then
    insert into distributor_scope (user_id, scope_type, product_id)
    values (auth.uid(), 'product', new_id);
  end if;

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. SEED: every existing distributor gets full access (no dark screens)
-- ---------------------------------------------------------------------
insert into public.distributor_scope (user_id, scope_type)
select du.user_id, 'all'
  from public.distributor_users du
 where not exists (select 1 from public.distributor_scope s where s.user_id = du.user_id);

commit;

-- Verify: every distributor should have at least one scope row.
-- select du.email, count(s.id) as scope_rows
--   from distributor_users du left join distributor_scope s on s.user_id = du.user_id
--  group by du.email;
