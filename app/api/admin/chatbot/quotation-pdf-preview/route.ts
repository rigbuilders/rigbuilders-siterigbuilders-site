import { NextResponse } from "next/server";
import { generateQuotationPDF } from "@/lib/chatbot/quotation-pdf";

// Webhook payloads must never be cached or statically rendered — same reason
// applies here since the PDF is generated fresh each time.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chatbot/quotation-pdf-preview — visit this in a browser to
 * download a sample quotation PDF and check the design. No auth gate: it
 * only ever renders hardcoded sample line items below, never real customer
 * or order data, so there's nothing sensitive to protect — this exists
 * purely so the template's look can be checked without wiring up the full
 * multi-product quotation flow first. Safe to delete once that's built and
 * the design is confirmed.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const pdf = await generateQuotationPDF(
      [
        { name: "AMD Ryzen 7 7800X3D Desktop Processor", price: 41789, category: "cpu" },
        { name: "MSI GeForce RTX 5060 8G Shadow 2X OC", price: 38849, category: "gpu" },
        { name: "MSI B550M PRO-VDH WiFi Motherboard", price: 9499, category: "motherboard" },
        { name: "Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz", price: 11299, category: "ram" },
        { name: "WD Black SN850X 1TB NVMe SSD", price: 8999, category: "storage" },
        { name: "Seagate Barracuda 2TB HDD", price: 4499, category: "storage" },
        { name: "Deepcool AK620 Dual Tower Air Cooler", price: 5499, category: "cooler" },
        { name: "Deepcool PK550D 550W 80+ Bronze PSU", price: 3799, category: "psu" },
        { name: "Lian Li Lancool 216 Mid Tower Cabinet", price: 8299, category: "cabinet" },
        { name: "LG 27GP850 27-inch 165Hz QHD Monitor", price: 27999, category: "monitor" },
      ],
      { customerName: "Sample Customer" }
    );

    // NextResponse's body type (BodyInit) doesn't accept a Node Buffer
    // directly under this Next.js/TS version — wrapping in a Blob is the
    // safest fix (a plain Uint8Array view can misbehave if the Buffer came
    // from a pooled allocation with a larger underlying ArrayBuffer).
    return new NextResponse(new Blob([pdf], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="RigBuilders_Quotation_Preview.pdf"',
      },
    });
  } catch (err) {
    console.error(`[quotation-pdf-preview] generation failed: ${(err as Error).message}`);
    return NextResponse.json({ error: "PDF generation failed", detail: (err as Error).message }, { status: 500 });
  }
}
