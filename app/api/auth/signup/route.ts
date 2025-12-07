import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body;

    // DEBUG LOG 1: What data arrived?
    console.log("----- SIGNUP ATTEMPT -----");
    console.log("Data Received:", { email, fullName, phone }); // Don't log password

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      console.log("❌ ERROR: Email already registered");
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    console.log("📝 Attempting to write to database...");

    // Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        fullName,
        phone,
      },
    });

    console.log("✅ SUCCESS: User created with ID:", newUser.id);
    return NextResponse.json({ message: "User created" }, { status: 201 });

  } catch (error: any) {
    // DEBUG LOG 2: Why did it crash?
    console.log("❌ CRITICAL DATABASE ERROR:", error.message);
    return NextResponse.json({ error: error.message || "Database Connection Failed" }, { status: 500 });
  }
}