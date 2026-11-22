-- =====================================================================
-- build_questions + chatbot_conversations.build_brief
-- =====================================================================
--
-- The questionnaire a customer answers before we quote a custom build.
--
-- WHY A TABLE AND NOT A TS FILE: these questions change with the market —
-- budget bands drift with prices, DDR4 stops being worth asking about, a new
-- use case appears. Every one of those is a deploy if the list is hardcoded,
-- so the list lives here and is edited from /admin/chatbot/questions.
--
-- `answer_type` drives how each channel renders it:
--   choice       buttons / list rows only
--   text         free text only
--   choice_text  buttons PLUS a free-text escape (the budget question —
--                bands cover most people, but "strict 50k" or
--                "2.7 to 2.9 lakh" is a real answer we shouldn't force into
--                the nearest band)
--
-- `brief_key` is the stable identifier an answer is stored under in
-- chatbot_conversations.build_brief. Renaming a question's LABEL is safe;
-- changing its brief_key orphans answers already collected, so don't.
--
-- Run this once in the Supabase SQL editor.
-- =====================================================================

create table if not exists public.build_questions (
  id uuid primary key default gen_random_uuid(),
  -- Stable key the answer is filed under. Never change once answers exist.
  brief_key text not null unique,
  -- Shown to the customer.
  label text not null,
  -- Optional helper line under the question.
  hint text,
  answer_type text not null default 'choice'
    check (answer_type in ('choice', 'text', 'choice_text')),
  -- [{ "id": "gaming", "label": "Gaming" }, ...] — ignored for 'text'.
  options jsonb not null default '[]'::jsonb,
  -- Placeholder for the free-text box on 'text' and 'choice_text'.
  placeholder text,
  -- Ask order. Gaps are fine; the admin UI reorders by rewriting these.
  sort_order integer not null default 0,
  -- Unticking this retires a question without losing answers already given.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists build_questions_order
  on public.build_questions (is_active, sort_order);

alter table public.build_questions enable row level security;

-- Answers collected so far, keyed by brief_key:
--   { "purpose": "Gaming", "budget": "1 lakh - 1.5 lakh", "cpu_brand": "AMD" }
-- The engine asks only for keys that are missing, which is what stops a
-- customer being asked their budget three times across a conversation.
alter table public.chatbot_conversations
  add column if not exists build_brief jsonb;

comment on column public.chatbot_conversations.build_brief is
  'Answers to build_questions collected so far for this conversation, keyed by brief_key. NULL when no build enquiry is in progress.';

-- --------------------------------------------------------------------
-- Seed: the six questions as specified. Safe to re-run — on conflict it
-- leaves any edits made in the admin panel alone rather than resetting them.
-- --------------------------------------------------------------------
insert into public.build_questions (brief_key, label, hint, answer_type, options, placeholder, sort_order)
values
  (
    'purpose',
    'What will you mainly use it for?',
    null,
    'choice',
    '[{"id":"gaming","label":"Gaming"},
      {"id":"workstation","label":"Workstation"},
      {"id":"ai","label":"AI / ML"},
      {"id":"content","label":"Content creation"},
      {"id":"office","label":"Office / everyday"}]'::jsonb,
    null,
    10
  ),
  (
    'budget',
    'What budget are you working with?',
    'Pick a range, or type an exact figure',
    'choice_text',
    '[{"id":"under-50k","label":"Below ₹50,000"},
      {"id":"50k-1l","label":"₹50,000 – ₹1 lakh"},
      {"id":"1l-1.5l","label":"₹1 lakh – ₹1.5 lakh"},
      {"id":"1.5l-2l","label":"₹1.5 lakh – ₹2 lakh"},
      {"id":"2l-3l","label":"₹2 lakh – ₹3 lakh"},
      {"id":"3l-plus","label":"₹3 lakh +"}]'::jsonb,
    'e.g. under 70k, 1.25 lakh - 1.50 lakh, strict 50k',
    20
  ),
  (
    'cpu_brand',
    'Any processor preference?',
    null,
    'choice',
    '[{"id":"amd","label":"AMD"},
      {"id":"intel","label":"Intel"},
      {"id":"any","label":"No preference"}]'::jsonb,
    null,
    30
  ),
  (
    'gpu_brand',
    'Any graphics card preference?',
    null,
    'choice',
    '[{"id":"nvidia","label":"NVIDIA"},
      {"id":"amd","label":"AMD"},
      {"id":"any","label":"No preference"}]'::jsonb,
    null,
    40
  ),
  (
    'platform',
    'DDR4 or DDR5?',
    'This sets the platform, not just the memory',
    'choice',
    '[{"id":"ddr4","label":"DDR4"},
      {"id":"ddr5","label":"DDR5"},
      {"id":"any","label":"No preference"}]'::jsonb,
    null,
    50
  ),
  (
    'colour',
    'Preferred colour?',
    null,
    'choice',
    '[{"id":"black","label":"Black"},
      {"id":"white","label":"White"},
      {"id":"any","label":"No preference"}]'::jsonb,
    null,
    60
  )
on conflict (brief_key) do nothing;
