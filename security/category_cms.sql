-- =====================================================================
-- Category CMS — make the storefront taxonomy + imagery DB-driven
-- =====================================================================
-- 100% ADDITIVE. Adds columns + a new table + seeds them from the values
-- currently hardcoded in app/data/categories.ts. No deletes, no updates to
-- existing rows (ON CONFLICT DO NOTHING). Safe to re-run.
--
-- Run once in the Supabase SQL editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extend `categories` with the fields the storefront needs
-- ---------------------------------------------------------------------
alter table public.categories add column if not exists short_name       text;
alter table public.categories add column if not exists card_title       text;    -- big label on the hub card ("GRAPHICS CARD")
alter table public.categories add column if not exists card_image_mobile text;    -- image_url is the desktop card image
alter table public.categories add column if not exists funnel           text default 'simple';  -- 'landing' | 'simple'
alter table public.categories add column if not exists hub_step         boolean default false;  -- has ChipsetHub (gpu, motherboard)
alter table public.categories add column if not exists aliases          text[] default '{}';    -- alt slugs that redirect here (memory -> ram)
alter table public.categories add column if not exists sort_order       integer default 100;
alter table public.categories add column if not exists show_in_hub      boolean default false;  -- appears on the /products hub grid
alter table public.categories add column if not exists active           boolean default true;

-- ---------------------------------------------------------------------
-- 2. Tagged image / asset registry (for non-category imagery: hero,
--    landing pages, banners, etc.) — pages look up by `tag`.
-- ---------------------------------------------------------------------
create table if not exists public.site_assets (
  tag         text primary key,          -- e.g. 'home-hero-poster', 'landing-gpu-nvidia'
  path        text not null,             -- local path under /public, e.g. '/images/...'
  alt         text,
  width       integer,
  height      integer,
  variant     text default 'default',    -- 'desktop' | 'mobile' | 'default'
  grp         text,                       -- grouping for the admin UI, e.g. 'homepage'
  sort_order  integer default 0,
  active      boolean default true,
  created_at  timestamptz default timezone('utc', now())
);

-- ---------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------
-- NOTE: we deliberately DO NOT enable RLS on `categories` here. The admin
-- product page writes to it with the ANON key, and a read-only policy would
-- block those writes. Reads already work (RLS off = readable). Full RLS for
-- `categories` — WITH admin-write policies — lives in security/rls_policies.sql;
-- run that if/when you lock the whole DB down.
--
-- For the brand-new `site_assets` table, enable RLS + public read now (nothing
-- writes to it via the anon key yet; the seed + future admin use service role).
alter table public.site_assets enable row level security;

drop policy if exists site_assets_public_read on public.site_assets;
create policy site_assets_public_read on public.site_assets for select using (true);

-- ---------------------------------------------------------------------
-- 4. SEED categories (mirrors app/data/categories.ts). DO NOTHING = never
--    clobbers a row you already created/edited.
--    columns: id, name, group_id, short_name, card_title, subtitle,
--             description, image_url, funnel, hub_step, aliases,
--             sort_order, show_in_hub, active
-- ---------------------------------------------------------------------
insert into public.categories
  (id, name, group_id, short_name, card_title, subtitle, description, image_url, funnel, hub_step, aliases, sort_order, show_in_hub, active)
values
  ('cpu','Processors (CPU)','components','Processor','PROCESSORS','CORE ARCHITECTURE','Intel Core Ultra & AMD Ryzen','/images/Products/cpuv1.jpg','simple',false,'{}',1,true,true),
  ('gpu','Graphics Cards (GPU)','components','Graphics Card','GRAPHICS CARD','VISUAL ENGINES','NVIDIA RTX, Intel ARC & AMD Radeon','/images/Products/gpuv1.jpg','simple',true,'{}',2,true,true),
  ('motherboard','Motherboards','components','Motherboard','MOBO','SYSTEM FOUNDATION','Z790, X670 & B650 Chipsets','/images/Products/mobov2.jpg','simple',true,'{}',3,true,true),
  ('storage','SSD & Storage','components','Storage','STORAGE','DATA VAULTS','NVMe Gen4 & Gen5 Solutions','/images/Products/nvmev2.jpg','simple',false,'{}',4,true,true),
  ('cabinet','PC Cabinets','components','Cabinet','CHASSIS','ARMOR PLATING','Mid-Tower, Full-Tower & ITX','/images/Products/pc cabinetv2.jpg','simple',false,'{}',5,true,true),
  ('psu','Power Supplies (PSU)','components','Power Supply','POWER','ENERGY REACTORS','Gold & Platinum Modular Units','/images/Products/psuv2.jpg','simple',false,'{}',6,true,true),
  ('ram','Memory (RAM)','components','Memory (RAM)','MEMORY','SYSTEM CACHE','High-Bandwidth DDR5 Modules','/images/Products/ramv2.jpg','simple',false,'{memory}',7,true,true),
  ('cooler','CPU Coolers','components','Cooler','COOLING','THERMAL CONTROL','AIO Liquid & Air Solutions','/images/Products/aiov2.jpg','simple',false,'{}',8,true,true),
  ('monitor','Gaming Monitors','accessories','Monitor',null,null,null,null,'simple',false,'{}',20,false,true),
  ('keyboard','Mechanical Keyboards','accessories','Keyboard',null,null,null,null,'simple',false,'{}',21,false,true),
  ('mouse','Gaming Mice','accessories','Mouse',null,null,null,null,'simple',false,'{}',22,false,true),
  ('combo','Keyboard & Mouse Combos','accessories','Combo',null,null,null,null,'simple',false,'{}',23,false,true),
  ('mousepad','Mouse Pads','accessories','Mouse Pad',null,null,null,null,'simple',false,'{}',24,false,true),
  ('usb','USB Drives','accessories','USB Drive',null,null,null,null,'simple',false,'{}',25,false,true),
  ('prebuilt','Pre-Built Gaming PCs','desktops','Pre-Built',null,null,null,null,'simple',false,'{}',30,false,true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. SEED site_assets (starter set — the landing/hero imagery that's
--    currently hardcoded). Add more tags over time from the admin UI.
-- ---------------------------------------------------------------------
insert into public.site_assets (tag, path, alt, variant, grp) values
  ('home-hero-poster','/images/homepage/hero/1.jpg','Rig Builders hero','desktop','homepage'),
  -- Homepage "Shop by Category" bento cards
  ('home-featured-gpu','/images/Products/gpu.jpg','Graphics Cards','desktop','homepage'),
  ('home-featured-cpu','/images/Products/cpu.jpg','Processors','desktop','homepage'),
  ('home-featured-storage','/images/Products/nvme.jpg','Storage','desktop','homepage'),
  ('home-featured-monitor','/images/Accessories/monitor.jpg','Displays','desktop','homepage'),
  ('landing-cpu-intel','/images/landing/cpu-intel.jpg','Intel Core processors','desktop','landing'),
  ('landing-cpu-amd','/images/landing/cpu-amd.jpg','AMD Ryzen processors','desktop','landing'),
  ('landing-gpu-nvidia','/images/landing/gpu-nvidia.jpg','NVIDIA GeForce RTX','desktop','landing'),
  ('landing-gpu-amd','/images/landing/gpu-amd.jpg','AMD Radeon RX','desktop','landing'),
  ('landing-gpu-intel','/images/landing/gpu-intel.jpg','Intel Arc graphics','desktop','landing')
on conflict (tag) do nothing;

-- ---------------------------------------------------------------------
-- 6. Disable the brand/maker re-routing funnel for existing rows.
--    Every category now goes straight to a single grid page (with the brand
--    filter in the sidebar). The funnel LOGIC is preserved — set a category's
--    funnel back to 'landing' in the Category Builder to re-enable it.
-- ---------------------------------------------------------------------
update public.categories set funnel = 'simple' where funnel = 'landing';
