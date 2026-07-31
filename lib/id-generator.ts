// lib/id-generator.ts
import { SupabaseClient } from "@supabase/supabase-js";

// Atomically get the next value for a named counter.
// Requires the increment_counter() SQL function (see security/atomic_counters.sql).
// Falls back to a timestamp-based suffix only if the RPC is unavailable, so an
// order is never blocked — but with the RPC in place, values are collision-free.
async function nextCounter(supabase: SupabaseClient, counterName: string): Promise<string> {
  const { data, error } = await supabase.rpc("increment_counter", {
    counter_name: counterName,
  });

  if (error || data === null || data === undefined) {
    console.error(`Counter '${counterName}' RPC failed:`, error?.message);
    // Non-sequential fallback (still unique-ish) so checkout never hard-fails.
    return `X${Date.now().toString().slice(-4)}`;
  }

  return String(data).padStart(3, "0");
}

/**
 * Next Order ID: RB-{TYPE}-{YY}-{XXX}  e.g. RB-PB-26-001
 */
export const generateOrderId = async (
  supabase: SupabaseClient,
  type: "PB" | "CB" | "CS"
) => {
  const counterName = `rb_${type.toLowerCase()}`;
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = await nextCounter(supabase, counterName);
  return `RB-${type}-${year}-${seq}`;
};

/**
 * Next Invoice Number: INV-RB-{YY}-{XXX}  e.g. INV-RB-26-001
 */
export const generateInvoiceId = async (supabase: SupabaseClient) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = await nextCounter(supabase, "invoice");
  return `INV-RB-${year}-${seq}`;
};

/**
 * Aegis Activation ID: RB-XXXX-XXXX-XXXX  e.g. RB-BH95-6EG7-KUMN
 *
 * A random, high-entropy key — the single credential that activates the Aegis
 * Command Center desktop app. Stored on the order row (`orders.activation_id`)
 * and printed on the customer's confirmation email / documents. Uses a 32-char
 * alphabet with no ambiguous glyphs (no 0/O, 1/I), so it's easy to read and type.
 * ~60 bits of entropy — not guessable or enumerable.
 *
 * Sync + dependency-free: uses Web Crypto, which exists in both Node 18+
 * (server routes) and the browser (admin console).
 */
const ACTIVATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars

export const generateActivationId = (): string => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let key = "";
  for (let i = 0; i < 12; i++) {
    // 256 % 32 === 0, so a raw byte modulo 32 is perfectly unbiased.
    key += ACTIVATION_ALPHABET[bytes[i] % 32];
    if (i === 3 || i === 7) key += "-";
  }
  return `RB-${key}`;
};

/**
 * Sequential Activation Billing ID: AB-000001, AB-000002, …
 * A human-friendly running licence number (starts at 1). Uses the same atomic
 * `counters` table as the order/invoice generators, so numbers never collide.
 */
export const generateActivationBillingId = async (supabase: SupabaseClient) => {
  const seq = await nextCounter(supabase, "activation_billing");
  return `AB-${seq.padStart(6, "0")}`;
};
