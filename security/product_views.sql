-- =====================================================================
-- View tracking — powers "most viewed per category" + per-user recents
-- =====================================================================
-- Additive & idempotent. products.id is TEXT, so product_id is text here.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Global per-product view counter
-- ---------------------------------------------------------------------
create table if not exists public.product_views (
  product_id  text primary key,
  category    text,
  view_count  int  not null default 0,
  last_viewed timestamptz default timezone('utc', now())
);
create index if not exists idx_product_views_cat on public.product_views (category, view_count desc);

alter table public.product_views enable row level security;
-- Anyone may READ counts (needed to render "most viewed"); writes go through
-- the security-definer RPC below only.
drop policy if exists product_views_read on public.product_views;
create policy product_views_read on public.product_views for select using (true);

-- Increment (or create) a product's view count. SECURITY DEFINER so it can
-- write despite RLS. Call from the product page on load.
create or replace function public.increment_product_view(pid text, cat text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_views (product_id, category, view_count, last_viewed)
  values (pid, cat, 1, timezone('utc', now()))
  on conflict (product_id) do update
    set view_count  = product_views.view_count + 1,
        last_viewed = timezone('utc', now()),
        category    = coalesce(excluded.category, product_views.category);
end;
$$;
grant execute on function public.increment_product_view(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Per-user recently-viewed history (cross-device when logged in)
-- ---------------------------------------------------------------------
create table if not exists public.user_views (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  category   text,
  viewed_at  timestamptz default timezone('utc', now()),
  primary key (user_id, product_id)
);
create index if not exists idx_user_views_recent on public.user_views (user_id, viewed_at desc);

alter table public.user_views enable row level security;
-- Each user can only see and write their own history.
drop policy if exists user_views_rw on public.user_views;
create policy user_views_rw on public.user_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
