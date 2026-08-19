// lib/adminAuth.ts
// Server-side admin authorization for API routes.
//
// The admin UI gates itself in the browser (client-side email check), which does
// nothing to protect the API. Any write route must independently verify the caller.
// The client sends its Supabase access token as `Authorization: Bearer <token>`;
// here we validate that token against Supabase and confirm the email is an admin.

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Comma-separated list in ADMIN_EMAILS, falling back to the known super-admin.
// Exported so other server-only code (e.g. chatbot handoff alerts) can reuse
// the same admin list instead of hardcoding it a second time.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "rigbuilders123@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AdminAuthResult {
  ok: boolean;
  email?: string;
  error?: string;
  status?: number;
}

/** Extract and validate the bearer token from a request; require an admin email. */
export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;

  if (!token) {
    return { ok: false, error: "Missing authorization token", status: 401 };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.email) {
    return { ok: false, error: "Invalid or expired session", status: 401 };
  }

  const email = data.user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, email };
}
