/**
 * Guided menu for the website chat widget — the tap-through alternative to
 * typing a question. Most visitors know roughly what they want but not how to
 * phrase it, and a menu answers "what can this thing even do for me" in one
 * glance where an empty text box doesn't.
 *
 * Design rules this encodes, all of which came out of the flow review:
 *
 * - Every node is escapable. The widget renders the Rix AI / call / WhatsApp
 *   bar under every panel (see ChatWidget.tsx), so no branch can trap anyone.
 * - "Not sure" is a first-class option wherever a question assumes knowledge
 *   the visitor may not have. It routes to the AI rather than a dead end,
 *   because working out someone's socket from their motherboard is exactly
 *   the job a menu can't do and the model can.
 * - Steps that depend on catalogue data (brands, sockets) are resolved at
 *   runtime from the database rather than hardcoded here, and are SKIPPED
 *   when the data doesn't support them — see the `dynamic` nodes below and
 *   app/api/chatbot/menu/route.ts. A socket step built on a spec field that
 *   isn't populated would silently show an empty list, which is the same
 *   class of bug as the product lookup returning zero matches.
 *
 * The tree is deliberately plain data: no JSX, no DB calls, no React. It's
 * imported by both the widget and the API route so the two can never disagree
 * about what the next step is.
 */

/** Accumulates as the visitor drills down; passed to the products query at the leaf. */
export interface MenuFilters {
  category?: string;
  brand?: string;
  socket?: string;
  series?: string;
}

export type MenuActionKind =
  /** Hand over to the free-text assistant, optionally with a seeded question. */
  | "ai"
  /** Jump into the existing build-recommender flow (use case + budget). */
  | "build"
  /** Navigate the parent page somewhere on the site. */
  | "link";

export interface MenuOption {
  id: string;
  label: string;
  /** Short qualifier shown muted next to the label — keep under ~30 chars. */
  hint?: string;
  /** Node to advance to when chosen. */
  next?: string;
  /** Filters this choice contributes to the accumulating product query. */
  setFilters?: MenuFilters;
  action?: MenuActionKind;
  /** Seed text for `action: "ai"`, destination for `action: "link"`. */
  payload?: string;
}

export interface MenuNode {
  id: string;
  /** Shown as a bot bubble above the options. */
  prompt: string;
  /** Static options. Omitted on dynamic nodes, which build their own. */
  options?: MenuOption[];
  /**
   * Resolved server-side against the live catalogue:
   *  - "brands"   distinct brands within the chosen category
   *  - "sockets"  distinct specs.socket within category + brand
   *  - "products" the matching product cards (the leaf)
   * A dynamic node with fewer than two choices is skipped entirely by the
   * widget, so a sparsely-populated attribute shortens the menu instead of
   * dead-ending it.
   */
  dynamic?: "brands" | "sockets" | "products";
}

export const MENU_ROOT = "root";

/** Offered on every question where not knowing the answer is normal. */
function notSure(seed: string): MenuOption {
  return { id: "not-sure", label: "Not sure", action: "ai", payload: seed };
}

export const MENU_NODES: Record<string, MenuNode> = {
  root: {
    id: "root",
    prompt: "Hi! What would you like to do today?",
    options: [
      { id: "build", label: "Build a custom PC", hint: "Use case, budget, quote", next: "build-use-case" },
      { id: "prebuilt", label: "Shop prebuilt rigs", hint: "Browse our four ranges", next: "prebuilt-range" },
      { id: "parts", label: "Parts and upgrades", hint: "CPU, GPU, RAM, more", next: "parts-category" },
      { id: "track", label: "Track my order", hint: "Status and delivery", next: "track-what" },
      { id: "warranty", label: "Warranty and repairs", hint: "Faults and claims", next: "warranty-issue" },
      { id: "other", label: "Something else", hint: "Payment, bulk orders", next: "other-what" },
    ],
  },

  // ---- Build a custom PC -------------------------------------------------
  // Deliberately asks exactly the two things build-recommender.ts needs
  // (use case, budget) — the menu is just a faster way to collect them than
  // a conversation, and the quote generation afterwards is unchanged.
  "build-use-case": {
    id: "build-use-case",
    prompt: "What will you mainly use it for?",
    options: [
      { id: "gaming", label: "Gaming" },
      { id: "creator", label: "Content creation and streaming" },
      { id: "workstation", label: "Workstation", hint: "CAD, 3D, data" },
      { id: "general", label: "Everyday and office" },
    ].map((o) => ({ ...o, next: "build-budget" })),
  },

  "build-budget": {
    id: "build-budget",
    prompt: "Roughly what budget are you working with?",
    options: [
      { id: "u50", label: "Under ₹50,000", action: "build" },
      { id: "50-100", label: "₹50,000 to ₹1 lakh", action: "build" },
      { id: "100-200", label: "₹1 lakh to ₹2 lakh", action: "build" },
      { id: "o200", label: "Above ₹2 lakh", action: "build" },
      { id: "flexible", label: "I'm flexible", action: "ai", payload: "I'd like a custom PC build but I'm flexible on budget." },
    ],
  },

  // ---- Prebuilt rigs -----------------------------------------------------
  "prebuilt-range": {
    id: "prebuilt-range",
    prompt: "Which range are you interested in?",
    options: [
      { id: "ascend", label: "Ascend", hint: "Gaming", setFilters: { series: "ascend", category: "prebuilt" }, next: "parts-list" },
      { id: "creator", label: "Creator", hint: "Editing and streaming", setFilters: { series: "creator", category: "prebuilt" }, next: "parts-list" },
      { id: "workpro", label: "WorkPro", hint: "CAD and rendering", setFilters: { series: "workpro", category: "prebuilt" }, next: "parts-list" },
      { id: "signature", label: "Signature", hint: "Limited edition", setFilters: { series: "signature", category: "prebuilt" }, next: "parts-list" },
      { id: "help", label: "Help me pick", next: "build-use-case" },
    ],
  },

  // ---- Parts and upgrades ------------------------------------------------
  "parts-category": {
    id: "parts-category",
    prompt: "Which component are you after?",
    options: [
      { id: "cpu", label: "Processor", setFilters: { category: "cpu" } },
      { id: "gpu", label: "Graphics card", setFilters: { category: "gpu" } },
      { id: "ram", label: "Memory", setFilters: { category: "ram" } },
      { id: "storage", label: "Storage", setFilters: { category: "storage" } },
      { id: "motherboard", label: "Motherboard", setFilters: { category: "motherboard" } },
      { id: "cooler", label: "Cooling", setFilters: { category: "cooler" } },
      { id: "psu", label: "Power supply", setFilters: { category: "psu" } },
      { id: "cabinet", label: "Cabinet", setFilters: { category: "cabinet" } },
      { id: "peripherals", label: "Peripherals", hint: "Monitor, keyboard, mouse", setFilters: { category: "monitor" } },
    ].map((o) => ({ ...o, next: "parts-brand" })),
  },

  "parts-brand": {
    id: "parts-brand",
    prompt: "Any brand preference?",
    dynamic: "brands",
  },

  "parts-socket": {
    id: "parts-socket",
    prompt: "Which socket? Pick “not sure” and I'll work it out from your motherboard.",
    dynamic: "sockets",
  },

  "parts-list": {
    id: "parts-list",
    prompt: "Here's what we have in stock.",
    dynamic: "products",
  },

  // ---- Track my order ----------------------------------------------------
  // Address changes and cancellations go straight to a human rather than
  // being self-serve — both are irreversible once a rig has shipped.
  "track-what": {
    id: "track-what",
    prompt: "What do you need help with?",
    options: [
      { id: "where", label: "Where is my order?", action: "ai", payload: "I'd like to check where my order has reached." },
      { id: "delayed", label: "My delivery is delayed", action: "ai", payload: "My delivery seems delayed and I'd like an update." },
      { id: "invoice", label: "I need an invoice copy", action: "ai", payload: "Could I get a copy of my invoice?" },
      { id: "address", label: "Change delivery address", action: "ai", payload: "I need to change the delivery address on my order. Please connect me with the team." },
      { id: "cancel", label: "Cancel my order", action: "ai", payload: "I'd like to cancel my order. Please connect me with the team." },
    ],
  },

  // ---- Warranty and repairs ---------------------------------------------
  // The menu's job here is capturing the symptom before escalating, not
  // attempting diagnosis — every one of these ends with a human.
  "warranty-issue": {
    id: "warranty-issue",
    prompt: "Sorry to hear that. What's happening?",
    options: [
      { id: "no-power", label: "It won't power on" },
      { id: "crash", label: "Crashing or blue screens" },
      { id: "heat", label: "Overheating" },
      { id: "slow", label: "Performance has dropped" },
      { id: "damage", label: "Physical damage" },
      { id: "part", label: "I need a part replaced" },
    ].map((o) => ({ ...o, next: "warranty-cover" })),
  },

  "warranty-cover": {
    id: "warranty-cover",
    prompt: "Is the rig still under warranty?",
    options: [
      { id: "yes", label: "Yes", action: "ai", payload: "My Rig Builders PC is under warranty and I need help with a fault." },
      { id: "no", label: "No", action: "ai", payload: "My Rig Builders PC is out of warranty and I need help with a fault." },
      notSure("I'm not sure whether my PC is still under warranty — could you check?"),
    ],
  },

  // ---- Something else ----------------------------------------------------
  "other-what": {
    id: "other-what",
    prompt: "What can I help with?",
    options: [
      { id: "payment", label: "Payment and EMI options", action: "ai", payload: "What payment and EMI options do you offer?" },
      { id: "shipping", label: "Shipping and delivery", action: "ai", payload: "What are your shipping timelines and charges?" },
      { id: "bulk", label: "Bulk or corporate order", action: "ai", payload: "I'd like to discuss a bulk or corporate order. Please connect me with the team." },
      { id: "returns", label: "Returns and refunds", action: "ai", payload: "Could you explain your returns and refunds policy?" },
      { id: "talk", label: "Just talk to someone", action: "ai", payload: "I'd like to talk to a member of the team." },
    ],
  },
};

/** Builds the "not sure" escape for a dynamic step the server resolved. */
export function dynamicNotSure(kind: "brands" | "sockets", filters: MenuFilters): MenuOption {
  if (kind === "sockets") {
    return notSure(
      `I'm looking at ${filters.brand ?? ""} processors but I'm not sure which socket my motherboard uses. Can you help me work it out?`.trim()
    );
  }
  return { id: "any-brand", label: "No preference", next: "parts-socket" };
}

export function getNode(id: string): MenuNode | undefined {
  return MENU_NODES[id];
}
