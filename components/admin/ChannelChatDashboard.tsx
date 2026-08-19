"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FaSync,
  FaPause,
  FaPlay,
  FaBan,
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaTrash,
  FaBell,
  FaPaperclip,
  FaArrowLeft,
} from "react-icons/fa";

const ADMIN_EMAIL = "rigbuilders123@gmail.com";

export interface ChannelTheme {
  label: string;
  icon: ReactNode;
  accentText: string; // tailwind text color, e.g. "text-green-400"
  accentBorder: string; // e.g. "border-green-400/30"
  accentBg: string; // e.g. "bg-green-400/10"
  headerBg: string; // solid or gradient background for the page header strip
  bubbleOut: string; // outgoing (bot/human) message bubble classes
  buttonBg: string; // primary action button classes (hover included)
}

interface ConversationSummary {
  id: string;
  channel: string;
  status: "active" | "handed_off" | "closed";
  updatedAt: string;
  externalUserId: string;
  displayName: string | null;
  lastMessage: { content: string; role: string; createdAt: string } | null;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider: string | null;
  created_at: string;
  media_url?: string | null;
  media_type?: "image" | "document" | null;
}

interface ExcludedNumber {
  id: string;
  channel: string;
  externalUserId: string;
  reason: string | null;
  createdAt: string;
}

interface WatchedNumber {
  id: string;
  channel: string;
  externalUserId: string;
  label: string | null;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

async function authedJsonFetch(path: string, options: RequestInit = {}) {
  return authedFetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

/**
 * Shared inbox UI for exactly one channel — WhatsApp, Instagram, Messenger,
 * or the website widget. app/admin/chatbot/page.tsx is a hub of four cards
 * linking to app/admin/chatbot/[channel]/page.tsx, which resolves the theme
 * and renders this component with `channel` set to the internal channel
 * value used everywhere else in lib/chatbot (note: the "Facebook" card's
 * internal channel is "messenger", matching the existing DB/adapter naming
 * — only the URL segment and the label say "facebook").
 */
export default function ChannelChatDashboard({ channel, theme }: { channel: string; theme: ChannelTheme }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  const [excluded, setExcluded] = useState<ExcludedNumber[]>([]);
  const [showExclusions, setShowExclusions] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newReason, setNewReason] = useState("");

  const [watched, setWatched] = useState<WatchedNumber[]>([]);
  const [showWatched, setShowWatched] = useState(false);
  const [newWatchNumber, setNewWatchNumber] = useState("");
  const [newWatchLabel, setNewWatchLabel] = useState("");

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      setReady(true);
    };
    init();
  }, [router]);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const json = await authedFetch(`/api/admin/chatbot/conversations?channel=${encodeURIComponent(channel)}`);
      setConversations(json.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [channel]);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const json = await authedFetch(`/api/admin/chatbot/conversations/${id}`);
      setMessages(json.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const loadExcluded = useCallback(async () => {
    try {
      const json = await authedFetch("/api/admin/chatbot/excluded-numbers");
      setExcluded((json.excluded || []).filter((e: ExcludedNumber) => e.channel === channel));
    } catch (err) {
      console.error(err);
    }
  }, [channel]);

  const loadWatched = useCallback(async () => {
    try {
      const json = await authedFetch("/api/admin/chatbot/watched-numbers");
      setWatched((json.watched || []).filter((w: WatchedNumber) => w.channel === channel));
    } catch (err) {
      console.error(err);
    }
  }, [channel]);

  useEffect(() => {
    if (!ready) return;
    loadConversations();
    loadExcluded();
    loadWatched();
  }, [ready, loadConversations, loadExcluded, loadWatched]);

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // See security/chatbot_watchlist_and_realtime.sql — without that migration
  // this silently receives nothing and the page just falls back to
  // manual-refresh behavior.
  useEffect(() => {
    if (!ready) return;

    const rtChannel = supabase
      .channel(`chatbot-admin-${channel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chatbot_conversations", filter: `channel=eq.${channel}` },
        () => loadConversations()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chatbot_messages" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          loadConversations();
          const conversationId = payload?.new?.conversation_id;
          if (conversationId && conversationId === selectedIdRef.current) {
            loadThread(selectedIdRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rtChannel);
    };
  }, [ready, channel, loadConversations, loadThread]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      await authedJsonFetch(`/api/admin/chatbot/conversations/${selectedId}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: replyText.trim() }),
      });
      setReplyText("");
      await loadThread(selectedId);
      await loadConversations();
    } catch (err) {
      alert(`Failed to send: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async () => {
    if (!selectedId || !mediaFile) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", mediaFile);
      if (mediaCaption.trim()) formData.append("caption", mediaCaption.trim());
      await authedFetch(`/api/admin/chatbot/conversations/${selectedId}/send-media`, {
        method: "POST",
        body: formData,
      });
      setMediaFile(null);
      setMediaCaption("");
      setShowMediaPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadThread(selectedId);
      await loadConversations();
    } catch (err) {
      alert(`Failed to send: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "handed_off" ? "active" : "handed_off";
    try {
      await authedJsonFetch(`/api/admin/chatbot/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await loadConversations();
    } catch (err) {
      alert(`Failed to update status: ${(err as Error).message}`);
    }
  };

  const addExclusion = async () => {
    if (!newNumber.trim()) return;
    try {
      await authedJsonFetch("/api/admin/chatbot/excluded-numbers", {
        method: "POST",
        body: JSON.stringify({ channel, externalUserId: newNumber.trim(), reason: newReason.trim() || undefined }),
      });
      setNewNumber("");
      setNewReason("");
      await loadExcluded();
    } catch (err) {
      alert(`Failed to add: ${(err as Error).message}`);
    }
  };

  const removeExclusion = async (id: string) => {
    try {
      await authedJsonFetch("/api/admin/chatbot/excluded-numbers", { method: "DELETE", body: JSON.stringify({ id }) });
      await loadExcluded();
    } catch (err) {
      alert(`Failed to remove: ${(err as Error).message}`);
    }
  };

  const addWatch = async () => {
    if (!newWatchNumber.trim()) return;
    try {
      await authedJsonFetch("/api/admin/chatbot/watched-numbers", {
        method: "POST",
        body: JSON.stringify({ channel, externalUserId: newWatchNumber.trim(), label: newWatchLabel.trim() || undefined }),
      });
      setNewWatchNumber("");
      setNewWatchLabel("");
      await loadWatched();
    } catch (err) {
      alert(`Failed to add: ${(err as Error).message}`);
    }
  };

  const removeWatch = async (id: string) => {
    try {
      await authedJsonFetch("/api/admin/chatbot/watched-numbers", { method: "DELETE", body: JSON.stringify({ id }) });
      await loadWatched();
    } catch (err) {
      alert(`Failed to remove: ${(err as Error).message}`);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">
        Loading {theme.label}...
      </div>
    );
  }

  const numberPlaceholder =
    channel === "whatsapp"
      ? "Phone number, e.g. 917707801014"
      : channel === "website"
      ? "Visitor ID (from the conversation list)"
      : "Platform user ID";

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />

      <div className={`${theme.headerBg} pt-24 pb-8 px-6`}>
        <div className="max-w-[1400px] mx-auto">
          <button
            onClick={() => router.push("/admin/chatbot")}
            className="flex items-center gap-2 text-xs uppercase font-bold text-white/70 hover:text-white mb-4"
          >
            <FaArrowLeft /> All channels
          </button>
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{theme.icon}</span>
              <div>
                <h1 className="font-orbitron text-3xl font-bold text-white">{theme.label}</h1>
                <p className="text-white/70 text-sm">{conversations.length} conversations</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWatched((s) => !s)}
                className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/20 transition-all"
              >
                <FaBell /> Watched ({watched.length})
              </button>
              <button
                onClick={() => setShowExclusions((s) => !s)}
                className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/20 transition-all"
              >
                <FaBan /> Excluded ({excluded.length})
              </button>
              <button
                onClick={loadConversations}
                className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/20 transition-all"
              >
                <FaSync /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto mt-6">
        {showWatched && (
          <div className="mb-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className={`font-orbitron text-sm font-bold ${theme.accentText} mb-4 uppercase tracking-widest`}>
              {theme.label} numbers that email you the moment they message
            </h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                value={newWatchNumber}
                onChange={(e) => setNewWatchNumber(e.target.value)}
                placeholder={numberPlaceholder}
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
              />
              <input
                value={newWatchLabel}
                onChange={(e) => setNewWatchLabel(e.target.value)}
                placeholder="Label (optional, e.g. VIP customer)"
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px]"
              />
              <button onClick={addWatch} className={`${theme.buttonBg} px-4 py-2 rounded text-xs uppercase font-bold`}>
                Add
              </button>
            </div>
            <div className="space-y-2">
              {watched.length === 0 && <p className="text-brand-silver text-sm">None yet.</p>}
              {watched.map((w) => (
                <div key={w.id} className="flex items-center justify-between bg-[#121212] border border-white/5 rounded px-4 py-2">
                  <div className="text-sm">
                    {w.externalUserId} {w.label && <span className="text-brand-silver">— {w.label}</span>}
                  </div>
                  <button onClick={() => removeWatch(w.id)} className="text-red-400 hover:text-red-300">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showExclusions && (
          <div className="mb-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className={`font-orbitron text-sm font-bold ${theme.accentText} mb-4 uppercase tracking-widest`}>
              {theme.label} numbers the bot never auto-replies to
            </h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder={numberPlaceholder}
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
              />
              <input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Reason (optional)"
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px]"
              />
              <button onClick={addExclusion} className={`${theme.buttonBg} px-4 py-2 rounded text-xs uppercase font-bold`}>
                Add
              </button>
            </div>
            <div className="space-y-2">
              {excluded.length === 0 && <p className="text-brand-silver text-sm">None yet.</p>}
              {excluded.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-[#121212] border border-white/5 rounded px-4 py-2">
                  <div className="text-sm">
                    {e.externalUserId} {e.reason && <span className="text-brand-silver">— {e.reason}</span>}
                  </div>
                  <button onClick={() => removeExclusion(e.id)} className="text-red-400 hover:text-red-300">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden lg:col-span-1">
            <div className="p-4 border-b border-white/10 text-xs uppercase font-bold text-brand-silver tracking-widest">
              {loadingList ? "Loading..." : `${conversations.length} conversations`}
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/5">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-all ${
                    selectedId === c.id ? `bg-white/10 border-l-2 ${theme.accentBorder}` : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold truncate">{c.displayName || c.externalUserId}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === "handed_off" && (
                        <span className="text-[10px] uppercase font-bold text-yellow-400">Paused</span>
                      )}
                      <span className="text-[10px] text-brand-silver">{formatTimestamp(c.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-brand-silver truncate">
                    {c.lastMessage?.content || "No messages yet"}
                  </div>
                </button>
              ))}
              {!loadingList && conversations.length === 0 && (
                <div className="p-6 text-center text-brand-silver text-sm">No conversations yet.</div>
              )}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden lg:col-span-2 flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-brand-silver p-12 text-sm">
                Select a conversation to view it.
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{selectedConversation.displayName || selectedConversation.externalUserId}</div>
                    <div className="text-xs text-brand-silver">{selectedConversation.externalUserId}</div>
                  </div>
                  <button
                    onClick={() => toggleStatus(selectedConversation.id, selectedConversation.status)}
                    className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/10"
                  >
                    {selectedConversation.status === "handed_off" ? (
                      <>
                        <FaPlay /> Resume Bot
                      </>
                    ) : (
                      <>
                        <FaPause /> Pause Bot
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 max-h-[55vh] overflow-y-auto p-4 space-y-3">
                  {loadingThread && <div className="text-brand-silver text-sm">Loading...</div>}
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                          m.role === "user" ? "bg-white/5 border border-white/10" : `${theme.bubbleOut} border border-white/10`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-bold text-brand-silver">
                          {m.role === "user" ? <FaUser /> : m.provider === "human" ? <FaUser /> : <FaRobot />}
                          {m.role === "user" ? "Customer" : m.provider === "human" ? "You (manual)" : `Bot (${m.provider || "?"})`}
                        </div>
                        {m.media_url && m.media_type === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.media_url} alt="" className="rounded mb-2 max-w-full max-h-[300px]" />
                        )}
                        {m.media_url && m.media_type === "document" && (
                          <a
                            href={m.media_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 mb-2 underline text-xs"
                          >
                            <FaPaperclip /> Attached file
                          </a>
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                {showMediaPicker && (
                  <div className="px-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                      className="text-xs text-brand-silver"
                    />
                    <input
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Caption (optional)"
                      className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={sendMedia}
                        disabled={sending || !mediaFile}
                        className={`${theme.buttonBg} disabled:opacity-40 px-4 py-2 rounded text-xs uppercase font-bold flex-1`}
                      >
                        Send file
                      </button>
                      <button
                        onClick={() => {
                          setShowMediaPicker(false);
                          setMediaFile(null);
                          setMediaCaption("");
                        }}
                        className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded text-xs uppercase font-bold border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-white/10 flex gap-3">
                  {channel !== "website" && (
                    <button
                      onClick={() => setShowMediaPicker((s) => !s)}
                      className="bg-white/5 hover:bg-white/10 px-3 rounded border border-white/10 shrink-0"
                      title="Attach image or file"
                    >
                      <FaPaperclip />
                    </button>
                  )}
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type a manual reply..."
                    className="flex-1 bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className={`${theme.buttonBg} disabled:opacity-40 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold`}
                  >
                    <FaPaperPlane /> Send
                  </button>
                </div>
                <p className="px-4 pb-3 text-[11px] text-brand-silver">
                  Sending a manual reply automatically pauses the bot for this conversation.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
