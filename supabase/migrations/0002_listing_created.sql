-- Migration: completeness flag for the offline (qwen + Gemini) listing flow.
-- Run this in the Supabase SQL editor, after 0001_listing_pipeline.sql.
-- I can't execute this myself — run it manually before using the local worker.

-- Nullable on purpose: NULL = "never evaluated yet" (triggers the one-time
-- bootstrap completeness check the first time the local worker sees this
-- row); TRUE/FALSE = already evaluated. New draft rows created by
-- sync-prices are inserted with this explicitly set to false, since a bare
-- shell draft is never complete — see app/api/admin/sync-prices/route.ts.
alter table products
  add column if not exists listing_created boolean;

create index if not exists idx_products_listing_created on products (listing_created);
