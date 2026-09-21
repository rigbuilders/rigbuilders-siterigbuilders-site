-- =====================================================================
-- admin_push_subscriptions — Web Push subscriptions for the admin PWA
-- =====================================================================
--
-- WHY: the /admin chatbot dashboard can now be installed as a PWA (see
-- app/admin/layout.tsx, public/admin-manifest.webmanifest, public/sw.js) and
-- gets a real push notification on a phone the moment a customer messages on
-- any channel (WhatsApp/Messenger/Instagram/website) — see
-- lib/chatbot/push-notify.ts, called from orchestrator.ts and
-- website-stream.ts right after every inbound message is persisted.
--
-- One row per subscribed browser/device (an admin enabling notifications on
-- both their phone and laptop gets two rows, and both get notified) — the
-- endpoint URL itself is what's unique per device+browser combination, per
-- the Web Push spec. Columns match the shape of a PushSubscription's own
-- .toJSON() output (endpoint, keys.p256dh, keys.auth) so the subscribe route
-- (app/api/admin/push/subscribe/route.ts) can just pass it straight through.
--
-- Run this once in the Supabase SQL editor before the "Enable Notifications"
-- button will work.
-- =====================================================================

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  admin_email text,
  created_at timestamptz not null default now()
);

-- Only ever accessed via supabaseAdmin (service role, bypasses RLS) — see
-- lib/chatbot/push-notify.ts (reads, to send) and
-- app/api/admin/push/subscribe/route.ts (writes, gated by requireAdmin()).
-- RLS here just blocks the public anon key from reading/writing this table
-- directly, same posture as the rest of security/rls_policies.sql.
alter table public.admin_push_subscriptions enable row level security;
