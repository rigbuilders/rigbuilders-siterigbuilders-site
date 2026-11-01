// lib/thankyou.ts
// Thank-you note generator — editorial LIGHT design. Picks one of three copy
// variants by product category, injects the assembler/packager name and a
// dynamic QR target, and returns a self-contained A4 HTML document for print.
//
// Variants:
//   builds       → custom builds + prebuilts
//   components   → bare hardware (cpu, gpu, ram, storage, psu, mobo, cooler, cabinet)
//   accessories  → peripherals (monitor, keyboard, mouse, combo, mousepad, usb)

export type ThankTemplate = "builds" | "components" | "accessories";

// Google "write a review" direct link (opens the review composer immediately).
export const GOOGLE_REVIEW_URL = "https://g.page/r/CbJepT3IjPqtEBM/review";

export const SITE_URL = "https://www.rigbuilders.in";
// Full black "RIG BUILDERS" wordmark, served from /public (same-origin on the
// /api/thankyou route). Dark logo on the light note — the same asset the invoice uses.
export const LOGO_URL = "/icons/logo.png";

// --- category → template ---------------------------------------------------
const BUILD_CATS = new Set(["prebuilt", "custom", "build", "builds", "gaming-pc", "workstation", "creator", "pc"]);
const ACCESSORY_CATS = new Set(["monitor", "keyboard", "mouse", "combo", "mousepad", "usb", "accessory", "accessories"]);

export function templateForCategory(category?: string | null): ThankTemplate {
  const c = (category || "").toLowerCase().trim();
  if (BUILD_CATS.has(c)) return "builds";
  if (ACCESSORY_CATS.has(c)) return "accessories";
  return "components";
}

export function templateForOrder(categories: (string | null | undefined)[]): ThankTemplate {
  const mapped = categories.map(templateForCategory);
  if (mapped.includes("builds")) return "builds";
  if (mapped.includes("components")) return "components";
  if (mapped.length && mapped.every((m) => m === "accessories")) return "accessories";
  return "components";
}

// --- per-template copy ------------------------------------------------------
type IconId = "check" | "cpu" | "gear" | "gauge" | "clip" | "box" | "truck" | "layers" | "shield" | "search";

interface TemplateContent {
  kicker: string;
  lead: string;
  steps: { icon: IconId; label: string }[];
  supportTitle: string;
  support: string[];
  signatureLabel: string;
  footerQuote: string;
}

const CONTENT: Record<ThankTemplate, TemplateContent> = {
  builds: {
    kicker: "Assembled, tested & packed by hand",
    lead: "Welcome to the Rig Builders family. Your system was professionally assembled, cable-managed, stress-tested and quality-checked before it was securely packaged and sent to your door.",
    steps: [
      { icon: "check", label: "Order confirmed" },
      { icon: "cpu", label: "Component procurement" },
      { icon: "gear", label: "Professional assembly" },
      { icon: "gauge", label: "Stress testing" },
      { icon: "clip", label: "Quality inspection" },
      { icon: "truck", label: "Packaged & dispatched" },
    ],
    supportTitle: "Support & Warranty",
    support: ["3-Year System Warranty", "Lifetime Technical Support", "info@rigbuilders.in · @rig_builders"],
    signatureLabel: "Hand assembled & checked by",
    footerQuote: "Engineered for performance. Built to last.",
  },
  components: {
    kicker: "Inspected, authenticated & packed by hand",
    lead: "Thank you for choosing Rig Builders. Every component is thoroughly inspected for authenticity, carefully handled and securely packaged to reach you in perfect condition.",
    steps: [
      { icon: "check", label: "Order confirmed" },
      { icon: "layers", label: "Inventory processing" },
      { icon: "shield", label: "Authenticity check" },
      { icon: "clip", label: "Quality check" },
      { icon: "box", label: "Secure packaging" },
      { icon: "truck", label: "Shipping dispatch" },
    ],
    supportTitle: "Warranty & Support",
    support: ["Official Brand Warranty", "RMA Assistance", "info@rigbuilders.in · @rig_builders"],
    signatureLabel: "Inspected & packed by",
    footerQuote: "Powering your next upgrade.",
  },
  accessories: {
    kicker: "Inspected & packed by hand",
    lead: "Thank you for choosing Rig Builders. Every accessory is carefully inspected and securely packaged to help complete your perfect setup.",
    steps: [
      { icon: "check", label: "Order confirmed" },
      { icon: "layers", label: "Order processing" },
      { icon: "search", label: "Quality check" },
      { icon: "clip", label: "Final inspection" },
      { icon: "box", label: "Secure packaging" },
      { icon: "truck", label: "Shipping dispatch" },
    ],
    supportTitle: "Returns & Support",
    support: ["7-Day Replacement", "Setup Assistance", "info@rigbuilders.in · @rig_builders"],
    signatureLabel: "Inspected & packed by",
    footerQuote: "Elevate your experience.",
  },
};

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface RenderOptions {
  template: ThankTemplate;
  assembler: string;
  qrUrl: string;
  qrLabel?: string;
}

export function renderThankYou({ template, assembler, qrUrl, qrLabel }: RenderOptions): string {
  const c = CONTENT[template] || CONTENT.components;
  const name = esc(assembler || "Rig Builders Team");
  const caption = esc(qrLabel || (qrUrl.includes("writereview") || qrUrl.includes("/review") || qrUrl.includes("g.page") ? "Scan to review us" : "Scan for your product"));
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(qrUrl)}&color=000000&bgcolor=ffffff&margin=0`;

  const steps = c.steps.map((s) => `
      <div class="sx"><svg class="ic sx-ic"><use href="#ic-${s.icon}"/></svg><span>${s.label}</span></div>`).join("");
  const support = c.support.map((s) => esc(s)).join("<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rig Builders — Thank You</title>
<style>
:root{--ink:#161616;--accent:#FF5A1F;--muted:#6f6f6f;--bg:#faf8f4;--line:#e5dfd4;--deep:#111;}
*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
@page{size:A4 portrait;margin:0;}
body{margin:0;background:#d8d4cc;font-family:'Helvetica Neue',Arial,sans-serif;color:var(--ink);display:flex;justify-content:center;padding:24px;}
.sheet{width:794px;min-height:1123px;background:var(--bg);position:relative;overflow:hidden;padding:70px 72px;display:flex;flex-direction:column;}
@media print{html,body{margin:0;padding:0;background:#fff;width:210mm;height:297mm;}body{display:block;}.sheet{width:210mm;height:297mm;min-height:0;padding:15mm 17mm;overflow:hidden;box-shadow:none;}.no-print{display:none!important;}}
.top{display:flex;align-items:center;justify-content:space-between;}
.logo{height:42px;width:auto;display:block;}
.top .meta{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);text-align:right;}
.hero{margin:52px 0 10px;}
.hero .k{font-size:11px;letter-spacing:6px;text-transform:uppercase;color:var(--accent);margin-bottom:22px;}
.hero h1{font-size:80px;font-weight:800;letter-spacing:-3px;line-height:.9;margin:0;color:var(--deep);}
.hero h1 .amp{color:var(--accent);}
.hero .lead{font-size:14.5px;line-height:1.75;color:#3a3a3a;max-width:74%;margin:26px 0 0;}
.steps{display:flex;flex-wrap:wrap;gap:0 34px;margin:44px 0 0;}
.sx{font-size:12px;letter-spacing:.5px;padding:13px 0;border-top:1px solid var(--line);flex:0 0 calc(50% - 17px);display:flex;align-items:center;gap:14px;}
.sx span{color:#2e2e2e;}
.ic{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;color:var(--accent);}
.sx-ic{width:19px;height:19px;flex:0 0 19px;}
.band{margin-top:auto;display:grid;grid-template-columns:1fr 1fr auto;gap:36px;align-items:end;border-top:1px solid var(--line);padding-top:28px;}
.band h4{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:0 0 12px;}
.band p{margin:0;font-size:12px;line-height:1.7;color:#333;}
.band .sig .who{font-size:20px;font-weight:800;margin-top:4px;color:var(--deep);}
.qr{text-align:center;}
.qr img{width:96px;height:96px;background:#fff;padding:7px;border-radius:4px;border:1px solid var(--line);}
.qr .ql{font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:#555;margin-top:9px;}
.closing{margin-top:28px;text-align:center;}
.closing .stars{color:var(--accent);letter-spacing:5px;font-size:13px;}
.closing .q{font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#444;margin-top:12px;}
.print-bar{position:fixed;top:16px;right:16px;z-index:10;}
.print-bar button{background:var(--accent);color:#fff;border:none;font-weight:700;font-family:inherit;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:14px;}
</style>
</head>
<body>
<div class="print-bar no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="ic-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.6 2.6L16 9"/></symbol>
<symbol id="ic-cpu" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/></symbol>
<symbol id="ic-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></symbol>
<symbol id="ic-gauge" viewBox="0 0 24 24"><path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 13.5l4-2.5"/></symbol>
<symbol id="ic-clip" viewBox="0 0 24 24"><rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5h5V7h-5z"/><path d="M9 13l2 2 4-4"/></symbol>
<symbol id="ic-box" viewBox="0 0 24 24"><path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8l8.5 4.5 8.5-4.5M12 12.5v8"/></symbol>
<symbol id="ic-truck" viewBox="0 0 24 24"><path d="M3 6.5h10.5v8.5H3z"/><path d="M13.5 9.5H17l3.5 3v2.5h-7z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/></symbol>
<symbol id="ic-layers" viewBox="0 0 24 24"><path d="M12 3l8.5 4.5L12 12 3.5 7.5z"/><path d="M4 12l8 4.5 8-4.5M4 16l8 4.5 8-4.5"/></symbol>
<symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 3l7 2.5v5c0 4.3-3 7.2-7 8.5-4-1.3-7-4.2-7-8.5v-5z"/><path d="M9 12l2 2 4-4"/></symbol>
<symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></symbol>
</defs></svg>

<div class="sheet">
  <div class="top">
    <img class="logo" src="${LOGO_URL}" alt="Rig Builders">
    <div class="meta">Custom PCs<br>Bathinda · India</div>
  </div>

  <div class="hero">
    <div class="k">${c.kicker}</div>
    <h1>Thank<br>you<span class="amp">.</span></h1>
    <div class="lead">${c.lead}</div>
  </div>

  <div class="steps">${steps}
  </div>

  <div class="band">
    <div class="sig">
      <h4>${c.signatureLabel}</h4>
      <div class="who">${name}</div>
      <p style="color:var(--muted)">Rig Builders Team</p>
    </div>
    <div>
      <h4>${c.supportTitle}</h4>
      <p>${support}</p>
    </div>
    <div class="qr">
      <img src="${qrSrc}" alt="QR">
      <div class="ql">${caption}</div>
    </div>
  </div>

  <div class="closing">
    <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
    <div class="q">${esc(c.footerQuote)}</div>
  </div>
</div>
</body>
</html>`;
}
