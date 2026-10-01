-- =====================================================================
-- Hero carousel — editable hero slides
-- =====================================================================
-- Additive & idempotent. Backs the homepage HeroCarousel and the
-- /admin/hero editor. Images are LOCAL /public paths (no Storage bucket,
-- per the free-tier constraint) — the editor stores a path string like
-- '/images/homepage/hero/1.jpg'.
--
-- NOTE ON RLS: this table deliberately does NOT enable RLS, matching the
-- existing `categories` CMS pattern so the admin UI (anon client) can read
-- AND write without a separate service-role API. Harden later by enabling
-- RLS (public SELECT of active rows + service-role writes) if desired.
-- =====================================================================

create table if not exists public.hero_slides (
  id             uuid primary key default gen_random_uuid(),
  sort_order     int  not null default 0,
  active         boolean not null default true,

  eyebrow        text,                         -- small line, e.g. "Welcome to"
  heading        text not null default '',     -- main title (white part)
  heading_accent text,                         -- optional part rendered in orange
  subheading     text,

  text_align     text not null default 'left', -- 'left' | 'center' | 'right'

  image_url        text,                       -- local /public path (desktop)
  image_url_mobile text,                        -- optional separate image for phones
  image_position text not null default 'right',-- 'left' | 'right' | 'background'
  image_aspect   text not null default 'portrait', -- 'portrait' | 'landscape' | 'square'
  image_opacity  int  not null default 100,     -- 0..100 image visibility
  location       text not null default 'home',  -- which page's carousel ('home' | 'desktops' | …)

  -- up to two CTAs; alignment inherits text_align
  cta1_label     text,
  cta1_link      text,
  cta1_style     text default 'primary',       -- 'primary' | 'secondary'
  cta2_label     text,
  cta2_link      text,
  cta2_style     text default 'secondary',

  created_at     timestamptz default timezone('utc', now())
);

create index if not exists idx_hero_slides_order on public.hero_slides (active, sort_order);

-- Safe for tables created before these columns existed.
alter table public.hero_slides add column if not exists image_opacity    int  not null default 100;
alter table public.hero_slides add column if not exists location         text not null default 'home';
alter table public.hero_slides add column if not exists image_url_mobile text;
create index if not exists idx_hero_slides_loc on public.hero_slides (location, active, sort_order);

-- ---------------------------------------------------------------------
-- Seed two default slides (only if the table is empty) — mirrors the
-- current split hero so the homepage looks identical until you edit it.
-- ---------------------------------------------------------------------
insert into public.hero_slides
  (sort_order, active, eyebrow, heading, heading_accent, subheading,
   text_align, image_url, image_position, image_aspect, image_opacity,
   cta1_label, cta1_link, cta1_style, cta2_label, cta2_link, cta2_style)
select * from (values
  (10, true, 'Welcome to', 'RIG', 'BUILDERS',
   'Commissioned. Not assembled. Precision custom PCs — built and proven for exactly how you play, create and work.',
   'left', '/images/homepage/hero/1.jpg', 'right', 'portrait', 100,
   'Build Your Rig', '/configure', 'primary', 'Explore Rigs', '/products', 'secondary'),
  (20, true, 'The Flagship', 'SIGNATURE', 'EDITION',
   'Hand-tuned thermals, custom cabling and a documented build log. Our finest commission.',
   'center', '/images/homepage/creator series/3.jpg', 'background', 'landscape', 55,
   'See Signature', '/signature', 'primary', null, null, 'secondary')
) as v
where not exists (select 1 from public.hero_slides where location = 'home');

-- Seed the /desktops carousel (only if it has no slides yet).
insert into public.hero_slides
  (sort_order, active, eyebrow, heading, heading_accent, subheading,
   text_align, image_url, image_position, image_aspect, image_opacity, location,
   cta1_label, cta1_link, cta1_style, cta2_label, cta2_link, cta2_style)
select * from (values
  (10, true, 'Pre-built systems', 'ASCEND', 'SERIES',
   'Elite gaming rigs, tuned frame-by-frame for the resolution you play at.',
   'left', '/images/Desktops/ascend.jpg', 'background', 'landscape', 55, 'desktops',
   'Explore Ascend', '/ascend', 'primary', 'Build Your Own', '/configure', 'secondary'),
  (20, true, 'The Flagship', 'SIGNATURE', 'EDITION',
   'Custom-loop cooling, top-binned silicon and a documented build log.',
   'center', '/images/Desktops/signature.jpg', 'background', 'landscape', 50, 'desktops',
   'See Signature', '/signature', 'primary', null, null, 'secondary')
) as v
where not exists (select 1 from public.hero_slides where location = 'desktops');

-- Seed the /products carousel (only if it has no slides yet).
insert into public.hero_slides
  (sort_order, active, eyebrow, heading, heading_accent, subheading,
   text_align, image_url, image_position, image_aspect, image_opacity, location,
   cta1_label, cta1_link, cta1_style, cta2_label, cta2_link, cta2_style)
select * from (values
  (10, true, 'Component ecosystem', 'BUILD', 'BLOCKS',
   'Every part vetted, warrantied and insured. Choose a category and start engineering your machine.',
   'left', '/images/homepage/hero/1.jpg', 'background', 'landscape', 55, 'products',
   'Start a Build', '/configure', 'primary', null, null, 'secondary'),
  (20, true, 'Precision hardware', 'PURE', 'PERFORMANCE',
   'Processors, graphics, memory and more — sourced for reliability, priced without the markup.',
   'center', '/images/homepage/creator series/3.jpg', 'background', 'landscape', 50, 'products',
   'Talk to a Builder', '/contact', 'primary', null, null, 'secondary')
) as v
where not exists (select 1 from public.hero_slides where location = 'products');

-- Seed the /accessories carousel (only if it has no slides yet).
insert into public.hero_slides
  (sort_order, active, eyebrow, heading, heading_accent, subheading,
   text_align, image_url, image_position, image_aspect, image_opacity, location,
   cta1_label, cta1_link, cta1_style, cta2_label, cta2_link, cta2_style)
select * from (values
  (10, true, 'Peripheral armory', 'YOUR', 'BATTLESTATION',
   'Displays, input and storage — chosen to match the machines we commission.',
   'left', '/images/Accessories/monitorv2.jpg', 'background', 'landscape', 55, 'accessories',
   'Shop Accessories', '/accessories', 'primary', null, null, 'secondary'),
  (20, true, 'Precision input', 'FEEL', 'EVERY FRAME',
   'Esports-grade sensors and mechanical switches, tuned for reaction time.',
   'center', '/images/Accessories/keyboardv2.jpg', 'background', 'landscape', 50, 'accessories',
   'Browse Gear', '/accessories', 'primary', null, null, 'secondary')
) as v
where not exists (select 1 from public.hero_slides where location = 'accessories');
