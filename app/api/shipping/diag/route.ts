import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { diagnose, isConfigured } from "@/lib/shipping/bluedart";

export const dynamic = "force-dynamic";

// POST { rate?: { originPincode, destPincode, weightKg, pieces, declaredValue } }
// Safe sandbox connectivity check — token + (optional) read-only rate finder.
// Never generates a waybill or books a pickup. Admin only. Secrets redacted.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) {
    return NextResponse.json({ error: "Blue Dart not configured — check BLUEDART_* env vars." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await diagnose({ rate: body?.rate });
  return NextResponse.json(result);
}
