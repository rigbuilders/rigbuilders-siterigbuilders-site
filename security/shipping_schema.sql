-- =====================================================================
-- Blue Dart shipping — schema + scheduled tracking poll
-- =====================================================================
-- Additive. Adds shipment fields to `orders`, an append-only `order_events`
-- timeline, and schedules the tracking poll via pg_cron + pg_net (no Vercel cron).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Shipment fields on orders
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists carrier                text default 'bluedart';
alter table public.orders add column if not exists awb_number             text;      -- Blue Dart tracking number
alter table public.orders add column if not exists label_url              text;      -- shipping-label PDF (data URL or stored path)
alter table public.orders add column if not exists pickup_token           text;      -- Blue Dart pickup confirmation
alter table public.orders add column if not exists pickup_date            date;
alter table public.orders add column if not exists scheduled_dispatch_date date;
alter table public.orders add column if not exists packed_weight_kg       numeric;
alter table public.orders add column if not exists box_dimensions         jsonb;     -- { l, w, h, pieces }
alter table public.orders add column if not exists shipping_status        text;      -- carrier-driven substatus (in_transit, out_for_delivery, delivered, rto)
alter table public.orders add column if not exists tracking_last_synced   timestamptz;
alter table public.orders add column if not exists delivered_at           timestamptz;

-- ---------------------------------------------------------------------
-- 2. order_events — append-only status timeline (admin + carrier)
-- ---------------------------------------------------------------------
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,               -- the stage this event represents
  note       text,                        -- "Picked up from Bathinda hub", scan text, etc.
  source     text default 'system',       -- 'admin' | 'bluedart' | 'system'
  created_at timestamptz default timezone('utc', now())
);
create index if not exists idx_order_events_order on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;
-- Customer can read their own order's events; writes are service-role only (routes/cron).
drop policy if exists order_events_read_own on public.order_events;
create policy order_events_read_own on public.order_events for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_events.order_id   -- qualify: orders also has a text `order_id` column
      and o.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 3. Schedule the tracking poll (pg_cron + pg_net) — runs on Supabase,
--    no Vercel cron needed. Every 3 hours it POSTs the secured endpoint,
--    which polls Blue Dart for all in-transit AWBs and advances statuses.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace <YOUR_SITE> and <SHIPPING_SYNC_SECRET> before running.
select cron.schedule(
  'bluedart-track-sync',
  '0 */3 * * *',                          -- every 3 hours
  $$
  select net.http_post(
    url     := 'https://www.rigbuilders.in/api/shipping/track-sync',
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object('secret','<SHIPPING_SYNC_SECRET>')
  );
  $$
);

-- To change/remove later:
--   select cron.unschedule('bluedart-track-sync');
--   select * from cron.job;
