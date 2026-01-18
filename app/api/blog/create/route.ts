import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// HELPER: Convert "Best PC 2025" -> "best-pc-2025"
function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace strange chars with hyphens
    .replace(/(^-|-$)+/g, "");   // Remove start/end hyphens
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Removed 'password' from destructuring since it is no longer sent or checked
    const { title, content, excerpt, image, tags } = body;

    // --- SECURITY CHECK REMOVED ---
    // (Proceeding directly to creation)

    // 1. Auto-Generate Slug
    let slug = generateSlug(title);
    
    // Check if slug exists (to avoid duplicates)
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 2. Save to Database
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        image,
        tags,
        published: true, // Auto-publish immediately
      },
    });

    return NextResponse.json({ message: "Post Created", post: newPost }, { status: 201 });

  } catch (error) {
    console.error("Blog Error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}