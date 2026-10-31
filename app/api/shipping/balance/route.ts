import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getBalance, isConfigured } from "@/lib/shipping/bluedart";

export const dynamic = "force-dynamic";

// GET → best-effort Blue Dart account balance. Admin only.
// Degrades gracefully: { supported:false } when the account doesn't expose one.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isConfigured()) {
    return NextResponse.json({ supported: false, available: null, note: "Blue Dart not configured." });
  }
  const result = await getBalance();
  return NextResponse.json(result);
}
