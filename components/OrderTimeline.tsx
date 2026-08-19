"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaTruck, FaChevronDown, FaChevronUp, FaExternalLinkAlt } from "react-icons/fa";

// Friendly labels for the status timeline.
const LABELS: Record<string, string> = {
  processing: "Order Confirmed",
  procurement: "Preparing Your Order",
  assembly: "Building Your Rig",
  ready_to_ship: "Packed — Ready to Ship",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  rto: "Returning to Origin",
  cancelled: "Cancelled",
  pending: "Awaiting Payment",
  paid: "Payment Received",
};

const pretty = (s: string) => LABELS[s] || (s || "").replace(/_/g, " ");

export default function OrderTimeline({ orderId, awb }: { orderId: string; awb?: string | null }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && events === null) {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("order_events")
          .select("status, note, created_at, source")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false });
        setEvents(data || []);
      } catch {
        setEvents([]); // table not created yet / no access → show empty state
      }
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-purple hover:text-white transition-colors"
      >
        <FaTruck /> {open ? "Hide tracking" : "View tracking & updates"}
        {open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
      </button>

      {open && (
        <div className="mt-4">
          {awb && (
            <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded p-3 mb-4 text-xs">
              <span className="text-brand-silver">
                AWB: <span className="font-mono text-white">{awb}</span>
              </span>
              <a
                href={`https://www.bluedart.com/tracking?trackingNo=${encodeURIComponent(awb)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-purple hover:text-white flex items-center gap-1"
              >
                Track on Blue Dart <FaExternalLinkAlt size={9} />
              </a>
            </div>
          )}

          {loading ? (
            <p className="text-brand-silver text-xs animate-pulse">Loading updates…</p>
          ) : !events || events.length === 0 ? (
            <p className="text-brand-silver/50 text-xs italic">No updates recorded yet — we’ll post each step here.</p>
          ) : (
            <ol className="relative border-l border-white/10 ml-1 space-y-4">
              {events.map((e, i) => (
                <li key={i} className="ml-4 relative">
                  <span
                    className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 ${
                      i === 0 ? "bg-brand-purple border-brand-purple" : "bg-[#1A1A1A] border-white/20"
                    }`}
                  />
                  <div className="text-sm font-bold text-white">{pretty(e.status)}</div>
                  {/* Only surface carrier (Blue Dart) scan notes to customers — internal
                      admin notes (e.g. distributor sourcing) stay hidden. */}
                  {e.note && e.source === "bluedart" && (
                    <div className="text-[11px] text-brand-silver">{e.note}</div>
                  )}
                  <div className="text-[10px] text-white/30">
                    {new Date(e.created_at).toLocaleString("en-IN")}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
