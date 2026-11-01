import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → active staff (assemblers / packagers) for the thank-you dropdown.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await admin
    .from("staff")
    .select("id, name, role, active")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data || [] });
}

// POST { name, role? } → add a new assembler/packager.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const row = { name, role: body?.role || "both" };
  const { data, error } = await admin
    .from("staff")
    .upsert(row, { onConflict: "name", ignoreDuplicates: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
