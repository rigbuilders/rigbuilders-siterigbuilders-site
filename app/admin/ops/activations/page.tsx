"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateActivationId, generateActivationBillingId } from "@/lib/id-generator";
import { toast } from "sonner";
import { FaKey, FaCopy, FaCheck, FaClock } from "react-icons/fa";

/** Format a Date as the value a <input type="datetime-local"> expects. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Standalone Aegis activation-key generator.
 *
 * Mints a licence WITHOUT going through billing — for warranty replacements,
 * review/RMA units, or a standalone Command Center app sale. You fill in the
 * date/time and the customer name; the activation key and a sequential billing
 * number are generated automatically. Written to `activations` with no linked
 * order (source = 'manual').
 */
export default function ActivationGeneratorPage() {
  const [customerName, setCustomerName] = useState("");
  const [issuedAt, setIssuedAt] = useState(toLocalInput(new Date()));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ key: string; billing: string } | null>(null);
  const [copied, setCopied] = useState<"key" | "billing" | null>(null);

  const useNow = () => setIssuedAt(toLocalInput(new Date()));

  const generate = async () => {
    if (!customerName.trim()) {
      toast.error("Enter the customer name first.");
      return;
    }
    setBusy(true);
    setResult(null);
    setCopied(null);

    const activationId = generateActivationId();

    try {
      const activationBillingId = await generateActivationBillingId(supabase);
      const issuedIso = new Date(issuedAt).toISOString();

      const { error } = await supabase.from("activations").insert({
        activation_id: activationId,
        activation_billing_id: activationBillingId,
        customer_name: customerName.trim(),
        order_id: null,
        build_type: "manual",
        source: "manual",
        issued_at: issuedIso,
      });

      if (error) {
        console.error("Activation insert failed:", error);
        toast.error("Could not create the activation.", { description: error.message });
        return;
      }
      setResult({ key: activationId, billing: activationBillingId });
      toast.success("Activation created.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, which: "key" | "billing") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira flex flex-col">
      <Navbar />

      <div className="flex-grow max-w-2xl mx-auto w-full px-6 pt-32 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <FaKey className="text-brand-purple" />
          <h1 className="font-orbitron font-bold text-2xl">Generate Activation ID</h1>
        </div>
        <p className="text-brand-silver text-sm mb-8">
          Mint a Command Center licence without an order — for warranty
          replacements, RMA/review units, or a standalone app sale.
        </p>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-silver mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              disabled={busy}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Chirag Bansal"
              className="w-full bg-black border border-white/15 rounded px-4 py-3 text-white placeholder:text-white/30 focus:border-brand-purple focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-silver mb-2">
              Date &amp; Time
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={issuedAt}
                disabled={busy}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="flex-grow bg-black border border-white/15 rounded px-4 py-3 text-white focus:border-brand-purple focus:outline-none"
              />
              <button
                type="button"
                onClick={useNow}
                disabled={busy}
                className="inline-flex items-center gap-2 border border-white/20 hover:border-brand-purple hover:bg-brand-purple/10 rounded px-4 text-xs font-bold uppercase tracking-widest transition-all"
              >
                <FaClock /> Now
              </button>
            </div>
            <p className="text-[11px] text-brand-silver/70 mt-1">
              Defaults to the current date &amp; time. This is the warranty start.
            </p>
          </div>

          <div className="text-[11px] text-brand-silver/70 border-t border-white/10 pt-4">
            The <span className="text-white">Activation ID</span> and a sequential{" "}
            <span className="text-white">billing number</span> are generated automatically.
          </div>

          <button
            onClick={generate}
            disabled={busy || !customerName.trim()}
            className="w-full bg-brand-purple hover:brightness-110 disabled:opacity-50 disabled:cursor-default text-white font-bold uppercase tracking-widest py-3 rounded transition-all"
          >
            {busy ? "Generating…" : "Generate Activation ID"}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-[#0f0f10] border border-brand-purple/40 rounded-xl p-6 text-center">
            <p className="text-[11px] uppercase tracking-[3px] text-brand-silver mb-3">
              Activation ID
            </p>
            <p className="font-mono text-2xl md:text-3xl font-bold tracking-[3px] mb-3">
              {result.key}
            </p>
            <button
              onClick={() => copy(result.key, "key")}
              className="inline-flex items-center gap-2 border border-white/20 hover:border-brand-purple hover:bg-brand-purple/10 rounded px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all mb-5"
            >
              {copied === "key" ? <><FaCheck /> Copied</> : <><FaCopy /> Copy key</>}
            </button>

            <div className="border-t border-white/10 pt-4">
              <p className="text-[11px] uppercase tracking-[2px] text-brand-silver mb-1">
                Billing No.
              </p>
              <p className="font-mono text-lg tracking-widest">{result.billing}</p>
            </div>

            <p className="text-[11px] text-brand-silver/70 mt-4">
              Give the Activation ID to the customer. They enter it in the Aegis
              Command Center to activate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
