import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: Fetch all posts for the sidebar list
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { comments: true } // Fetch count of comments
        }
      }
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// 2. PUT: Update an existing post
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content, excerpt, image, tags } = body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { title, content, excerpt, image, tags },
    });

    return NextResponse.json({ message: "Updated", post: updatedPost });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// 3. DELETE: Remove a post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}