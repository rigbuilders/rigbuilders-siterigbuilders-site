// lib/shipping/status.ts
// Maps Blue Dart scan text → our internal order status, robustly (keyword-based,
// so it survives wording variations across scans). Also a rank so the tracking
// poll only ever advances an order forward, never backward.

export type ShipStatus =
  | "processing" | "procurement" | "assembly" | "ready_to_ship"
  | "dispatched" | "in_transit" | "out_for_delivery" | "delivered" | "rto";

export const STATUS_RANK: Record<string, number> = {
  processing: 10,
  procurement: 20,
  assembly: 30,
  ready_to_ship: 40,
  dispatched: 50,
  in_transit: 60,
  out_for_delivery: 70,
  rto: 75,
  delivered: 80,
};

/** Map a Blue Dart scan/status string to our status. Returns null for unknown scans. */
export function mapScanToStatus(scan: string): ShipStatus | null {
  const s = (scan || "").toLowerCase();
  if (!s) return null;
  if (s.includes("delivered")) return "delivered";
  if (s.includes("out for delivery") || s.includes("out-for-delivery") || s.includes("ofd")) return "out_for_delivery";
  if (s.includes("rto") || s.includes("return to origin") || s.includes("returned")) return "rto";
  if (s.includes("picked") || s.includes("pickup done") || s.includes("shipment pick")) return "dispatched";
  if (
    s.includes("transit") || s.includes("in-transit") || s.includes("departed") ||
    s.includes("arrived") || s.includes("received at") || s.includes("bagged") ||
    s.includes("forwarded") || s.includes("reached")
  ) return "in_transit";
  return null; // unknown → leave status unchanged
}

/** Only advance if the new status ranks higher than the current one. */
export function shouldAdvance(current: string, next: string): boolean {
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[current] ?? 0);
}
