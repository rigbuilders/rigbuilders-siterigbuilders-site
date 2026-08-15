"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Download, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/app/context/CartContext";
import { generateSpecSheetPDF } from "@/utils/generatePdf";

export interface ChatBuildQuoteItem {
  category: string;
  label: string;
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  brand: string | null;
}

export interface ChatBuildQuoteData {
  useCase: "gaming" | "workstation" | "creator" | "general";
  budget: number;
  items: ChatBuildQuoteItem[];
  totalPrice: number;
  estimatedTDP: number;
  psuWattage: number;
  isPowerSufficient: boolean;
  withinBudget: boolean;
  missingCategories: string[];
}

const USE_CASE_LABEL: Record<ChatBuildQuoteData["useCase"], string> = {
  gaming: "Gaming Build",
  workstation: "Workstation Build",
  creator: "Creator Build",
  general: "Everyday Build",
};

const PDF_CATEGORIES = ["cpu", "gpu", "motherboard", "ram", "storage", "cooler", "psu", "cabinet"] as const;

function findItem(quote: ChatBuildQuoteData, category: string) {
  return quote.items.find((i) => i.category === category) || null;
}

function cabinetImage(quote: ChatBuildQuoteData): string | undefined {
  return findItem(quote, "cabinet")?.imageUrl || undefined;
}

/**
 * Build-quotation card rendered inline in the chat widget when the customer
 * asks for a custom PC recommendation. Every part/price shown here came
 * straight from build-recommender.ts (which reuses the configurator's own
 * compatibility + wattage rules) — this component only renders and offers
 * the same two actions the configurator already has: add the whole thing to
 * cart as one line item, or download the same branded PDF quotation.
 */
export default function ChatBuildQuoteCard({ quote }: { quote: ChatBuildQuoteData }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [downloading, setDownloading] = useState(false);

  function handleAddToCart() {
    const specs: Record<string, { name: string; image?: string }> = {};
    for (const item of quote.items) {
      specs[item.category] = { name: item.name, ...(item.category === "cabinet" ? { image: item.imageUrl || undefined } : {}) };
    }

    addToCart({
      id: `custom-${Date.now()}`,
      name: `Custom ${USE_CASE_LABEL[quote.useCase]}`,
      price: quote.totalPrice,
      image: cabinetImage(quote) || "/icons/navbar/products/Desktops.png",
      category: "Custom Build",
      quantity: 1,
      specs,
    });

    toast.success("Build added to Gear", {
      description: `Your custom ${quote.useCase} build is secure in your cart.`,
      action: { label: "Checkout", onClick: () => router.push("/cart") },
    });
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const specs: Record<string, { name: string; image?: string }> = {};
      for (const category of PDF_CATEGORIES) {
        const item = findItem(quote, category);
        if (item) specs[category] = { name: item.name, ...(category === "cabinet" ? { image: item.imageUrl || undefined } : {}) };
      }

      await generateSpecSheetPDF({
        id: `chat-${Date.now()}`,
        name: USE_CASE_LABEL[quote.useCase],
        total_price: quote.totalPrice,
        specs,
      });
    } catch {
      toast.error("Couldn't generate the PDF", { description: "Please try again in a moment." });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase tracking-wide">{USE_CASE_LABEL[quote.useCase]}</span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            quote.withinBudget ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {quote.withinBudget ? "Within budget" : "Slightly over budget"}
        </span>
      </div>

      <div className="space-y-1.5">
        {quote.items.map((item) => (
          <button
            key={item.category}
            onClick={() => router.push(`/product/${item.id}`)}
            className="w-full flex items-center justify-between text-left group"
          >
            <span className="text-[11px] text-brand-silver group-hover:text-white transition-colors truncate pr-2">
              {item.label}: <span className="text-white/90">{item.name}</span>
            </span>
            <span className="text-[11px] font-bold text-white shrink-0">₹{item.price.toLocaleString("en-IN")}</span>
          </button>
        ))}
      </div>

      {quote.missingCategories.length > 0 && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Couldn&apos;t find a compatible in-stock option for: {quote.missingCategories.join(", ")}.</span>
        </div>
      )}

      {!quote.isPowerSufficient && (
        <div className="flex items-start gap-1.5 text-[10px] text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Estimated draw is {quote.estimatedTDP}W but the PSU only supplies {quote.psuWattage}W — this needs a
            stronger PSU.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-xs text-brand-silver">Total</span>
        <span className="text-base font-bold text-white">₹{quote.totalPrice.toLocaleString("en-IN")}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-brand-purple hover:scale-[1.02] transition-transform text-[11px] font-bold text-white"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add Build to Cart
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          title="Download Quotation PDF"
          className="w-9 h-9 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          {downloading ? (
            <Zap className="w-4 h-4 text-white animate-pulse" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
