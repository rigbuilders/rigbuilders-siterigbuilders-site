-- =====================================================================
-- message_categories — what an inbound message is about, and what to do
-- =====================================================================
--
-- SAFE TO RE-RUN. Seeds use `on conflict do nothing`, so edits made in the
-- admin panel are never overwritten by re-running this file.
--
-- Applies to EVERY channel — email, WhatsApp, the website widget, and
-- Messenger/Instagram once those go live. One classifier, one set of rules,
-- so a donation request is handled the same way whichever door it comes
-- through.
--
-- THE FOUR FLAGS, which together describe the action:
--   is_silent       no reply at all. Only spam. Still recorded.
--   reply_template  sent verbatim instead of an assistant reply. NULL means
--                   "let the normal flow answer" — used by quotation,
--                   support and order_status, which already have real logic
--                   behind them and would be made worse by a canned line.
--   should_alert    raise a Telegram alert with the heading and a summary.
--   should_handoff  pause the bot on this conversation; a person owns it now.
-- =====================================================================

create table if not exists public.message_categories (
  id uuid primary key default gen_random_uuid(),

  -- Stable identifier the classifier returns. Don't rename once live.
  key text not null unique,
  -- Shown in caps at the top of the Telegram alert.
  heading text not null,
  -- What the model matches against. This IS the classifier's accuracy —
  -- vague descriptions produce vague routing, so be concrete about what
  -- belongs here and what doesn't.
  description text not null,

  reply_template text,
  should_alert boolean not null default false,
  should_handoff boolean not null default false,
  is_silent boolean not null default false,

  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_categories_active
  on public.message_categories (is_active, sort_order);

alter table public.message_categories enable row level security;

insert into public.message_categories
  (key, heading, description, reply_template, should_alert, should_handoff, is_silent, sort_order)
values
  (
    'quotation', 'QUOTATION',
    'Asking for a price, a quote, or a PC build. Includes named parts ("price for a 7800X3D and RTX 5060") and vague builds ("gaming PC under 1 lakh").',
    null, false, false, false, 10
  ),
  (
    'order_status', 'ORDER STATUS',
    'About an order already placed: where it has reached, delivery timing, invoice copy, address change, or cancellation.',
    null, false, false, false, 20
  ),
  (
    'support', 'SUPPORT',
    'An existing customer with a problem: a fault, something not powering on, crashing, overheating, a warranty claim or a replacement part.',
    null, true, true, false, 30
  ),
  (
    'bulk_corporate', 'BULK / CORPORATE',
    'Multiple machines for a company, office, institution or reseller. Any enquiry mentioning quantity, GST invoicing, tenders or procurement.',
    'Thanks for getting in touch. A member of our team will call you shortly to discuss requirements and pricing.',
    true, true, false, 40
  ),
  (
    'collaboration', 'COLLABORATION',
    'Influencers, content creators, YouTubers, journalists and reviewers proposing sponsorship, review units, press coverage or co-marketing.',
    'Thanks for reaching out — we have noted your request and will come back to you shortly.',
    true, false, false, 50
  ),
  (
    'donation', 'DONATION REQUEST',
    'Asking for a free or sponsored PC or parts. Usually students, creators, NGOs or schools describing their situation and requesting help.',
    'Thank you for writing to us, and for sharing what you are working on. We are not running a donation or sponsorship programme at the moment, so we are not able to help with this right now. We have kept your request on file, and if we do start donating systems we will be in touch.',
    false, false, false, 60
  ),
  (
    'supplier_offer', 'SUPPLIER OFFER',
    'A manufacturer, distributor or trader offering to SELL us stock or components, or proposing a supply partnership. Not a customer.',
    'Thank you for the introduction. We have passed this to our purchasing team, who will be in touch if there is a fit.',
    true, false, false, 70
  ),
  (
    'careers', 'JOB APPLICATION',
    'Applying for a job or internship, or sending a CV or portfolio.',
    'Thank you for your interest in Rig Builders. We have received your application and will be in touch if a suitable role opens up.',
    true, false, false, 80
  ),
  (
    'spam', 'SPAM',
    'Unsolicited marketing: SEO services, web design, lead generation, link building, crypto, mass mailshots. Nothing a real customer or supplier would send.',
    null, false, false, true, 90
  ),
  (
    'other', 'UNCATEGORISED',
    'Anything that does not clearly belong to another category. Use this rather than forcing a poor fit.',
    'Thanks for your message — we have received it and someone will get back to you shortly.',
    true, false, false, 100
  )
on conflict (key) do nothing;

do $$
begin
  raise notice 'message_categories: ready.';
end
$$;
