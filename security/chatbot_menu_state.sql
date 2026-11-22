-- =====================================================================
-- chatbot_conversations.menu_state — guided menu position, per conversation
-- =====================================================================
--
-- SAFE TO RUN AS MANY TIMES AS YOU LIKE. Every statement below is a no-op
-- when the column already exists: nothing is dropped, no stored menu_state
-- value is altered, and no conversation is touched. The script reports which
-- path it took so you don't have to guess whether it had already been run.
--
-- WHY THE COLUMN EXISTS: the website widget keeps the visitor's menu position
-- in React state, but WhatsApp is stateless between messages — each webhook
-- arrives with no memory of what was on screen. Without somewhere to persist
-- "you are at parts-socket, having chosen category=cpu and brand=AMD", a
-- tapped list reply is just a string with nowhere to go.
--
-- Shape (see lib/chatbot/menu-state.ts):
--   {
--     "nodeId":  "parts-socket",
--     "filters": { "category": "cpu", "brand": "AMD" },
--     "trail":   [{ "nodeId": "parts-category", "label": "Processor",
--                   "filters": {} }],
--     "misses":  0
--   }
--
-- `misses` counts consecutive menu fallbacks. Two in a row means the menu has
-- failed this person twice and a third won't help either — the orchestrator
-- hands to a human instead (see menu-trigger.ts).
--
-- NULL = no menu in progress, which is the normal state for a conversation
-- being handled conversationally.
-- =====================================================================

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'chatbot_conversations'
      and column_name  = 'menu_state'
  ) then
    alter table public.chatbot_conversations add column menu_state jsonb;
    raise notice 'menu_state: column created.';
  else
    -- Deliberately does nothing else. Re-running must never reset a menu a
    -- customer is halfway through, so there is no UPDATE here and no DEFAULT
    -- to backfill — an existing column is simply left exactly as it is.
    raise notice 'menu_state: column already present — no changes made.';
  end if;
end
$$;

-- Metadata only. Rewriting a comment cannot affect stored data, and keeping
-- it outside the guard means the description stays current even on a
-- database where the column was added by an earlier version of this file.
comment on column public.chatbot_conversations.menu_state is
  'Guided menu position for this conversation (node id, accumulated filters, breadcrumb trail, consecutive-miss count). NULL when no menu is in progress.';
