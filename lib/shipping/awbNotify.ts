// Shared "send the AWB to the customer on WhatsApp" helper.
// Used by the manual notify route (dispatch screen) AND the tracking-sync job
// (fires once on the first Blue Dart pickup scan).
//
// Uses the Meta WhatsApp Cloud API with a PRE-APPROVED template. A proactive
// message outside the 24h customer-service window must be a template — its body
// needs three variables in this order: order id, AWB, tracking URL.

import type { SupabaseClient } from "@supabase/supabase-js";

const WA_PHONE_ID = process.env.WA_PHONE_ID || "";
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WA_VERSION = process.env.WA_GRAPH_VERSION || "v19.0";
const WA_TEMPLATE = process.env.WA_AWB_TEMPLATE || "shipping_update";
const WA_TEMPLATE_LANG = process.env.WA_AWB_TEMPLATE_LANG || "en";

// Normalise an Indian number to WhatsApp's E.164-without-plus form.
export function toWaNumber(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10) return "91" + d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  return d;
}

export interface AwbOrderLike {
  id: string;
  display_id?: string | null;
  phone?: string | null;
  shipping_address?: any;
}

/**
 * Send the AWB + tracking link to the order's customer on WhatsApp, and log a
 * `whatsapp` order_event (which also doubles as the "already notified" guard).
 */
export async function sendAwbWhatsApp(
  admin: SupabaseClient,
  order: AwbOrderLike,
  awb: string
): Promise<{ ok: boolean; to?: string; error?: string }> {
  if (!WA_PHONE_ID || !WA_TOKEN) return { ok: false, error: "WhatsApp not configured (WA_PHONE_ID / WHATSAPP_ACCESS_TOKEN)." };
  if (!awb) return { ok: false, error: "No AWB." };

  const to = toWaNumber(order.phone || order.shipping_address?.phone || "");
  if (!to) return { ok: false, error: "Customer has no phone number on file." };

  const trackingUrl = `https://www.bluedart.com/tracking?trackingNo=${encodeURIComponent(awb)}`;

  const res = await fetch(`https://graph.facebook.com/${WA_VERSION}/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${WA_TOKEN}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: WA_TEMPLATE,
        language: { code: WA_TEMPLATE_LANG },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(order.display_id || order.id) },
              { type: "text", text: String(awb) },
              { type: "text", text: trackingUrl },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("WhatsApp AWB send failed:", data);
    return { ok: false, error: data?.error?.message || "WhatsApp send failed." };
  }

  await admin.from("order_events").insert({
    order_id: order.id,
    status: "shipped",
    source: "whatsapp",
    note: `AWB ${awb} sent to customer on WhatsApp (${to})`,
  });

  return { ok: true, to };
}
