"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Send, Loader2 } from "lucide-react";
import ChatProductCard, { type ChatProductCardData } from "@/components/ChatProductCard";
import ChatBuildQuoteCard, { type ChatBuildQuoteData } from "@/components/ChatBuildQuoteCard";

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

  const visitorIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
    setHasHydrated(true);
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
            {messages.length === 0 && (
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
