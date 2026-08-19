-- Run this once in the Supabase SQL editor. Adds media (image/document)
-- support to the chatbot: a public storage bucket to hold uploaded files,
-- and two new columns on chatbot_messages to record what was sent.
--
-- Why a public bucket: WhatsApp/Messenger/Instagram's Cloud APIs send media
-- "by link" — you give them a plain HTTPS URL and Meta's own servers fetch
-- it to deliver to the customer. That means the file has to be reachable
-- without auth, so `public: true` here is intentional, not an oversight.
-- Uploads still only happen through the admin-only API route (service role),
-- so nothing lets a random visitor write to this bucket — only read.

insert into storage.buckets (id, name, public)
values ('chatbot-media', 'chatbot-media', true)
on conflict (id) do nothing;

alter table chatbot_messages add column if not exists media_url text;
alter table chatbot_messages add column if not exists media_type text; -- 'image' | 'document'
