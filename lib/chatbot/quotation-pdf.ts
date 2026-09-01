import React from "react";
import { Document, Page, View, Text, Image, Font, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

/**
 * Quotation PDF, built to match the clean look of the site's real invoices
 * (app/admin/ops/documents/OrderPDF.tsx) rather than a from-scratch design —
 * same white background, navy/steel palette, Saira font, dark table header,
 * clean divider lines. Uses @react-pdf/renderer (same library OrderPDF.tsx
 * uses) instead of jsPDF for that reason: matching OrderPDF's actual
 * StyleSheet values directly is what keeps this visually consistent with
 * the invoices customers already receive.
 *
 * OrderPDF.tsx itself only ever runs client-side (PDFViewer/PDFDownloadLink
 * in app/admin/ops/documents/page.tsx are browser components), with
 * `Font.register`/`<Image>` using paths relative to the current page's
 * origin — fine in a browser, meaningless in a Node serverless function
 * (there's no "current origin" to resolve against). This file is written to
 * run server-side instead (the WhatsApp quotation flow calls it from the
 * webhook route), so every asset URL below is absolute
 * (https://www.rigbuilders.in/...) rather than relative, and it renders via
 * `renderToBuffer` instead of a browser-only viewer/download component.
 *
 * No JSX here deliberately — this file's extension stays `.ts` (not `.tsx`)
 * to avoid a duplicate-module conflict with any existing `quotation-pdf`
 * file, so the document tree is built with plain `React.createElement`
 * calls, which is all JSX compiles down to anyway.
 */

const e = React.createElement;
const SITE_URL = "https://www.rigbuilders.in";
const NAVY = "#0b0b0b";
const STEEL = "#2e4a6b";

Font.register({
  family: "Saira",
  fonts: [
    { src: `${SITE_URL}/fonts/Saira-Regular.ttf`, fontWeight: "normal" },
    { src: `${SITE_URL}/fonts/Saira-Bold.ttf`, fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: { paddingHorizontal: 34, paddingVertical: 34, fontFamily: "Saira", fontSize: 10, color: "#111", lineHeight: 1.4 },

  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: `2px solid ${NAVY}`, paddingBottom: 16, marginBottom: 20 },
  headerLeft: { width: "55%" },
  headerRight: { width: "45%", alignItems: "flex-end" },
  // Explicit width AND height define a fixed box; objectFit: "contain" then
  // guarantees the full logo always fits inside it (letterboxed if needed)
  // instead of being cropped, regardless of the source image's own
  // proportions — objectFit has nothing to fit "into" without both
  // dimensions set, so leaving height unset would make it a no-op.
  logo: { width: 110, height: 40, marginBottom: 10, objectFit: "contain" },
  bizMeta: { fontSize: 8.5, color: "#444", lineHeight: 1.6 },
  bizStrong: { color: "#111" },
  docTitle: { fontSize: 22, fontWeight: "bold", color: STEEL, marginBottom: 20 },
  metaLine: { fontSize: 9, color: "#333", textAlign: "right", marginBottom: 5 },
  metaLabel: { color: "#888" },

  groupHeading: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: STEEL,
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
    borderBottom: "1px solid #dddddd",
    paddingBottom: 4,
  },

  tHead: { flexDirection: "row", backgroundColor: NAVY },
  th: { color: "#fff", fontSize: 7.5, paddingVertical: 6, paddingHorizontal: 4, fontWeight: "bold" },
  tRow: { flexDirection: "row", borderBottom: "1px solid #dddddd" },
  td: { fontSize: 9, paddingVertical: 7, paddingHorizontal: 4 },
  cSr: { width: "8%" },
  cDesc: { width: "72%" },
  cPrice: { width: "20%", textAlign: "right" },

  totals: { width: 250, alignSelf: "flex-end", marginTop: 18 },
  tGrand: { flexDirection: "row", justifyContent: "space-between", borderTop: `2px solid ${NAVY}`, marginTop: 5, paddingTop: 8 },
  tGrandLabel: { fontSize: 12, fontWeight: "bold", color: NAVY },
  tGrandVal: { fontSize: 12, fontWeight: "bold", color: STEEL },

  note: { fontSize: 8.5, color: "#666", marginTop: 18, borderTop: "1px solid #eeeeee", paddingTop: 10, lineHeight: 1.5 },

  foot: { borderTop: "1px solid #cccccc", paddingTop: 14, marginTop: 22 },
  footH: { fontSize: 8, color: "#888", letterSpacing: 0.6, marginBottom: 4 },
  footMeta: { fontSize: 9, lineHeight: 1.6, color: "#333" },
  footNote: { fontSize: 8, color: "#888", marginTop: 16, textAlign: "center" },
});

export interface QuotationItem {
  name: string;
  price: number;
  // Catalog category (e.g. "gpu", "cpu", "ram") — items are grouped under a
  // heading per category, matching how a customer actually thinks about a
  // build ("here's your GPU, here's your CPU...") rather than a flat list.
  category?: string | null;
}

export interface QuotationOptions {
  customerName?: string;
}

// Maps a raw category value to the display heading shown above its group.
// Falls back to the category string itself, uppercased, for anything not
// in this list rather than dropping it.
const CATEGORY_LABELS: Record<string, string> = {
  cpu: "PROCESSOR",
  processor: "PROCESSOR",
  gpu: "GRAPHICS CARD",
  graphics_card: "GRAPHICS CARD",
  "graphics-card": "GRAPHICS CARD",
  motherboard: "MOTHERBOARD",
  ram: "MEMORY",
  memory: "MEMORY",
  storage: "STORAGE",
  ssd: "STORAGE",
  hdd: "STORAGE",
  cooler: "COOLING",
  cooling: "COOLING",
  psu: "POWER SUPPLY",
  power_supply: "POWER SUPPLY",
  "power-supply": "POWER SUPPLY",
  cabinet: "CABINET",
  case: "CABINET",
  monitor: "MONITOR",
  keyboard: "PERIPHERALS",
  mouse: "PERIPHERALS",
  headset: "PERIPHERALS",
};

// Preferred category ordering — matches how a build is conventionally
// described (CPU first, then GPU, then supporting parts). Anything not
// listed (including uncategorized items) is grouped under "OTHER" and
// placed last, in first-appearance order.
const CATEGORY_ORDER = [
  "cpu", "processor", "gpu", "graphics_card", "graphics-card", "motherboard",
  "ram", "memory", "storage", "ssd", "hdd", "cooler", "cooling", "psu",
  "power_supply", "power-supply", "cabinet", "case", "monitor", "keyboard",
  "mouse", "headset",
];

function categoryLabel(category: string | null | undefined): string {
  if (!category || !category.trim()) return "OTHER";
  const key = category.trim().toLowerCase();
  return CATEGORY_LABELS[key] || category.trim().toUpperCase();
}

interface QuotationGroup {
  label: string;
  items: QuotationItem[];
}

function groupByCategory(items: QuotationItem[]): QuotationGroup[] {
  const buckets = new Map<string, QuotationItem[]>();
  for (const item of items) {
    const label = categoryLabel(item.category);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(item);
  }

  const preferredLabels: string[] = [];
  const seen = new Set<string>();
  for (const category of CATEGORY_ORDER) {
    const label = categoryLabel(category);
    if (!seen.has(label)) {
      seen.add(label);
      preferredLabels.push(label);
    }
  }

  const groups: QuotationGroup[] = [];
  for (const label of preferredLabels) {
    if (buckets.has(label)) {
      groups.push({ label, items: buckets.get(label)! });
      buckets.delete(label);
    }
  }
  for (const [label, its] of buckets) {
    groups.push({ label, items: its });
  }
  return groups;
}

function buildDocument(items: QuotationItem[], options: QuotationOptions) {
  const groups = groupByCategory(items);
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const dateLine = new Date().toLocaleDateString("en-IN");
  let runningIndex = 0;

  const groupNodes = groups.map((group, gi) => {
    const rows = group.items.map((item) => {
      runningIndex += 1;
      return e(
        View,
        { key: `row-${runningIndex}`, style: styles.tRow },
        e(Text, { key: "sr", style: [styles.td, styles.cSr] }, String(runningIndex)),
        e(Text, { key: "desc", style: [styles.td, styles.cDesc] }, item.name),
        e(Text, { key: "price", style: [styles.td, styles.cPrice] }, `Rs. ${item.price.toLocaleString("en-IN")}`)
      );
    });
    return e(
      View,
      { key: `group-${gi}` },
      e(Text, { key: "heading", style: styles.groupHeading }, group.label),
      ...rows
    );
  });

  const headerRight = [
    e(Text, { key: "title", style: styles.docTitle }, "QUOTATION"),
    e(Text, { key: "date", style: styles.metaLine }, e(Text, { style: styles.metaLabel }, "Date: "), dateLine),
    options.customerName
      ? e(Text, { key: "for", style: styles.metaLine }, e(Text, { style: styles.metaLabel }, "Prepared For: "), options.customerName)
      : null,
    e(Text, { key: "count", style: styles.metaLine }, e(Text, { style: styles.metaLabel }, "Items: "), String(items.length)),
  ].filter(Boolean);

  return e(
    Document,
    {},
    e(
      Page,
      { size: "A4", style: styles.page },
      // Header
      e(
        View,
        { style: styles.header },
        e(
          View,
          { style: styles.headerLeft },
          e(Image, { style: styles.logo, src: `${SITE_URL}/icons/logo.png` }),
          e(Text, { style: styles.bizMeta }, "MCB Z2 12267, Sahibzada Jujhar Singh Nagar,"),
          e(Text, { style: styles.bizMeta }, "Street No. 3A, Bathinda, Punjab, India - 151001"),
          e(Text, { style: styles.bizMeta }, e(Text, { style: styles.bizStrong }, "Phone: "), "+91 7707801014"),
          e(Text, { style: styles.bizMeta }, e(Text, { style: styles.bizStrong }, "Email: "), "info@rigbuilders.in"),
          e(Text, { style: styles.bizMeta }, e(Text, { style: styles.bizStrong }, "Web: "), "www.rigbuilders.in")
        ),
        e(View, { style: styles.headerRight }, ...headerRight)
      ),
      // Table header
      e(
        View,
        { style: styles.tHead },
        e(Text, { key: "th-sr", style: [styles.th, styles.cSr] }, "#"),
        e(Text, { key: "th-desc", style: [styles.th, styles.cDesc] }, "DESCRIPTION"),
        e(Text, { key: "th-price", style: [styles.th, styles.cPrice] }, "PRICE")
      ),
      // Grouped line items
      ...groupNodes,
      // Total
      e(
        View,
        { style: styles.totals },
        e(
          View,
          { style: styles.tGrand },
          e(Text, { key: "tl", style: styles.tGrandLabel }, "Estimated Total"),
          e(Text, { key: "tv", style: styles.tGrandVal }, `Rs. ${total.toLocaleString("en-IN")}`)
        )
      ),
      // Note
      e(
        Text,
        { style: styles.note },
        "This is an estimated quotation, not a tax invoice. Prices are subject to stock availability and may vary slightly at checkout once applicable taxes and shipping are added."
      ),
      // Footer — no repeated contact block here; that already lives once in
      // the header alongside the full address.
      e(View, { style: styles.foot }, e(Text, { style: styles.footNote }, "Thank you for considering Rig Builders.")),
    )
  );
}

/**
 * Builds a branded quotation PDF and returns it as a Buffer — callers
 * (the WhatsApp quotation flow) upload that to public storage and send it
 * as a document via the existing sendMedia() path on each channel adapter.
 */
export async function generateQuotationPDF(items: QuotationItem[], options: QuotationOptions = {}): Promise<Buffer> {
  const document = buildDocument(items, options);
  return renderToBuffer(document as never);
}
