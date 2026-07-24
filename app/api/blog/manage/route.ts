import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const prisma = new PrismaClient();

// 1. GET: Fetch all posts for the sidebar list (admin-only: exposes unpublished/all).
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { comments: true } },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Blog fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// 2. PUT: Update an existing post
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, title, content, excerpt, image, tags } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content: content !== undefined ? sanitizeHtml(content) : undefined,
        excerpt,
        image,
        tags,
      },
    });

    return NextResponse.json({ message: "Updated", post: updatedPost });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// 3. DELETE: Remove a post
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
