-- =====================================================================
-- Coupon redemption tracking
-- =====================================================================
-- Adds the columns the checkout now writes so the admin/coupons "Usage" view can
-- show WHO redeemed a code and WHAT they bought. Run once in the Supabase SQL editor.
--
-- Only affects orders placed AFTER this runs (past orders never recorded the coupon).
-- =====================================================================

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric not null default 0;

-- Helps the usage lookup (orders filtered by coupon_code).
create index if not exists idx_orders_coupon_code on public.orders (coupon_code);
