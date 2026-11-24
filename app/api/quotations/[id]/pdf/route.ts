import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateQuotationPDF, type QuotationItem } from "@/lib/chatbot/quotation-pdf";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET /api/quotations/:id/pdf — a signed-in customer downloads their own
// finalized quotation as a branded PDF. Ownership is enforced server-side:
// the bearer token must resolve to the user the quotation is linked to.
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) return NextResponse.json({ error: "Sign in to download this quotation." }, { status: 401 });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user?.id) return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  const uid = userData.user.id;

  const { data: q, error } = await admin.from("quotations").select("*").eq("id", id).single();
  if (error || !q) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  if (q.user_id !== uid || q.status !== "final") {
    return NextResponse.json({ error: "You don't have access to this quotation." }, { status: 403 });
  }

  // Flatten the stored category/part tree into priced line items.
  const cats = q.data?.cats || [];
  const items: QuotationItem[] = [];
  for (const c of cats) {
    for (const p of c.parts || []) {
      if (!p?.name) continue;
      const qty = Number(p.qty) || 1;
      items.push({
        name: qty > 1 ? `${p.name} ×${qty}` : p.name,
        price: (Number(p.price) || 0) * qty,
        category: c.dbCat || null,
      });
    }
  }

  const filename = `${q.quotation_no || "RigBuilders_Quotation"}.pdf`;
  const streamPdf = (buf: Buffer | Uint8Array) =>
    new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  // 1. Prefer the archived copy in the private bucket (what was emailed/finalized).
  if (q.quotation_no) {
    try {
      const { data: file } = await admin.storage.from("quotations").download(`${q.quotation_no}.pdf`);
      if (file) return streamPdf(Buffer.from(await file.arrayBuffer()));
    } catch { /* not archived yet — fall through to generate */ }
  }

  // 2. Fallback: generate on demand (older quotes, or if the archive is missing),
  //    then cache it back to the bucket so next time it's served from storage.
  try {
    const pdf = await generateQuotationPDF(items, {
      quotationNo: q.quotation_no || undefined,
      customerName: q.customer || undefined,
      buildName: q.title || undefined,
      customerEmail: q.show_email ? q.customer_email || undefined : undefined,
      customerPhone: q.show_phone ? q.customer_phone || undefined : undefined,
      customerAddress: q.show_address ? q.customer_address || undefined : undefined,
      validUntil: q.valid_until || undefined,
      delivery: Number(q.delivery) || 0,
      gst: {
        show: q.data?.showGst !== false,
        location: (q.gst_location as "punjab" | "outside") || "punjab",
        inclusive: !!q.gst_inclusive,
      },
    });
    if (q.quotation_no) {
      admin.storage.from("quotations").upload(`${q.quotation_no}.pdf`, pdf, { contentType: "application/pdf", upsert: true }).catch(() => {});
    }
    return streamPdf(pdf);
  } catch (err) {
    console.error(`[quotation pdf] ${(err as Error).message}`);
    return NextResponse.json({ error: "PDF generation failed." }, { status: 500 });
  }
}
