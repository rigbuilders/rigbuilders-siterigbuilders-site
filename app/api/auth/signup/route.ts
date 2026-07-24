import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // SECURITY: never store plaintext passwords.
    const hashed = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
        phone,
      },
    });

    return NextResponse.json({ message: "User created", userId: newUser.id }, { status: 201 });
  } catch (error) {
    // Log details server-side only; return a generic message to the client.
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
