-- =====================================================================
-- chatbot_excluded_numbers — missing table
-- =====================================================================
--
-- WHY: lib/chatbot/exclusions.ts (isExcluded/listExcluded/addExcluded/
-- removeExcluded) and app/api/admin/chatbot/excluded-numbers/route.ts have
-- always assumed this table exists, but it was never actually created in
-- Supabase. Every inbound chatbot message calls isExcluded() before
-- replying, so every single message was hitting:
--
--   [chatbot:exclusions] lookup failed: Could not find the table
--   'public.chatbot_excluded_numbers' in the schema cache
--
-- isExcluded() fails closed (treats the error as "not excluded" and lets
-- the bot reply anyway — see the comment in exclusions.ts), so this wasn't
-- breaking replies, just silently no-op'ing the entire exclusions feature
-- and adding a failed query + log line to every message. Run this once in
-- the Supabase SQL editor to fix it.
--
-- Columns/conventions match the other chatbot_* tables (see
-- lib/chatbot/conversation-store.ts): uuid primary key, timestamptz,
-- snake_case columns matching exclusions.ts's ExcludedRow interface exactly.
-- =====================================================================

create table if not exists public.chatbot_excluded_numbers (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  external_user_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (channel, external_user_id)
);

-- Only ever accessed via supabaseAdmin (service role, bypasses RLS) — see
-- lib/chatbot/exclusions.ts and app/api/admin/chatbot/excluded-numbers/route.ts,
-- which itself gates on requireAdmin(). RLS here just blocks the public
-- anon key from reading/writing this table directly, same posture as the
-- rest of security/rls_policies.sql.
alter table public.chatbot_excluded_numbers enable row level security;
