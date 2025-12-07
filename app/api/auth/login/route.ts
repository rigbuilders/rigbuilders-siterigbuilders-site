import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Login Request for:", email);

    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 2. Validate User & Password
    if (!user || user.password !== password) {
      console.log("❌ Invalid credentials");
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 3. Success
    console.log("✅ Login Successful:", user.email);
    
    // Remove password before sending back
    const { password: key, ...userWithoutPassword } = user;
    
    return NextResponse.json({ 
      message: "Login successful", 
      user: userWithoutPassword 
    }, { status: 200 });

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}