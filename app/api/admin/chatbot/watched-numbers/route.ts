import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { addWatched, listWatched, removeWatched } from "@/lib/chatbot/watchlist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  try {
    const watched = await listWatched();
    return NextResponse.json({ watched });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** Body: { channel: string, externalUserId: string, label?: string } */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const body = await req.json().catch(() => null);
  const channel: string | undefined = body?.channel;
  const externalUserId: string | undefined = body?.externalUserId;
  const label: string | undefined = body?.label;

  if (!channel || !externalUserId) {
    return NextResponse.json({ error: "channel and externalUserId are required" }, { status: 400 });
  }

  try {
    const created = await addWatched(channel, externalUserId.trim(), label);
    return NextResponse.json({ watched: created });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** Body: { id: string } */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const body = await req.json().catch(() => null);
  const id: string | undefined = body?.id;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await removeWatched(id);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
