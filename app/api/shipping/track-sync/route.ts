import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { track, isConfigured } from "@/lib/shipping/bluedart";
import { mapScanToStatus, shouldAdvance } from "@/lib/shipping/status";
import { sendAwbWhatsApp } from "@/lib/shipping/awbNotify";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Called on a schedule by Supabase pg_cron (see security/shipping_schema.sql).
// Protected by SHIPPING_SYNC_SECRET. Polls Blue Dart for every active AWB and
// advances the order status + writes an order_events row.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body?.secret !== process.env.SHIPPING_SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) return NextResponse.json({ ok: true, note: "Blue Dart not configured; nothing to do." });

  // Poll every order that has an AWB and isn't finished yet (so a freshly
  // dispatched 'shipped' order is included — that's how we catch the pickup).
  const { data: orders } = await admin
    .from("orders")
    .select("id, display_id, phone, shipping_address, awb_number, status")
    .not("awb_number", "is", null)
    .not("status", "in", '("delivered","cancelled","rto")');

  let updated = 0;
  let notified = 0;
  for (const o of orders || []) {
    try {
      const t = await track(o.awb_number);
      const next = mapScanToStatus(t.latest);
      const nowIso = new Date().toISOString();

      // FIRST pickup scan → WhatsApp the AWB to the customer, exactly once.
      // The presence of any scan means Blue Dart has the parcel (picked up).
      // A prior 'whatsapp' order_event is our "already sent" guard.
      if ((t.scans?.length || 0) > 0) {
        const { count } = await admin
          .from("order_events")
          .select("id", { count: "exact", head: true })
          .eq("order_id", o.id)
          .eq("source", "whatsapp");
        if (!count) {
          const r = await sendAwbWhatsApp(admin, o, o.awb_number);
          if (r.ok) notified++;
        }
      }

      if (next && shouldAdvance(o.status, next)) {
        const patch: any = { status: next, shipping_status: next, tracking_last_synced: nowIso };
        if (next === "delivered") patch.delivered_at = nowIso;
        await admin.from("orders").update(patch).eq("id", o.id);
        await admin.from("order_events").insert({ order_id: o.id, status: next, source: "bluedart", note: t.latest });
        updated++;
        // TODO(notify): send Resend email + WhatsApp on dispatched / out_for_delivery / delivered
      } else {
        await admin.from("orders").update({ tracking_last_synced: nowIso }).eq("id", o.id);
      }
    } catch (e: any) {
      console.error("track-sync failed for", o.awb_number, e?.message);
    }
  }

  return NextResponse.json({ ok: true, checked: orders?.length || 0, updated, notified });
}
