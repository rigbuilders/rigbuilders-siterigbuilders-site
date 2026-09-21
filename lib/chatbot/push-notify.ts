import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { inboxPath } from "./admin-alerts";

// Same public key value on both sides deliberately: NEXT_PUBLIC_ vars are
// inlined into client bundles AND still readable from process.env
// server-side, so one env var covers both the browser's pushManager.subscribe
// call (components/admin/PushNotificationSetup.tsx) and this server-side
// webpush.setVapidDetails call — no need for two separately-named copies of
// the same non-secret key. VAPID_PRIVATE_KEY is server-only, never exposed.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:rigbuilders123@gmail.com";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Relative path opened/focused when the notification is tapped. */
  url: string;
  /** Notifications sharing a tag collapse into one instead of stacking. */
  tag?: string;
}

/**
 * Fires a push notification to every admin device that's enabled them (an
 * admin can have several — phone, laptop — every row in
 * admin_push_subscriptions gets notified independently). Called right after
 * every inbound customer message is persisted, across all four channels
 * (see orchestrator.ts and website-stream.ts).
 *
 * Never throws — a failed or unconfigured push setup should never break the
 * reply pipeline that triggered it, same fail-open philosophy as
 * notifyAdminOfHandoff/notifyWatchedNumberMessage in admin-alerts.ts.
 * Automatically prunes subscriptions the browser has revoked (a 404/410 from
 * the push service means "this endpoint will never work again" per the Web
 * Push spec), so the table doesn't slowly fill up with dead devices.
 */
export async function notifyAdminPush(payload: PushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) {
      console.warn("[chatbot:push] VAPID keys not configured — skipping push notification.");
      return;
    }

    const { data, error } = await supabaseAdmin.from("admin_push_subscriptions").select("id, endpoint, p256dh, auth");

    if (error) {
      console.error(`[chatbot:push] failed to load subscriptions: ${error.message}`);
      return;
    }
    const subs = (data ?? []) as PushSubscriptionRow[];
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabaseAdmin.from("admin_push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error(`[chatbot:push] send failed for subscription ${sub.id}: ${(err as Error).message}`);
          }
        }
      })
    );
  } catch (err) {
    console.error(`[chatbot:push] notifyAdminPush failed: ${(err as Error).message}`);
  }
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  instagram: "Instagram",
  website: "the website",
};

/**
 * Convenience wrapper for the one case every channel needs: "a customer just
 * sent a message." Builds the title/body/url/tag from the raw message so
 * orchestrator.ts and website-stream.ts don't each duplicate this shaping.
 */
export async function notifyAdminOfNewMessage(params: {
  channel: string;
  externalUserId: string;
  text: string;
  conversationId: string;
}): Promise<void> {
  const label = CHANNEL_LABEL[params.channel] || params.channel;
  const trimmedText = params.text.length > 120 ? `${params.text.slice(0, 117)}...` : params.text;
  const body = trimmedText ? `${params.externalUserId}: ${trimmedText}` : `${params.externalUserId} sent an attachment`;

  await notifyAdminPush({
    title: `New message on ${label}`,
    body,
    url: inboxPath(params.channel),
    tag: `chatbot-${params.conversationId}`,
  });
}
