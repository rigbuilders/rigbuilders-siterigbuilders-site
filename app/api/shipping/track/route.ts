import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { track, isConfigured } from "@/lib/shipping/bluedart";

export const dynamic = "force-dynamic";

// POST { awb } → LIVE Blue Dart tracking for one AWB (normalized scans + latest).
// Admin only. Read-only; does not touch the DB.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) return NextResponse.json({ error: "Blue Dart not configured." }, { status: 400 });

  const { awb } = await req.json().catch(() => ({}));
  if (!awb) return NextResponse.json({ error: "awb is required." }, { status: 400 });

  try {
    const result = await track(String(awb));
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Tracking failed." }, { status: 500 });
  }
}
