import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createQuestion, getAllQuestions, reorderQuestions } from "@/lib/chatbot/build-questions";

export const dynamic = "force-dynamic";

/** GET — every question including retired ones, for the editor. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  try {
    return NextResponse.json({ questions: await getAllQuestions() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** POST — create a question, or reorder the whole list when `order` is sent. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    if (Array.isArray(body.order)) {
      await reorderQuestions(body.order as string[]);
      return NextResponse.json({ status: "ok" });
    }

    const briefKey = String(body.briefKey ?? "").trim();
    const label = String(body.label ?? "").trim();
    if (!briefKey || !label) {
      return NextResponse.json({ error: "briefKey and label are required" }, { status: 400 });
    }
    // Keys end up as object keys in build_brief and are matched exactly, so
    // whitespace or punctuation in one is a bug waiting to happen.
    if (!/^[a-z0-9_]+$/.test(briefKey)) {
      return NextResponse.json(
        { error: "briefKey must be lowercase letters, numbers and underscores only" },
        { status: 400 }
      );
    }

    const question = await createQuestion({
      briefKey,
      label,
      hint: body.hint ?? null,
      answerType: body.answerType ?? "choice",
      options: Array.isArray(body.options) ? body.options : [],
      placeholder: body.placeholder ?? null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ question });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
