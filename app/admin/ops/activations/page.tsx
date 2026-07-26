"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateActivationId } from "@/lib/id-generator";
import { toast } from "sonner";
import { FaKey, FaCopy, FaCheck } from "react-icons/fa";

/**
 * Standalone Aegis activation-key generator.
 *
 * Mints a random activation key WITHOUT going through billing — for warranty
 * replacements, review/RMA units, or (in future) a standalone Command Center
 * app sale. The key is written to the `activations` table with no linked order
 * (order_id = null, source = 'manual'); the customer then enters it in the app.
 */
export default function ActivationGeneratorPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [billingId, setBillingId] = useState("");
  const [issuedOn, setIssuedOn] = useState(today);
  const [buildType, setBuildType] = useState<"prebuilt" | "custom" | "manual">("manual");
  const [busy, setBusy] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!billingId.trim()) {
      toast.error("Enter an Activation Billing ID first.");
      return;
    }
    setBusy(true);
    setIssuedKey(null);
    setCopied(false);

    const activationId = generateActivationId();
    const { error } = await supabase.from("activations").insert({
      activation_id: activationId,
      activation_billing_id: billingId.trim(),
      order_id: null,
      build_type: buildType,
      source: "manual",
      issued_on: issuedOn,
    });

    setBusy(false);

    if (error) {
      console.error("Activation insert failed:", error);
      toast.error("Could not create the activation.", { description: error.message });
      return;
    }
    setIssuedKey(activationId);
    toast.success("Activation ID created.");
  };

  const copyKey = () => {
    if (!issuedKey) return;
    navigator.clipboard.writeText(issuedKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          Mint a Command Center activation key without an order — for warranty
          replacements, RMA/review units, or a standalone app sale.
        </p>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-silver mb-2">
              Activation Billing ID
            </label>
            <input
              type="text"
              value={billingId}
              disabled={busy}
              onChange={(e) => setBillingId(e.target.value)}
              placeholder="e.g. INV-RB-26-013, APP-2026-001, RMA-114"
              className="w-full bg-black border border-white/15 rounded px-4 py-3 text-white placeholder:text-white/30 focus:border-brand-purple focus:outline-none"
            />
            <p className="text-[11px] text-brand-silver/70 mt-1">
              Just a reference for your records (invoice, RMA, app sale, etc.).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-brand-silver mb-2">
                Issued On
              </label>
              <input
                type="date"
                value={issuedOn}
                disabled={busy}
                onChange={(e) => setIssuedOn(e.target.value)}
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-white focus:border-brand-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-brand-silver mb-2">
                Build Type
              </label>
              <select
                value={buildType}
                disabled={busy}
                onChange={(e) => setBuildType(e.target.value as "prebuilt" | "custom" | "manual")}
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-white focus:border-brand-purple focus:outline-none"
              >
                <option value="manual">Manual / App</option>
                <option value="prebuilt">Prebuilt</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={busy || !billingId.trim()}
            className="w-full bg-brand-purple hover:brightness-110 disabled:opacity-50 disabled:cursor-default text-white font-bold uppercase tracking-widest py-3 rounded transition-all"
          >
            {busy ? "Generating…" : "Generate Activation ID"}
          </button>
        </div>

        {issuedKey && (
          <div className="mt-6 bg-[#0f0f10] border border-brand-purple/40 rounded-xl p-6 text-center">
            <p className="text-[11px] uppercase tracking-[3px] text-brand-silver mb-3">
              Activation ID
            </p>
            <p className="font-mono text-2xl md:text-3xl font-bold tracking-[3px] mb-4">
              {issuedKey}
            </p>
            <button
              onClick={copyKey}
              className="inline-flex items-center gap-2 border border-white/20 hover:border-brand-purple hover:bg-brand-purple/10 rounded px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all"
            >
              {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
            </button>
            <p className="text-[11px] text-brand-silver/70 mt-4">
              Give this to the customer. They enter it in the Aegis Command Center to activate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
