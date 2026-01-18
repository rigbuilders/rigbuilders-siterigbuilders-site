import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { type, postId, commentId, comment, author } = await request.json();

    // 1. POST LIKES/DISLIKES
    if (type === "LIKE") {
        await prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } });
        return NextResponse.json({ success: true });
    }
    if (type === "DISLIKE") {
        await prisma.post.update({ where: { id: postId }, data: { dislikes: { increment: 1 } } });
        return NextResponse.json({ success: true });
    }

    // 2. COMMENT LIKES/DISLIKES
    if (type === "COMMENT_LIKE") {
        await prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: 1 } } });
        return NextResponse.json({ success: true });
    }
    if (type === "COMMENT_DISLIKE") {
        await prisma.comment.update({ where: { id: commentId }, data: { dislikes: { increment: 1 } } });
        return NextResponse.json({ success: true });
    }

    // 3. POST NEW COMMENT OR REPLY
    if (type === "COMMENT") {
        const newComment = await prisma.comment.create({
            data: {
                content: comment,
                author: author || "Guest Builder",
                postId: postId,
                parentId: commentId || null // If commentId exists, it's a reply
            }
        });
        return NextResponse.json({ success: true, comment: newComment });
    }

    return NextResponse.json({ error: "Invalid Type" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Interaction Failed" }, { status: 500 });
  }
}

// Fetch comments with their replies
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    const comments = await prisma.comment.findMany({
        where: { 
            postId: postId!,
            parentId: null // Fetch top-level comments only
        },
        include: {
            replies: { orderBy: { createdAt: 'asc' } } // Include nested replies
        },
        orderBy: { createdAt: "desc" }
    });
    
    return NextResponse.json(comments);
}

// --- APPEND THIS AT THE BOTTOM OF THE FILE ---

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
        return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    // 1. Delete all replies first (Cascade)
    await prisma.comment.deleteMany({
        where: { parentId: commentId }
    });

    // 2. Delete the comment itself
    await prisma.comment.delete({
        where: { id: commentId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}