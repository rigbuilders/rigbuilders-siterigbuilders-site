import { NextResponse } from "next/server";

// DEPRECATED / DISABLED.
//
// Account creation is handled entirely by Supabase Auth (see app/signup/page.tsx,
// which calls supabase.auth.signUp). This legacy Prisma-based signup route is
// unused by the app and wrote to a separate Neon `user` table — a duplicate auth
// surface that allowed unauthenticated account creation. It is disabled so there
// is a single source of truth for users.

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Create an account via the app (Supabase Auth)." },
    { status: 410 }
  );
}
