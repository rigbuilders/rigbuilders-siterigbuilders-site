import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword, isHashed } from "@/lib/password";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 2. Validate password (supports scrypt hashes and legacy plaintext).
    //    Always run a comparison to avoid trivially leaking whether the email exists.
    const stored = user?.password ?? "scrypt$00$00";
    const valid = user ? await verifyPassword(password, stored) : false;

    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 3. Transparent migration: upgrade any legacy plaintext record to a hash.
    if (!isHashed(user.password)) {
      try {
        const upgraded = await hashPassword(password);
        await prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
      } catch (e) {
        console.error("Password upgrade failed (non-fatal):", e);
      }
    }

    // 4. Success — strip the password before returning.
    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "Login successful", user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
