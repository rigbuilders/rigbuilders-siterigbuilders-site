import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const prisma = new PrismaClient();

// HELPER: Convert "Best PC 2025" -> "best-pc-2025"
function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request: Request) {
  try {
    // SECURITY: only authenticated admins may create posts.
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { title, content, excerpt, image, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // 1. Auto-Generate Slug
    let slug = generateSlug(title);
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 2. Save (sanitize HTML as a defense-in-depth against stored XSS).
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        content: sanitizeHtml(content),
        excerpt,
        image,
        tags,
        published: true,
      },
    });

    return NextResponse.json({ message: "Post Created", post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Blog Error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
