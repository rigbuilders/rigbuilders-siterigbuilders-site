import { MENU_NODES, MENU_ROOT, getNode, type MenuFilters, type MenuOption } from "./guided-menu";
import { resolveBrands, resolveProducts, resolveSockets } from "./menu-data";
import type { MenuState } from "./menu-state";

/**
 * Renders the shared guided menu (guided-menu.ts) into WhatsApp's interactive
 * message formats, and resolves a tapped reply back into the next step.
 *
 * The tree is NOT duplicated here — this is a renderer, the same way
 * ChatWidget.tsx is a renderer. If the two ever disagree about what follows
 * "Processor", that's a bug in one of them, not a difference in the menus.
 *
 * WhatsApp's hard limits shape everything below, and exceeding any of them is
 * a rejected send rather than a truncated one, so they're enforced here:
 *   - reply buttons: max 3, title <= 20 chars
 *   - list rows:     max 10 TOTAL across all sections, title <= 24 chars,
 *                    description <= 72 chars
 *   - body text:     <= 1024 chars
 *   - list button:   <= 20 chars
 */

const MAX_BUTTONS = 3;
const MAX_ROWS = 10;
const ROW_TITLE = 24;
const ROW_DESC = 72;
const BUTTON_TITLE = 20;
const BODY_TEXT = 1024;

/** Prefix on every reply id so a tap on a stale, scrolled-up menu is detectable. */
const ID_SEPARATOR = "::";
/** Marks a row that selects a product rather than advancing the tree. */
export const PRODUCT_PREFIX = "product";

function clamp(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export function encodeReplyId(nodeId: string, optionId: string): string {
  return `${nodeId}${ID_SEPARATOR}${optionId}`;
}

export function decodeReplyId(replyId: string): { nodeId: string; optionId: string } | null {
  const index = replyId.indexOf(ID_SEPARATOR);
  if (index === -1) return null;
  return { nodeId: replyId.slice(0, index), optionId: replyId.slice(index + ID_SEPARATOR.length) };
}

export interface MenuRender {
  /** Buttons for <=3 options, a list beyond that. */
  kind: "buttons" | "list";
  body: string;
  buttons?: { id: string; title: string }[];
  rows?: { id: string; title: string; description?: string }[];
  /** Label on the tap-to-open button for list messages. */
  listButtonText?: string;
}

/**
 * Builds the renderable step for a node, resolving any catalogue-driven
 * options. Returns null when the step has nothing worth showing — the caller
 * advances past it, which is what keeps a sparsely populated attribute (an
 * unset socket spec, a single-brand category) from producing a dead end.
 */
export async function buildMenuRender(
  nodeId: string,
  filters: MenuFilters,
  intro?: string
): Promise<{ render: MenuRender; options: MenuOption[] } | null> {
  const node = getNode(nodeId);
  if (!node) return null;

  const options = await resolveOptions(node.id, node.dynamic, filters);
  if (options.length === 0) return null;

  const body = clamp(intro ? `${intro}\n\n${node.prompt}` : node.prompt, BODY_TEXT);

  if (options.length <= MAX_BUTTONS) {
    return {
      render: {
        kind: "buttons",
        body,
        buttons: options.map((o) => ({
          id: encodeReplyId(node.id, o.id),
          title: clamp(o.label, BUTTON_TITLE),
        })),
      },
      options,
    };
  }

  // More than 10 options can't all be shown, so the last row becomes an escape
  // into the assistant rather than silently dropping the overflow.
  const shown = options.slice(0, options.length > MAX_ROWS ? MAX_ROWS - 1 : MAX_ROWS);
  const rows = shown.map((o) => ({
    id: encodeReplyId(node.id, o.id),
    title: clamp(o.label, ROW_TITLE),
    description: o.hint ? clamp(o.hint, ROW_DESC) : undefined,
  }));

  if (options.length > MAX_ROWS) {
    rows.push({
      id: encodeReplyId(node.id, "overflow"),
      title: "Something else",
      description: "Tell me what you're after and I'll find it",
    });
  }

  return {
    render: { kind: "list", body, rows, listButtonText: "Choose an option" },
    options,
  };
}

/** Static options, or catalogue-resolved ones for a dynamic node. */
async function resolveOptions(
  nodeId: string,
  dynamic: "brands" | "sockets" | "products" | undefined,
  filters: MenuFilters
): Promise<MenuOption[]> {
  if (!dynamic) return MENU_NODES[nodeId]?.options ?? [];

  if (dynamic === "brands") {
    const brands = await resolveBrands(filters);
    if (brands.length === 0) return [];
    return [
      ...brands.map((b) => ({ id: b.id, label: b.label, next: "parts-socket", setFilters: { brand: b.id } })),
      { id: "any-brand", label: "No preference", next: "parts-socket" },
    ];
  }

  if (dynamic === "sockets") {
    const sockets = await resolveSockets(filters);
    if (sockets.length === 0) return [];
    return [
      ...sockets.map((s) => ({ id: s.id, label: s.label, next: "parts-list", setFilters: { socket: s.id } })),
      {
        id: "socket-unknown",
        label: "Not sure",
        action: "ai" as const,
        payload: "I'm not sure which socket my motherboard uses — can you help me work it out?",
      },
    ];
  }

  // Products are rows too, not a stack of cards: eight consecutive card
  // messages is spam on WhatsApp, and rendering the rich card only for the one
  // they pick means we pay for it once instead of eight times.
  const products = await resolveProducts(filters, MAX_ROWS - 1);
  return products.map((p) => ({
    id: `${PRODUCT_PREFIX}${ID_SEPARATOR}${p.id}`,
    label: p.name,
    hint: `₹${p.price.toLocaleString("en-IN")}${p.inStock ? "" : " · out of stock"}`,
  }));
}

export type MenuSelection =
  | { kind: "advance"; nodeId: string; filters: MenuFilters; label: string }
  | { kind: "product"; productId: string; label: string }
  | { kind: "ai"; seed?: string; label: string }
  | { kind: "build"; label: string; useCase: string }
  | { kind: "stale" };

/**
 * Maps a tapped reply id back to what should happen next.
 *
 * `stale` means the tap came from a menu that's no longer current — someone
 * scrolled up and tapped an older message, which WhatsApp allows and which
 * would otherwise apply the wrong filters to the wrong step.
 */
export async function resolveMenuSelection(state: MenuState, replyId: string): Promise<MenuSelection> {
  const decoded = decodeReplyId(replyId);
  if (!decoded) return { kind: "stale" };

  if (decoded.nodeId === PRODUCT_PREFIX) {
    return { kind: "product", productId: decoded.optionId, label: "that one" };
  }
  if (decoded.nodeId !== state.nodeId) return { kind: "stale" };

  if (decoded.optionId === "overflow") {
    return { kind: "ai", label: "Something else", seed: undefined };
  }

  const node = getNode(state.nodeId);
  if (!node) return { kind: "stale" };

  const options = await resolveOptions(node.id, node.dynamic, state.filters);
  const option = options.find((o) => o.id === decoded.optionId);
  if (!option) return { kind: "stale" };

  if (option.id.startsWith(`${PRODUCT_PREFIX}${ID_SEPARATOR}`)) {
    return {
      kind: "product",
      productId: option.id.slice(PRODUCT_PREFIX.length + ID_SEPARATOR.length),
      label: option.label,
    };
  }
  if (option.action === "ai") return { kind: "ai", seed: option.payload, label: option.label };
  if (option.action === "build") {
    return { kind: "build", label: option.label, useCase: state.trail[state.trail.length - 1]?.label ?? "general use" };
  }
  if (!option.next) return { kind: "ai", label: option.label };

  return {
    kind: "advance",
    nodeId: option.next,
    filters: { ...state.filters, ...(option.setFilters ?? {}) },
    label: option.label,
  };
}

/**
 * Walks forward from `nodeId`, skipping steps with nothing to offer, and
 * returns the first renderable one. Mirrors goToNode() in ChatWidget.tsx.
 */
export async function advanceToRenderable(
  nodeId: string,
  filters: MenuFilters,
  intro?: string
): Promise<{ nodeId: string; render: MenuRender } | null> {
  let currentId: string | undefined = nodeId;

  for (let hops = 0; hops < 6 && currentId; hops++) {
    const built = await buildMenuRender(currentId, filters, hops === 0 ? intro : undefined);
    if (built) return { nodeId: currentId, render: built.render };
    currentId = currentId === "parts-brand" ? "parts-socket" : currentId === "parts-socket" ? "parts-list" : undefined;
  }
  return null;
}

export { MENU_ROOT };
