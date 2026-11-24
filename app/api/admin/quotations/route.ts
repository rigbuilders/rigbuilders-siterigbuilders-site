import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { generateQuotationNo } from "@/lib/id-generator";
import { generateQuotationPDF, type QuotationItem } from "@/lib/chatbot/quotation-pdf";
import { Resend } from "resend";
import QuotationReadyEmail from "@/components/emails/QuotationReadyEmail";

const QUOTES_BUCKET = "quotations"; // PRIVATE Supabase Storage bucket for archived PDFs

// Build + upload an archival PDF copy of a finalized quotation to the private
// bucket (path = "<quotation_no>.pdf"). Best-effort: the customer download route
// still regenerates on demand, so a failed archive never blocks the save.
async function archiveQuotationPdf(body: any, quotationNo: string) {
  const cats = body?.data?.cats || [];
  const items: QuotationItem[] = [];
  for (const c of cats) for (const p of c.parts || []) {
    if (!p?.name) continue;
    const qty = Number(p.qty) || 1;
    items.push({ name: qty > 1 ? `${p.name} ×${qty}` : p.name, price: (Number(p.price) || 0) * qty, category: c.dbCat || null });
  }
  const pdf = await generateQuotationPDF(items, {
    quotationNo,
    customerName: body?.customer || undefined,
    buildName: body?.title || undefined,
    customerEmail: body?.show_email ? body?.customer_email || undefined : undefined,
    customerPhone: body?.show_phone ? body?.customer_phone || undefined : undefined,
    customerAddress: body?.show_address ? body?.customer_address || undefined : undefined,
    validUntil: body?.valid_until || undefined,
    delivery: Number(body?.delivery) || 0,
    gst: { show: body?.data?.showGst !== false, location: body?.gst_location || "punjab", inclusive: !!body?.gst_inclusive },
  });
  const { error } = await admin.storage.from(QUOTES_BUCKET).upload(`${quotationNo}.pdf`, pdf, {
    contentType: "application/pdf",
    upsert: true, // re-finalizing overwrites the stored copy
  });
  if (error) throw error;
}

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// A strong throwaway password for the auto-created account. The customer never
// uses it (they arrive via a magic login link and set their own password), but
// Supabase's password policy requires at least one lowercase, uppercase, digit
// and symbol — so we guarantee one of each, then fill + shuffle with crypto.
function strongPassword(): string {
  const sets = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*()_+-="];
  const all = sets.join("");
  const bytes = new Uint8Array(28);
  crypto.getRandomValues(bytes);
  const chars: string[] = [];
  sets.forEach((s, i) => chars.push(s[bytes[i] % s.length]));            // one from each class
  for (let i = sets.length; i < bytes.length; i++) chars.push(all[bytes[i] % all.length]);
  const sh = new Uint8Array(chars.length);
  crypto.getRandomValues(sh);
  for (let i = chars.length - 1; i > 0; i--) { const j = sh[i] % (i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; } // Fisher–Yates
  return chars.join("");
}

const FIELDS = [
  "title", "customer", "valid_until", "status", "include_floor", "gst_location", "gst_inclusive",
  "delivery", "data", "total",
  "customer_email", "customer_phone", "customer_address", "show_email", "show_phone", "show_address",
] as const;
function pick(body: any) {
  const row: any = {};
  for (const f of FIELDS) if (body[f] !== undefined) row[f] = body[f];
  return row;
}

// GET → list saved quotations (newest first). ?id= returns one full quotation.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const { data, error } = await admin.from("quotations").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ quotation: data });
  }
  const { data, error } = await admin
    .from("quotations")
    .select("id, title, customer, status, total, valid_until, quotation_no, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotations: data || [] });
}

// Find-or-create the website auth account for a customer email. Returns the
// user id and whether it was freshly created (so the email can greet them right).
async function ensureCustomerAccount(email: string, name?: string): Promise<{ userId: string; created: boolean }> {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    // Random throwaway password — the customer never needs it; they arrive via a
    // magic login link and can set their own password from the dashboard.
    password: strongPassword(),
    email_confirm: true,
    user_metadata: { full_name: name || "", source: "quotation", onboarded: false },
  });
  if (!createErr && created?.user?.id) return { userId: created.user.id, created: true };

  // Already exists → look them up (don't touch their metadata/password).
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
  const existing = (list?.users || []).find((u) => (u.email || "").toLowerCase() === email);
  if (existing) return { userId: existing.id, created: false };
  throw new Error(createErr?.message || "Could not create the customer account.");
}

// POST → create or update a quotation. Pass `id` to update; omit to insert.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const row = pick(body);
  row.updated_at = new Date().toISOString();

  let emailed = false;
  let assignedNo: string | null = null;

  // ---- Finalize side-effects (status → "final"/"quoted") -------------------
  // Only on finalize do we: stamp a quotation number, record the customer in the
  // directory, auto-create their website account, and email a seamless login
  // link. Guarded so re-saving an already-final quotation never re-sends.
  if (row.status === "final") {
    // Load the prior row (if editing) to avoid re-stamping / re-emailing.
    let prior: any = null;
    if (body?.id) {
      const { data } = await admin.from("quotations").select("quotation_no, user_id, customer_id").eq("id", body.id).single();
      prior = data || null;
    }

    // 1. Quotation number — assign once, keep stable.
    assignedNo = prior?.quotation_no || (await generateQuotationNo(admin));
    row.quotation_no = assignedNo;

    const name = (body?.customer || "").trim();
    const email = (body?.customer_email || "").trim().toLowerCase();
    const phone = (body?.customer_phone || "").trim();
    const address = (body?.customer_address || "").trim();
    const alreadyLinked = !!prior?.user_id;

    // 2. Account (needs an email). Create/find, link, and email the login link —
    //    but only the first time this quotation is finalized.
    let userId: string | null = prior?.user_id || null;
    let created = false;
    if (email && !alreadyLinked) {
      try {
        const acc = await ensureCustomerAccount(email, name);
        userId = acc.userId;
        created = acc.created;
      } catch (e: any) {
        return NextResponse.json({ error: `Account setup failed: ${e.message}` }, { status: 500 });
      }
    }
    if (userId) row.user_id = userId;

    // 3. Customer directory row (dedup by prior link → email → new).
    try {
      const custPatch: any = { name: name || null, email: email || null, phone: phone || null, address: address || null, user_id: userId, updated_at: new Date().toISOString() };
      let customerId: string | null = prior?.customer_id || null;
      if (customerId) {
        await admin.from("customers").update(custPatch).eq("id", customerId);
      } else {
        let existingCust: any = null;
        if (email) {
          const { data } = await admin.from("customers").select("id").ilike("email", email).limit(1);
          existingCust = data?.[0] || null;
        }
        if (existingCust) {
          await admin.from("customers").update(custPatch).eq("id", existingCust.id);
          customerId = existingCust.id;
        } else {
          const { data } = await admin.from("customers").insert({ ...custPatch, source: "quotation" }).select("id").single();
          customerId = data?.id || null;
        }
      }
      if (customerId) row.customer_id = customerId;
    } catch { /* directory is best-effort — never block saving the quotation */ }

    // 4. Email the seamless login link (first finalize with an email only).
    if (email && !alreadyLinked && userId && resend) {
      try {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${SITE_URL}/dashboard?tab=quotations&welcome=1` },
        });
        const loginLink = linkData?.properties?.action_link;
        if (loginLink) {
          await resend.emails.send({
            from: "Rig Builders <support@rigbuilders.in>",
            to: [email],
            subject: `Your Rig Builders quotation ${assignedNo} is ready`,
            react: QuotationReadyEmail({
              loginLink,
              quotationNo: assignedNo,
              buildName: body?.title || undefined,
              total: Number(body?.total) || undefined,
              userName: name || undefined,
              newAccount: created,
            }),
          });
          emailed = true;
          row.login_email_sent_at = new Date().toISOString(); // durable proof the link was emailed
          console.log(`[quotations] login link emailed to ${email} for ${assignedNo}`);
        }
      } catch (e) {
        console.error("[quotations] login-link email failed:", (e as Error).message);
        // Non-fatal: the quotation is still saved + visible once they log in.
      }
    }

    // 5. Archive a PDF copy to the private bucket (best-effort).
    try {
      await archiveQuotationPdf(body, assignedNo);
      console.log(`[quotations] archived PDF ${assignedNo}.pdf to bucket "${QUOTES_BUCKET}"`);
    } catch (e) {
      console.error("[quotations] PDF archive failed:", (e as Error).message);
    }
  }

  let res;
  if (body?.id) {
    res = await admin.from("quotations").update(row).eq("id", body.id).select("id, status, quotation_no").single();
  } else {
    res = await admin.from("quotations").insert(row).select("id, status, quotation_no").single();
  }
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  return NextResponse.json({ quotation: res.data, emailed, quotation_no: assignedNo });
}

// DELETE ?id=...
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await admin.from("quotations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
