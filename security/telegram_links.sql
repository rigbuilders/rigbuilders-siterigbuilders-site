-- =====================================================================
-- telegram_message_links — maps a Telegram alert back to its conversation
-- =====================================================================
--
-- WHY: the whole point of the Telegram integration is replying straight from
-- the notification shade without opening anything. For that to work, when a
-- reply arrives we have to know WHICH customer it was meant for — and the
-- only thing Telegram tells us is the id of the message that was replied to.
--
-- So every alert we post is recorded here against its conversation. On an
-- inbound reply we look up reply_to_message.message_id and get back the
-- channel and the customer's id. Replying to the right notification IS the
-- act of picking the conversation — there's no list to choose from, which is
-- what makes it fast enough to use one-handed.
--
-- Rows are small and write-once. Worth pruning after a few months if it
-- grows, but there's no correctness reason to delete them.
--
-- Run this once in the Supabase SQL editor.
-- =====================================================================

create table if not exists public.telegram_message_links (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text not null,
  telegram_message_id bigint not null,
  conversation_id uuid not null references public.chatbot_conversations(id) on delete cascade,
  channel text not null,
  external_user_id text not null,
  created_at timestamptz not null default now(),
  unique (telegram_chat_id, telegram_message_id)
);

-- The lookup done on every inbound reply.
create index if not exists telegram_message_links_lookup
  on public.telegram_message_links (telegram_chat_id, telegram_message_id);

-- Only ever accessed via supabaseAdmin (service role, bypasses RLS). RLS here
-- just blocks the public anon key from reading it, same posture as the rest of
-- security/rls_policies.sql.
alter table public.telegram_message_links enable row level security;
