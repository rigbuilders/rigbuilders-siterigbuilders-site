"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Send, Loader2, ChevronLeft, Phone, MessageCircle, Sparkles, LayoutGrid } from "lucide-react";
import ChatProductCard, { type ChatProductCardData } from "@/components/ChatProductCard";
import ChatBuildQuoteCard, { type ChatBuildQuoteData } from "@/components/ChatBuildQuoteCard";
import {
  MENU_NODES,
  MENU_ROOT,
  dynamicNotSure,
  getNode,
  type MenuFilters,
  type MenuOption,
} from "@/lib/chatbot/guided-menu";

const SUPPORT_PHONE = "+917707801014";
const SUPPORT_WHATSAPP = "917707801014";
// Support window, in the shop's own timezone — a visitor in another timezone
// must still see "we're open" based on when Delhi is open, not when they are.
const SUPPORT_OPEN_HOUR = 9;
const SUPPORT_CLOSE_HOUR = 17;

function isWithinSupportHours(): boolean {
  try {
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date())
    );
    return hour >= SUPPORT_OPEN_HOUR && hour < SUPPORT_CLOSE_HOUR;
  } catch {
    // Intl without tz data (very old browsers) — assume open rather than
    // hiding the call button from someone who could have used it.
    return true;
  }
}

/** Trail entry — what was chosen, and the state to restore when going back. */
interface MenuCrumb {
  nodeId: string;
  filters: MenuFilters;
  label: string;
}

const VISITOR_ID_KEY = "rb_chat_visitor_id";
const PRODUCTS_CACHE_KEY = "rb_chat_products_v1";
const PRODUCTS_CACHE_MAX_ENTRIES = 200;
const BUILDS_CACHE_KEY = "rb_chat_builds_v1";
const BUILDS_CACHE_MAX_ENTRIES = 100;
const POLL_INTERVAL_MS = 8000;

type Role = "user" | "assistant" | "system";

interface WidgetMessage {
  id: string;
  role: Role;
  content: string;
  provider?: string | null;
  pending?: boolean; // true while a streaming reply is still filling in
  products?: ChatProductCardData[];
  build?: ChatBuildQuoteData | null;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

// Message bubbles render plain text (whitespace-pre-wrap), not markdown — the
// one exception is a bare URL, which the quotation-PDF flow appends straight
// into the reply text (see website-stream.ts). Turning those into real
// clickable links is the only formatting this component does on its own.
function renderMessageContent(content: string) {
  // content.split() with a capturing group interleaves the non-matching text
  // with the matched URLs — odd indices are always the captured group here,
  // so parity alone tells us which is which. (Deliberately not using
  // URL_PATTERN.test() per-part in a loop: a `g`-flagged regex's .test()
  // carries lastIndex state across calls and gives alternating false
  // negatives when reused like that.)
  const parts = content.split(URL_PATTERN);
  if (parts.length === 1) return content;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      // eslint-disable-next-line react/no-array-index-key
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 text-rb-orange hover:text-white break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// Product cards are cached in localStorage keyed by the permanent (server)
// message id, so they survive a reload or the widget being reopened later —
// the thread history endpoint only stores message text, not card data.
function loadStoredProducts(): Record<string, ChatProductCardData[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PRODUCTS_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredProducts(map: Record<string, ChatProductCardData[]>): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(map);
    if (keys.length > PRODUCTS_CACHE_MAX_ENTRIES) {
      for (const k of keys.slice(0, keys.length - PRODUCTS_CACHE_MAX_ENTRIES)) delete map[k];
    }
    window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Storage full/unavailable — non-fatal, cards just won't persist this time.
  }
}

// Build quotations are cached the same way and for the same reason as
// product cards above — the thread history endpoint only persists message
// text, so a full build quote (with its Add to Cart / Download PDF actions)
// would otherwise vanish the moment the widget reloads or a poll runs.
function loadStoredBuilds(): Record<string, ChatBuildQuoteData> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(BUILDS_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredBuilds(map: Record<string, ChatBuildQuoteData>): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(map);
    if (keys.length > BUILDS_CACHE_MAX_ENTRIES) {
      for (const k of keys.slice(0, keys.length - BUILDS_CACHE_MAX_ENTRIES)) delete map[k];
    }
    window.localStorage.setItem(BUILDS_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Storage full/unavailable — non-fatal, the build card just won't persist this time.
  }
}

/**
 * Site-wide live chat widget. Talks to /api/chatbot/website (streaming send)
 * and /api/chatbot/website/thread (history + polling for admin hand-off
 * replies, since the website channel has no push mechanism the way WhatsApp
 * webhooks do). Hidden on /admin/*.
 *
 * Wraps `children` (see app/layout.tsx) rather than just floating on top of
 * them, because on desktop opening the window actually squeezes the page
 * into the remaining width — a real docked sidebar, not an overlay — which
 * requires the rest of the page to sit inside a container this component
 * controls the margin of. On mobile it's a much smaller floating pop-up
 * instead (squeezing a narrow viewport isn't usable), with a tap-anywhere
 * backdrop to close it.
 */
export default function ChatWidget({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"active" | "handed_off" | null>(null);
  const [unread, setUnread] = useState(0);

  // ---- Guided menu state ----
  // null = menu hidden, visitor is in free-text mode. Starts at the root so a
  // first-time visitor sees options rather than an empty box they have to
  // think of a question for.
  const [menuNodeId, setMenuNodeId] = useState<string | null>(MENU_ROOT);
  const [menuFilters, setMenuFilters] = useState<MenuFilters>({});
  const [menuTrail, setMenuTrail] = useState<MenuCrumb[]>([]);
  const [menuChoices, setMenuChoices] = useState<MenuOption[] | null>(null);
  const [menuProducts, setMenuProducts] = useState<ChatProductCardData[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  // Computed once on mount rather than per render — the window only matters
  // for which button to show, and re-checking on every keystroke is pointless.
  const [withinHours, setWithinHours] = useState(true);

  const visitorIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
    setHasHydrated(true);
    setWithinHours(isWithinSupportHours());
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const fetchThread = useCallback(async (opts?: { silent?: boolean }) => {
    const visitorId = visitorIdRef.current;
    if (!visitorId) return;
    try {
      const res = await fetch(`/api/chatbot/website/thread?visitorId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) return;
      const data: {
        status: "active" | "handed_off" | null;
        messages: { id: string; role: Role; content: string; provider: string | null }[];
      } = await res.json();

      setStatus(data.status);

      let freshCount = 0;
      setMessages((current) => {
        // Purely additive: never replace or discard an already-rendered
        // bubble. Trying to "swap" optimistic local bubbles for their
        // server-confirmed versions (the previous approach) meant losing
        // whatever only lived on the local copy — like product cards, which
        // the thread endpoint doesn't return — the moment a poll ran. Instead
        // we only ever add server messages that aren't already represented
        // locally (matched by role+content), which an admin reply is, and a
        // message we just sent ourselves isn't.
        const storedProducts = loadStoredProducts();
        const storedBuilds = loadStoredBuilds();

        // While we're here, learn the *real* (server) id for any local
        // message that now has a content-matching server row, and cache its
        // product cards / build quote under that permanent id — from then on
        // those survive a reload/reopen without depending on local state at all.
        const localByContentKey = new Map<string, WidgetMessage>();
        for (const m of current) {
          if (m.id.startsWith("local-")) localByContentKey.set(`${m.role}:${m.content}`, m);
        }
        let productsStoreDirty = false;
        let buildsStoreDirty = false;
        for (const sm of data.messages) {
          const key = `${sm.role}:${sm.content}`;
          const localMatch = localByContentKey.get(key);
          if (localMatch?.products?.length && !storedProducts[sm.id]) {
            storedProducts[sm.id] = localMatch.products;
            productsStoreDirty = true;
          }
          if (localMatch?.build && !storedBuilds[sm.id]) {
            storedBuilds[sm.id] = localMatch.build;
            buildsStoreDirty = true;
          }
        }
        if (productsStoreDirty) saveStoredProducts(storedProducts);
        if (buildsStoreDirty) saveStoredBuilds(storedBuilds);

        const currentContentKeys = new Set(current.map((m) => `${m.role}:${m.content}`));
        const newFromServer: WidgetMessage[] = data.messages
          .filter((m) => !currentContentKeys.has(`${m.role}:${m.content}`))
          .map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            provider: m.provider,
            pending: false,
            products: storedProducts[m.id],
            build: storedBuilds[m.id],
          }));

        freshCount = newFromServer.length;
        if (newFromServer.length === 0) return current;
        return [...current, ...newFromServer];
      });

      // Only badge the launcher for messages someone else added (e.g. an
      // admin taking over) while the panel was closed — not for the initial
      // history restore on first load (that would badge the whole history).
      if (!opts?.silent && !isOpen && freshCount > 0) {
        setUnread((n) => n + freshCount);
      }
    } catch {
      // Silent — polling is best-effort, next tick will retry.
    }
  }, [isOpen]);

  // Initial hydrate once we have a visitorId — silent, so restoring past
  // history doesn't light up the unread badge.
  useEffect(() => {
    if (!hasHydrated) return;
    fetchThread({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Poll while the widget is open, so a human reply from the admin inbox
  // shows up without the visitor needing to refresh.
  useEffect(() => {
    if (!isOpen || !hasHydrated) return;
    const interval = setInterval(() => {
      if (!isSendingRef.current) fetchThread();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isOpen, hasHydrated, fetchThread]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      scrollToBottom();
    }
  }, [isOpen, messages, scrollToBottom]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    // Typing is an explicit choice to leave the menu — don't leave a stale
    // panel sitting under the reply.
    setMenuNodeId(null);
    await sendMessage(text);
  }

  async function sendMessage(text: string) {
    if (!text || isSendingRef.current) return;

    setIsSending(true);
    isSendingRef.current = true;

    const userMsgId = `local-user-${Date.now()}`;
    const assistantMsgId = `local-assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      { id: userMsgId, role: "user", content: text },
      { id: assistantMsgId, role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chatbot/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorIdRef.current, message: text }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Every response starts with one JSON line — {"type":"products","items":[...]}
      // — before the plain-text reply (see withProductsHeader in
      // website-stream.ts). Buffer raw text until that first newline shows
      // up (it may not arrive in the very first chunk), parse it out, then
      // stream everything after it as the visible reply.
      let headerBuffer = "";
      let headerParsed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        let textChunk = chunk;

        if (!headerParsed) {
          headerBuffer += chunk;
          const newlineIndex = headerBuffer.indexOf("\n");
          if (newlineIndex === -1) continue; // still waiting for the rest of the header line

          const headerLine = headerBuffer.slice(0, newlineIndex);
          textChunk = headerBuffer.slice(newlineIndex + 1);
          headerParsed = true;

          try {
            const header = JSON.parse(headerLine);
            // The server decided this message needs the menu rather than an
            // answer — a greeting, something unreadable, or the model
            // signalling it couldn't help (see menu-trigger.ts). Reopening at
            // the root is deliberate: these are all "I don't know what you
            // want" cases, so resuming a half-finished drill-down would be
            // answering a question they didn't ask.
            if (header?.openMenu) openMenu();
            if (header?.type === "products") {
              setMessages((current) =>
                current.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        ...(Array.isArray(header.items) && header.items.length > 0 ? { products: header.items } : {}),
                        ...(header.build ? { build: header.build } : {}),
                      }
                    : m
                )
              );
            }
          } catch {
            // Malformed header — just fall through and show the rest as text.
          }

          if (!textChunk) continue;
        }

        setMessages((current) =>
          current.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + textChunk } : m))
        );
        scrollToBottom();
      }

      // Trim to match how the server persists it (streamTogetherReply /
      // streamOllamaReply both trim the final text before saving) — otherwise
      // a stray leading/trailing space would make the content-match lookup
      // in fetchThread() miss, which is what carries product cards forward.
      setMessages((current) =>
        current.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content.trim(), pending: false } : m))
      );
    } catch {
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantMsgId
            ? { ...m, pending: false, content: m.content || "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
      fetchThread(); // reconcile local ids with real DB ids in the background
    }
  }

  // ---- Guided menu ----------------------------------------------------

  /**
   * Loads a data-driven step. Returns true when the step has something worth
   * showing; false means "skip me" — too few distinct values to be a real
   * choice, or the attribute isn't populated on these rows at all. The caller
   * advances past a skipped step rather than rendering an empty screen, which
   * is what stops a half-filled spec field (socket, say) from dead-ending the
   * whole branch.
   */
  const loadDynamicStep = useCallback(
    async (nodeId: string, filters: MenuFilters): Promise<boolean> => {
      const node = getNode(nodeId);
      if (!node?.dynamic) return true;
      // Held in a local const so the narrowing below survives — narrowing on
      // a property access through an optional chain is fragile across TS
      // versions, and this file failing to compile takes the whole site down.
      const kind = node.dynamic;

      setMenuLoading(true);
      setMenuChoices(null);
      setMenuProducts(null);
      try {
        const params = new URLSearchParams({ step: kind });
        for (const [k, v] of Object.entries(filters)) if (v) params.set(k, String(v));

        const res = await fetch(`/api/chatbot/menu?${params.toString()}`);
        if (!res.ok) return false;
        const data = await res.json();

        if (kind === "products") {
          setMenuProducts(Array.isArray(data.items) ? data.items : []);
          return true; // always render — "nothing in stock" is a real answer
        }

        const choices: { id: string; label: string; hint?: string }[] = Array.isArray(data.choices) ? data.choices : [];
        if (choices.length === 0) return false;

        const next = kind === "brands" ? "parts-socket" : "parts-list";
        const filterKey = kind === "brands" ? "brand" : "socket";
        setMenuChoices([
          ...choices.map((c) => ({
            id: c.id,
            label: c.label,
            hint: c.hint,
            next,
            setFilters: { [filterKey]: c.id } as MenuFilters,
          })),
          dynamicNotSure(kind, filters),
        ]);
        return true;
      } catch {
        return false;
      } finally {
        setMenuLoading(false);
      }
    },
    []
  );

  /** Walks forward from `nodeId`, skipping any dynamic step with nothing to offer. */
  const goToNode = useCallback(
    async (nodeId: string, filters: MenuFilters) => {
      let currentId: string | undefined = nodeId;
      // Bounded rather than while(true): a malformed tree should degrade to
      // the product list, not spin.
      for (let hops = 0; hops < 6 && currentId; hops++) {
        const node = getNode(currentId);
        if (!node) break;

        if (!node.dynamic) {
          setMenuChoices(null);
          setMenuProducts(null);
          setMenuNodeId(currentId);
          return;
        }

        const usable = await loadDynamicStep(currentId, filters);
        if (usable) {
          setMenuNodeId(currentId);
          return;
        }
        currentId = currentId === "parts-brand" ? "parts-socket" : "parts-list";
      }
      setMenuNodeId("parts-list");
    },
    [loadDynamicStep]
  );

  async function handleMenuSelect(option: MenuOption) {
    const nextFilters = { ...menuFilters, ...(option.setFilters ?? {}) };

    // Echo the choice as a user bubble so the thread reads as a conversation
    // rather than the panel silently mutating — and so the transcript the
    // admin sees in the inbox makes sense.
    setMessages((current) => [
      ...current,
      { id: `local-menu-${Date.now()}`, role: "user", content: option.label },
    ]);
    scrollToBottom();

    if (option.action === "ai") {
      setMenuNodeId(null);
      if (option.payload) await sendMessage(option.payload);
      return;
    }

    if (option.action === "build") {
      setMenuNodeId(null);
      const useCase = menuTrail[menuTrail.length - 1]?.label ?? "general use";
      await sendMessage(`I'd like a custom PC for ${useCase.toLowerCase()}, budget ${option.label}.`);
      return;
    }

    if (option.action === "link" && option.payload) {
      window.location.href = option.payload;
      return;
    }

    if (!option.next) return;

    if (menuNodeId) {
      setMenuTrail((t) => [...t, { nodeId: menuNodeId, filters: menuFilters, label: option.label }]);
    }
    setMenuFilters(nextFilters);
    await goToNode(option.next, nextFilters);
  }

  async function handleMenuBack() {
    const previous = menuTrail[menuTrail.length - 1];
    if (!previous) return;
    setMenuTrail((t) => t.slice(0, -1));
    setMenuFilters(previous.filters);
    await goToNode(previous.nodeId, previous.filters);
  }

  function openMenu() {
    setMenuTrail([]);
    setMenuFilters({});
    setMenuChoices(null);
    setMenuProducts(null);
    setMenuNodeId(MENU_ROOT);
    scrollToBottom();
  }

  const activeNode = menuNodeId ? MENU_NODES[menuNodeId] : undefined;
  const visibleOptions = activeNode?.dynamic ? menuChoices : activeNode?.options;
  const whatsappHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    menuTrail.length > 0
      ? `Hi, I was looking at ${menuTrail.map((c) => c.label).join(" > ")} on your site.`
      : "Hi, I have a question about Rig Builders."
  )}`;

  // Staff-only area — never show the widget there.
  const hideWidget = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {/* The chat window is now a floating glass pop-up (see below), so the
          page never squeezes/reflows when it opens — content stays put. */}
      <div className="min-h-screen">
        {children}
      </div>

      {hideWidget ? null : (
        <>
          {/* Launcher — hidden while the window is open (the window has its
              own close button), shown otherwise. Sits bottom-right, the same
              spot the old Build Now / Consult an Expert widgets used (now
              hidden — see DesktopWidgets.tsx). High z-index clears the
              mobile bottom nav. */}
          {!isOpen && (
            <div className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-[999] group/launcher">
              <button
                onClick={() => setIsOpen(true)}
                aria-label="Ask our chatbot"
                className="relative flex items-center justify-center w-14 h-14 rounded-full bg-rb-orange text-rb-orange-ink shadow-[0_0_28px_-6px_rgba(255,90,31,0.7)] hover:bg-rb-orange-deep hover:scale-105 transition-all duration-300"
              >
                <Bot className="w-6 h-6" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rb-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {/* hover tooltip */}
              <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-rb-black/90 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs font-saira text-rb-white opacity-0 translate-x-1 group-hover/launcher:opacity-100 group-hover/launcher:translate-x-0 transition-all duration-200">
                Ask our chatbot
              </span>
            </div>
          )}

          {isOpen && (
            <>
              {/* Click-away backdrop — closes the pop-up. Dimmed on mobile,
                  transparent on desktop (page stays visible behind it). */}
              <div
                className="fixed inset-0 z-[998] bg-black/50 md:bg-transparent"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />

              {/*
                Floating glass pop-up (like the navbar dropdowns, but click-opened).
                Mobile: inset card. Desktop: anchored bottom-right, spanning from
                just below the navbar down to the launcher corner. No page squeeze.
              */}
              <div className="fixed z-[999] inset-x-4 top-24 bottom-5 md:inset-x-auto md:right-6 md:top-24 md:bottom-6 md:w-[400px] rounded-2xl bg-rb-black/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 ring-1 ring-inset ring-white/5 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-rb-black/40 flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-rb-orange/15 border border-rb-orange/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-rb-orange" />
            </div>
            <div className="flex-1">
              <p className="font-orbitron text-xs font-bold uppercase tracking-widest text-white">
                AI Assistant
              </p>
              <p className="text-[11px] text-rb-silver mt-0.5">
                {status === "handed_off" ? "A team member has joined this chat" : ""}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-rb-silver hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !activeNode && (
              <p className="text-xs text-rb-silver/70 text-center mt-8">
                Ask about CPUs, GPUs, prebuilt tiers, pricing, or anything else — we&apos;re here to help.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} gap-2`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-rb-orange text-rb-orange-ink rounded-br-sm"
                      : "bg-rb-black/70 border border-white/10 text-rb-mist rounded-bl-sm"
                  }`}
                >
                  {m.content ? renderMessageContent(m.content) : m.pending ? <TypingDots /> : ""}
                </div>

                {m.products && m.products.length > 0 && (
                  <div className="w-full max-w-[95%] flex flex-col gap-2">
                    {m.products.map((p) => (
                      <ChatProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}

                {m.build && (
                  <div className="w-full max-w-[95%]">
                    <ChatBuildQuoteCard quote={m.build} />
                  </div>
                )}
              </div>
            ))}

            {/* Guided menu panel — rendered inline at the end of the thread so
                tapping through reads as part of the conversation rather than a
                separate mode. Hidden the moment the visitor types instead. */}
            {activeNode && (
              <div className="flex flex-col items-start gap-2">
                {menuTrail.length > 0 && (
                  <button
                    onClick={handleMenuBack}
                    className="flex items-center gap-1 text-[11px] text-rb-silver hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    {menuTrail.map((c) => c.label).join(" / ")}
                  </button>
                )}

                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-rb-black/70 border border-white/10 text-rb-mist">
                  {activeNode.prompt}
                </div>

                {menuLoading && (
                  <div className="flex items-center gap-2 text-xs text-rb-silver px-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking stock…
                  </div>
                )}

                {!menuLoading && visibleOptions && visibleOptions.length > 0 && (
                  <div className="w-full flex flex-col gap-1.5">
                    {visibleOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleMenuSelect(option)}
                        disabled={isSending}
                        className="text-left text-sm px-3 py-2 rounded-xl border border-white/10 bg-rb-black/40 text-rb-mist hover:border-rb-orange/50 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        {option.label}
                        {option.hint && <span className="text-rb-silver/70 text-xs"> · {option.hint}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {!menuLoading && menuProducts && (
                  <div className="w-full max-w-[95%] flex flex-col gap-2">
                    {menuProducts.length === 0 ? (
                      <p className="text-xs text-rb-silver px-1">
                        Nothing in stock matching that right now — ask me and I&apos;ll suggest the closest alternative.
                      </p>
                    ) : (
                      menuProducts.map((p) => <ChatProductCard key={p.id} product={p} />)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Escape hatches — present under every step, never buried inside the
              option list. Call is mobile-only and only during the support
              window; outside it, or on desktop, WhatsApp takes its place with
              the breadcrumb prefilled so the team doesn't have to ask what the
              visitor was looking at. */}
          <div className="px-3 py-2 border-t border-white/10 flex items-center gap-1.5 shrink-0">
            {menuNodeId ? (
              <button
                onClick={() => setMenuNodeId(null)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg border border-white/10 text-rb-silver hover:text-white hover:border-white/20 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Ask anything
              </button>
            ) : (
              <button
                onClick={openMenu}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg border border-white/10 text-rb-silver hover:text-white hover:border-white/20 transition-colors"
              >
                <LayoutGrid className="w-3 h-3" /> Browse menu
              </button>
            )}

            {withinHours && (
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="md:hidden flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg border border-white/10 text-rb-silver hover:text-white hover:border-white/20 transition-colors"
              >
                <Phone className="w-3 h-3" /> Call us
              </a>
            )}

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              title={withinHours ? "Chat with us on WhatsApp" : "We're open 9am to 5pm — message us and we'll reply when we open"}
              className={`${withinHours ? "hidden md:flex" : "flex"} flex-1 items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-lg border border-white/10 text-rb-silver hover:text-white hover:border-white/20 transition-colors`}
            >
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 bg-rb-black/60 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-rb-silver/50 focus:border-rb-orange outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="w-9 h-9 rounded-full bg-rb-orange text-rb-orange-ink flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform shrink-0"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-rb-silver/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-rb-silver/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-rb-silver/60 animate-bounce" />
    </span>
  );
}
