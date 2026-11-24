import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → every customer, newest first, each annotated with how many quotations
// they have and whether a website login exists.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: customers, error } = await admin
    .from("customers")
    .select("id, name, email, phone, address, user_id, source, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Quotation counts per customer (one small query, counted in JS).
  const counts: Record<string, number> = {};
  try {
    const { data: qs } = await admin.from("quotations").select("customer_id").not("customer_id", "is", null);
    for (const q of qs || []) if (q.customer_id) counts[q.customer_id] = (counts[q.customer_id] || 0) + 1;
  } catch { /* counts are a nicety */ }

  return NextResponse.json({
    customers: (customers || []).map((c) => ({ ...c, quotation_count: counts[c.id] || 0 })),
  });
}

// PATCH { id, name?, email?, phone?, address? } → edit a customer. If the customer
// has a linked website login, name/email are mirrored onto that auth account too.
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const { data: current, error: curErr } = await admin.from("customers").select("*").eq("id", id).single();
  if (curErr || !current) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const patch: any = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) patch.name = String(body.name).trim() || null;
  if (body.phone !== undefined) patch.phone = String(body.phone).trim() || null;
  if (body.address !== undefined) patch.address = String(body.address).trim() || null;
  if (body.email !== undefined) patch.email = String(body.email).trim().toLowerCase() || null;

  const { data: updated, error } = await admin.from("customers").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mirror onto the linked auth account (non-fatal — the directory row is the
  // source of truth; auth sync just keeps the login consistent).
  let warning: string | null = null;
  if (current.user_id) {
    const authPatch: any = {};
    if (patch.name !== undefined) authPatch.user_metadata = { ...(body.metadata || {}), full_name: patch.name || "" };
    if (patch.email !== undefined && patch.email && patch.email !== (current.email || "").toLowerCase()) {
      authPatch.email = patch.email;
      authPatch.email_confirm = true;
    }
    if (Object.keys(authPatch).length) {
      const { error: aErr } = await admin.auth.admin.updateUserById(current.user_id, authPatch);
      if (aErr) warning = `Saved, but the linked login couldn't be updated: ${aErr.message}`;
    }
  }

  return NextResponse.json({ customer: { ...updated, quotation_count: undefined }, warning });
}

// DELETE ?id=...[&withAccount=1] → remove the customer directory row. By default
// the website login (if any) is left intact so the person can still sign in and
// see past quotations; pass withAccount=1 to also delete the auth account.
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const withAccount = url.searchParams.get("withAccount") === "1";
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const { data: current } = await admin.from("customers").select("user_id").eq("id", id).single();

  const { error } = await admin.from("customers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let accountDeleted = false;
  if (withAccount && current?.user_id) {
    try { await admin.auth.admin.deleteUser(current.user_id); accountDeleted = true; } catch { /* non-fatal */ }
  }
  return NextResponse.json({ ok: true, accountDeleted });
}
