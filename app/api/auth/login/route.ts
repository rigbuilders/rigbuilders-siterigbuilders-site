import { NextResponse } from "next/server";

// DEPRECATED / DISABLED.
//
// Authentication is handled entirely by Supabase Auth (see app/signin/page.tsx,
// which calls supabase.auth.signInWithPassword). This legacy Prisma-based login
// route is unused by the app and previously stored/compared passwords in a
// separate Neon `user` table — a duplicate auth surface. It is disabled to remove
// that surface (spam accounts, enumeration) and to keep a single source of truth.
//
// Supabase Auth also provides built-in rate limiting / brute-force protection.

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Sign in via the app (Supabase Auth)." },
    { status: 410 }
  );
}
