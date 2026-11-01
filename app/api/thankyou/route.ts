import { renderThankYou, ThankTemplate } from "@/lib/thankyou";

export const dynamic = "force-dynamic";

// GET ?tpl=builds|components|accessories&by=<assembler>&qr=<url>&ql=<caption>
// Returns a self-contained A4 thank-you note as HTML, opened in a new tab and
// printed to PDF by the admin. The note carries no customer PII (just the
// assembler name + a QR), so it isn't gated behind admin auth — it's the same
// note the customer receives in the box.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tpl = (url.searchParams.get("tpl") || "components") as ThankTemplate;
  const by = url.searchParams.get("by") || "Rig Builders Team";
  const qr = url.searchParams.get("qr") || "https://www.rigbuilders.in";
  const ql = url.searchParams.get("ql") || undefined;

  const valid: ThankTemplate[] = ["builds", "components", "accessories"];
  const template = valid.includes(tpl) ? tpl : "components";

  const html = renderThankYou({ template, assembler: by, qrUrl: qr, qrLabel: ql });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
