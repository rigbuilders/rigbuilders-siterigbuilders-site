import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface SubscriptionBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/**
 * POST /api/admin/push/subscribe — saves a browser's PushSubscription
 * (exactly the shape `PushSubscription.toJSON()` produces client-side, see
 * components/admin/PushNotificationSetup.tsx) so lib/chatbot/push-notify.ts
 * can send to it later. Upserts on `endpoint` — re-subscribing the same
 * device (e.g. after clearing site data) just refreshes the row instead of
 * erroring on the unique constraint.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const pushAuth = body?.keys?.auth;

  if (!endpoint || !p256dh || !pushAuth) {
    return NextResponse.json({ error: "endpoint and keys.p256dh/keys.auth are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("admin_push_subscriptions")
    .upsert({ endpoint, p256dh, auth: pushAuth, admin_email: auth.email }, { onConflict: "endpoint" });

  if (error) {
    return NextResponse.json(
      { error: `${error.message}. Have you run security/chatbot_push_subscriptions.sql yet?` },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok" });
}

/**
 * DELETE /api/admin/push/subscribe — removes a subscription, e.g. when the
 * admin explicitly turns notifications back off from the UI. Body: { endpoint }.
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
