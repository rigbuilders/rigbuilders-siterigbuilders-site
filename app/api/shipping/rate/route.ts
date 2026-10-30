import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getRate, isConfigured } from "@/lib/shipping/bluedart";

export const dynamic = "force-dynamic";

// POST { originPincode, destPincode, weightKg, pieces, declaredValue, isCOD,
//        codAmount, dims? } → estimated Blue Dart charge + transit. Admin only.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) return NextResponse.json({ error: "Blue Dart not configured." }, { status: 400 });

  try {
    const b = await req.json();
    if (!b?.originPincode || !b?.destPincode) {
      return NextResponse.json({ error: "originPincode and destPincode are required." }, { status: 400 });
    }

    const rate = await getRate({
      originPincode: String(b.originPincode),
      destPincode: String(b.destPincode),
      weightKg: Number(b.weightKg) || 1,
      pieces: Number(b.pieces) || 1,
      declaredValue: Number(b.declaredValue) || 0,
      isCOD: !!b.isCOD,
      codAmount: Number(b.codAmount) || 0,
      dims: b.dims && (b.dims.l || b.dims.w || b.dims.h)
        ? { l: Number(b.dims.l) || 0, w: Number(b.dims.w) || 0, h: Number(b.dims.h) || 0 }
        : undefined,
    });

    return NextResponse.json({ ok: true, total: rate.total, currency: rate.currency, transit: rate.transit, breakdown: rate.breakdown });
  } catch (e: any) {
    console.error("Rate check error:", e);
    return NextResponse.json({ error: e.message || "Rate check failed." }, { status: 500 });
  }
}
