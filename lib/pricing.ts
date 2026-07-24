// lib/pricing.ts
// Server-side authoritative pricing.
//
// The browser cart lives in localStorage and every price in it is attacker-editable.
// NEVER trust a price, subtotal, or total that arrives from the client. This module
// recomputes everything from the `products` table (the source of truth) and the
// `validate_coupon` RPC, so the amount charged and the amount stored are both derived
// server-side.

import { SupabaseClient } from "@supabase/supabase-js";

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

export interface IncomingCartItem {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  // Custom / prebuilt configurations carry the selected components here.
  specs?: Record<string, unknown> | null;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  appliedCoupon: string | null;
  total: number;
  lineItems: { name: string; unitPrice: number; quantity: number }[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mirrors the heavy-shipping keyword logic in app/checkout/page.tsx so the
// server arrives at the same shipping figure the customer was shown.
const HEAVY_SHIPPING_KEYWORDS = [
  "desktop", "system", "custom", "rig", "workstation", "ascend",
  "workpro", "creator", "signature", "display", "monitor", "screen",
];
const HEAVY_SHIPPING_COST = 1200;

function collectComponentIds(specs: Record<string, unknown>): string[] {
  const ids: string[] = [];
  for (const comp of Object.values(specs)) {
    if (comp && typeof comp === "object") {
      const cid = (comp as { id?: unknown }).id;
      if (typeof cid === "string") ids.push(cid);
    }
  }
  return ids;
}

/**
 * Recompute the authoritative totals for a cart.
 *
 * @throws PricingError if the cart is empty or any line item's price cannot be
 *         verified against the products table (fail closed — never fall back to
 *         the client-supplied price).
 */
export async function computeCartTotals(
  supabase: SupabaseClient,
  cartItems: IncomingCartItem[],
  couponCode?: string | null,
  userId?: string | null
): Promise<CartTotals> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new PricingError("Cart is empty.");
  }

  // 1. Gather every product id we must price: standalone products by id, plus
  //    the component ids nested inside custom/prebuilt build specs.
  const idSet = new Set<string>();
  for (const item of cartItems) {
    if (item.specs && typeof item.specs === "object" && Object.keys(item.specs).length > 0) {
      for (const cid of collectComponentIds(item.specs)) idSet.add(cid);
    } else if (typeof item.id === "string" && UUID_RE.test(item.id)) {
      idSet.add(item.id);
    }
  }

  // 2. Fetch authoritative prices in one query.
  const priceMap = new Map<string, number>();
  if (idSet.size > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, price")
      .in("id", Array.from(idSet));
    if (error) throw new PricingError("Failed to load product prices.");
    for (const row of data || []) {
      priceMap.set(row.id as string, Number(row.price));
    }
  }

  // 3. Price each line item strictly from the DB.
  let subtotal = 0;
  const unverified: string[] = [];
  const lineItems: CartTotals["lineItems"] = [];

  for (const item of cartItems) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    let unitPrice: number | null = null;

    if (item.specs && typeof item.specs === "object" && Object.keys(item.specs).length > 0) {
      // Custom build / prebuilt commission: sum the DB price of each component.
      let sum = 0;
      let allFound = true;
      for (const cid of collectComponentIds(item.specs)) {
        if (priceMap.has(cid)) sum += priceMap.get(cid)!;
        else allFound = false;
      }
      if (allFound && sum > 0) unitPrice = sum;
    } else if (typeof item.id === "string" && UUID_RE.test(item.id) && priceMap.has(item.id)) {
      unitPrice = priceMap.get(item.id)!;
    }

    if (unitPrice === null || isNaN(unitPrice) || unitPrice < 0) {
      unverified.push(item.name || item.id || "unknown item");
      continue;
    }

    subtotal += unitPrice * qty;
    lineItems.push({ name: item.name || "", unitPrice, quantity: qty });
  }

  if (unverified.length > 0) {
    throw new PricingError(
      `Could not verify current price for: ${unverified.join(", ")}. Please refresh your cart and try again.`
    );
  }

  // 4. Shipping — recomputed from the same cart categories the client used.
  const needsHeavy = cartItems.some((item) => {
    const cat = (item.category || "").toLowerCase();
    return HEAVY_SHIPPING_KEYWORDS.some((k) => cat.includes(k));
  });
  const shipping = needsHeavy ? HEAVY_SHIPPING_COST : 0;

  // 5. Coupon — validated server-side via the same DB function the UI uses.
  let discount = 0;
  let appliedCoupon: string | null = null;
  if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        input_code: couponCode.trim(),
        cart_value: subtotal,
        user_id: userId || null,
      });
      if (!error && data && data.valid !== false) {
        if (data.type === "PERCENT") {
          discount = Math.round((subtotal * Number(data.value)) / 100);
        } else {
          discount = Number(data.value);
        }
        if (isNaN(discount) || discount < 0) discount = 0;
        if (discount > subtotal) discount = subtotal;
        appliedCoupon = couponCode.trim().toUpperCase();
      }
    } catch {
      // A failed coupon lookup must never inflate the order — treat as no discount.
      discount = 0;
      appliedCoupon = null;
    }
  }

  const total = Math.max(0, subtotal + shipping - discount);

  return { subtotal, shipping, discount, appliedCoupon, total, lineItems };
}

/**
 * Given the authoritative total and the chosen payment mode, return how much is
 * collected now vs. on delivery. Computed server-side so the split can't be forged.
 */
export function splitPayment(
  total: number,
  paymentMode: "ONLINE" | "PARTIAL_COD" | "COD"
): { amountPaid: number; pendingAmount: number } {
  if (paymentMode === "COD") {
    return { amountPaid: 0, pendingAmount: total };
  }
  if (paymentMode === "PARTIAL_COD") {
    const amountPaid = Math.round(total * 0.1);
    return { amountPaid, pendingAmount: total - amountPaid };
  }
  // ONLINE
  return { amountPaid: total, pendingAmount: 0 };
}
