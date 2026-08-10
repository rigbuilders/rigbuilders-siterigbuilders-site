-- Migration: draft/publish pipeline for auto-generated listings
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- I can't execute this myself — no direct DB access from this session — so
-- please run it manually before testing the new admin pages.

-- 1. New columns on products. Existing rows all get 'published' automatically
--    (Postgres backfills the DEFAULT for existing rows on ADD COLUMN), so
--    nothing currently live changes visibility.
alter table products
  add column if not exists listing_status text not null default 'published',
  add column if not exists generated_confidence text,
  add column if not exists generated_notes text,
  add column if not exists auto_generated boolean not null default false,
  add column if not exists published_at timestamptz;

-- Keep listing_status to known values only.
alter table products
  drop constraint if exists products_listing_status_check;
alter table products
  add constraint products_listing_status_check
  check (listing_status in ('draft', 'needs_review', 'published'));

-- Index for the drafts queue query (WHERE listing_status IN (...) ORDER BY created_at DESC).
create index if not exists idx_products_listing_status on products (listing_status);

-- 2. Category checkpoints — the manually maintained row-boundary map for the
--    price register (Stage 1). One row per section header in the sheet.
--    end_row is optional: leave null to mean "runs until the next checkpoint,
--    or end of sheet if it's the last one" (matches how the boundary map was
--    designed — see LISTING-WORKFLOW-BLUEPRINT.md Section 2).
create table if not exists category_checkpoints (
  id uuid primary key default gen_random_uuid(),
  category text not null,       -- must match a category id in constants.ts (cpu, gpu, ram, storage, motherboard, ...)
  start_row integer not null,
  end_row integer,              -- nullable — see comment above
  label text,                   -- optional human note, e.g. "CPU (top of sheet, no heading)"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_checkpoints_start_row on category_checkpoints (start_row);
create index if not exists idx_checkpoints_category on category_checkpoints (category);

-- Seed with the boundaries confirmed by the sheet audit (Aug 2026). Row
-- numbers WILL drift as the sheet is edited — update this table by hand via
-- the /admin/products/checkpoints page when that happens, per the blueprint.
insert into category_checkpoints (category, start_row, label) values
  ('cpu', 2, 'Un-headed block at top of sheet'),
  ('storage', 10, null),
  ('ram', 17, null),
  ('motherboard', 30, null),
  ('cpu', 53, 'Second CPU block, has its own header'),
  ('gpu', 105, null),
  ('cooler', 140, null),
  ('cabinet', 165, null),
  ('psu', 182, null),
  ('combo', 208, 'Keyboard Mouse Combo'),
  ('monitor', 233, null),
  ('usb', 271, 'Adaptors — confirm this maps to usb, see blueprint open items')
on conflict (start_row) do nothing;
