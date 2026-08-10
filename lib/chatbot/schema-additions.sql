-- Run this once in the Supabase SQL editor (same project as db/schema.sql from the
-- standalone chatbot backend). Adds the "exceptions" list for the admin inbox portal:
-- numbers in this table never get an auto-reply, even on their first message.

create table if not exists chatbot_excluded_numbers (
  id uuid primary key default uuid_generate_v4(),
  channel text not null,              -- 'whatsapp' | 'instagram' | 'messenger'
  external_user_id text not null,     -- platform-specific id (WhatsApp: phone number, no '+')
  reason text,
  created_at timestamptz not null default now(),
  unique (channel, external_user_id)
);
