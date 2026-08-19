-- Run this once in the Supabase SQL editor (same project as everything else
-- under lib/chatbot/*). Two independent things:
--
-- 1. A "watched numbers" list — the mirror-image of chatbot_excluded_numbers.
--    Excluded numbers never get an auto-reply; watched numbers do get one as
--    normal, but ALSO trigger an admin email the moment they message,
--    regardless of keyword content (unlike the handoff-keyword alert, which
--    only fires when the customer's own words look like a handoff request).
--
-- 2. RLS + Realtime publication for chatbot_conversations and
--    chatbot_messages — needed so the admin inbox (app/admin/chatbot) can
--    subscribe to live Postgres changes with the anon-key browser client
--    instead of only refreshing on a manual button click. Supabase Realtime
--    enforces RLS on the subscribing connection, so without a SELECT policy
--    here the subscription would silently receive nothing. Scoped tightly to
--    the single admin account already hardcoded client-side in
--    app/admin/chatbot/page.tsx (ADMIN_EMAIL) — every other read/write to
--    these tables already goes through supabaseAdmin (service role) in the
--    Next.js API routes, which bypasses RLS entirely, so this policy only
--    matters for the new realtime path.
--
-- If you ever add a second admin account, update BOTH this policy and
-- ADMIN_EMAILS (used server-side by lib/adminAuth.ts) — they're not linked.

create table if not exists chatbot_watched_numbers (
  id uuid primary key default uuid_generate_v4(),
  channel text not null,              -- 'whatsapp' | 'instagram' | 'messenger' | 'website'
  external_user_id text not null,     -- platform-specific id (WhatsApp: phone number, no '+')
  label text,                         -- optional note, e.g. "VIP customer" / "supplier"
  created_at timestamptz not null default now(),
  unique (channel, external_user_id)
);

alter table chatbot_watched_numbers enable row level security;
-- No policies added on purpose — same as chatbot_excluded_numbers, this
-- stays service-role-only (via supabaseAdmin in the admin API routes).

alter table chatbot_conversations enable row level security;
alter table chatbot_messages enable row level security;

drop policy if exists "Admin can read conversations" on chatbot_conversations;
create policy "Admin can read conversations" on chatbot_conversations
  for select
  using (auth.jwt() ->> 'email' = 'rigbuilders123@gmail.com');

drop policy if exists "Admin can read messages" on chatbot_messages;
create policy "Admin can read messages" on chatbot_messages
  for select
  using (auth.jwt() ->> 'email' = 'rigbuilders123@gmail.com');

-- Enable Postgres Changes for these two tables (idempotent-ish: Supabase
-- errors if a table's already in the publication, so ignore that specific
-- error if you're re-running this).
alter publication supabase_realtime add table chatbot_conversations;
alter publication supabase_realtime add table chatbot_messages;
