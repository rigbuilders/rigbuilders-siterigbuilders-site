import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET → list distributor_users with email + the date the Auth account was created.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: rows, error } = await admin
    .from("distributor_users")
    .select("user_id, email, label");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map user_id → created_at from the Auth admin API (small roster; one page).
  const createdById: Record<string, string> = {};
  try {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    for (const u of list?.users || []) createdById[u.id] = u.created_at as string;
  } catch { /* non-fatal — dates just won't show */ }

  const distributors = (rows || []).map((r) => ({
    user_id: r.user_id,
    email: r.email,
    label: r.label,
    created_at: createdById[r.user_id] || null,
  }));
  return NextResponse.json({ distributors });
}

// POST { email, password, label? } → create the Auth user AND the membership row.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const label = (body?.label || "").trim() || null;
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  // 1. Create (or find) the Auth user.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  let userId = created?.user?.id;
  if (createErr) {
    // If the user already exists, look them up so we can still grant membership.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    const existing = (list?.users || []).find((u) => (u.email || "").toLowerCase() === email);
    if (!existing) return NextResponse.json({ error: createErr.message }, { status: 400 });
    userId = existing.id;
  }
  if (!userId) return NextResponse.json({ error: "Could not resolve the user id." }, { status: 500 });

  // 2. Grant distributor membership.
  const { error: insErr } = await admin
    .from("distributor_users")
    .upsert({ user_id: userId, email, label }, { onConflict: "user_id" });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Default new distributors to full-catalogue access (admin can restrict from
  // the Access panel). Best-effort: if the scope table isn't applied yet, ignore.
  try {
    const { data: existing } = await admin.from("distributor_scope").select("id").eq("user_id", userId).limit(1);
    if (!existing || existing.length === 0) {
      await admin.from("distributor_scope").insert({ user_id: userId, scope_type: "all" });
    }
  } catch { /* scope table not applied yet — harmless */ }

  return NextResponse.json({ ok: true, user_id: userId, email, label });
}

// PATCH { userId, label?, email?, password? } → edit a distributor's details.
// label/email update the membership row; email/password update the Auth account.
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const userId = body?.userId;
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const newEmail = body?.email ? String(body.email).trim().toLowerCase() : undefined;
  const newPassword = body?.password ? String(body.password) : undefined;
  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // 1. Auth account (email / password).
  const authPatch: any = {};
  if (newEmail) { authPatch.email = newEmail; authPatch.email_confirm = true; }
  if (newPassword) authPatch.password = newPassword;
  if (Object.keys(authPatch).length) {
    const { error } = await admin.auth.admin.updateUserById(userId, authPatch);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 2. Membership row (label / email mirror).
  const rowPatch: any = {};
  if (body?.label !== undefined) rowPatch.label = String(body.label).trim() || null;
  if (newEmail) rowPatch.email = newEmail;
  if (Object.keys(rowPatch).length) {
    const { error } = await admin.from("distributor_users").update(rowPatch).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE ?userId=... → revoke membership (soft-disable). The Auth user is left
// in place deliberately: they can still sign in but the view returns nothing.
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const { error } = await admin.from("distributor_users").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
