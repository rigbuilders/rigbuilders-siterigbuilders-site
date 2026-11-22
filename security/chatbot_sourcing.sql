-- =====================================================================
-- sourcing_requests — the distributor round-trip for parts we don't stock
-- =====================================================================
--
-- SAFE TO RE-RUN. Every statement is guarded; nothing is dropped and no
-- existing row is modified.
--
-- THE FLOW THIS TRACKS:
--   1. A customer asks for parts that aren't in our catalogue.
--   2. We send the list to the distributor (Navkar) on WhatsApp.
--   3. He replies with availability and distributor prices — sometimes
--      substituting (an RX 550 where an RX 6500 was asked for).
--   4. Substitutions and prices are checked against the customer's brief
--      (budget, CPU/GPU brand) and sent to the approver (Guninder) on
--      Telegram.
--   5. He replies "send" or "updated quotation".
--
-- WHY A TABLE: steps 2 to 5 span hours and several inbound messages from two
-- different people. Without somewhere to hold "this reply from Navkar belongs
-- to that customer's request", a distributor message is an orphan — which is
-- exactly how a quote gets lost.
-- =====================================================================

create table if not exists public.sourcing_requests (
  id uuid primary key default gen_random_uuid(),

  -- The customer this is being sourced for.
  conversation_id uuid references public.chatbot_conversations(id) on delete set null,
  customer_channel text,
  customer_external_id text,

  -- What we asked the distributor for, and the brief it has to satisfy.
  requested_parts jsonb not null default '[]'::jsonb,
  brief jsonb,

  -- The distributor's raw reply, kept verbatim. Parsing can be re-run or
  -- corrected later; the original message is the only thing that can't be
  -- reconstructed.
  distributor_reply text,
  -- [{ "requested": "RX 6500", "offered": "RX 550", "brand": "Sapphire",
  --    "price": 8500, "is_substitution": true }]
  parsed_items jsonb,

  status text not null default 'awaiting_distributor'
    check (status in (
      'awaiting_distributor',   -- sent to Navkar, waiting
      'needs_brand',            -- he answered without brands; we asked again
      'awaiting_approval',      -- parsed, sent to Guninder
      'approved',               -- "send"
      'revision_requested',     -- "updated quotation"
      'closed'
    )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The lookup done on every distributor message: find the request this reply
-- belongs to. Most recent open one wins.
create index if not exists sourcing_requests_open
  on public.sourcing_requests (status, created_at desc);

alter table public.sourcing_requests enable row level security;

do $$
begin
  raise notice 'sourcing_requests: ready.';
end
$$;
