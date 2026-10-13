-- =====================================================================
-- chatbot_conversations.menu_state — guided menu position, per conversation
-- =====================================================================
--
-- WHY: the website widget keeps the visitor's menu position in React state,
-- but WhatsApp is stateless between messages — each webhook arrives with no
-- memory of what was on screen. Without somewhere to persist "you are at
-- parts-socket, having chosen category=cpu and brand=AMD", a tapped list
-- reply is just a string with nowhere to go.
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
--
-- Run this once in the Supabase SQL editor.
-- =====================================================================

alter table public.chatbot_conversations
  add column if not exists menu_state jsonb;

comment on column public.chatbot_conversations.menu_state is
  'Guided menu position for this conversation (node id, accumulated filters, breadcrumb trail, consecutive-miss count). NULL when no menu is in progress.';
