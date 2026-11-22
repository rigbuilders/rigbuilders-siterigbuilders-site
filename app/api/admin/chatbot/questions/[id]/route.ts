import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { deleteQuestion, updateQuestion } from "@/lib/chatbot/build-questions";

export const dynamic = "force-dynamic";

/**
 * PATCH — edit a question.
 *
 * brief_key is intentionally not accepted: answers already collected are
 * filed under it, so changing it would orphan them and customers would be
 * asked again. Retire the question and add a new one instead.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    await updateQuestion(id, {
      label: body.label,
      hint: body.hint,
      answerType: body.answerType,
      options: body.options,
      placeholder: body.placeholder,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * DELETE — removes a question outright.
 *
 * Prefer setting isActive false in the UI: deleting loses the record of what
 * a historical answer was even asking, which matters when reading an old
 * brief months later.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });

  const { id } = await params;
  try {
    await deleteQuestion(id);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
