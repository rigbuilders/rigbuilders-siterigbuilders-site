"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaSync, FaPause, FaPlay, FaBan, FaPaperPlane, FaRobot, FaUser, FaTrash } from "react-icons/fa";

const ADMIN_EMAIL = "rigbuilders123@gmail.com";

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
}

interface ExcludedNumber {
  id: string;
  channel: string;
  externalUserId: string;
  reason: string | null;
  createdAt: string;
}

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: "text-green-400 border-green-400/30 bg-green-400/10",
  instagram: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  messenger: "text-blue-400 border-blue-400/30 bg-blue-400/10",
};

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export default function ChatbotInbox() {
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
  const [newChannel, setNewChannel] = useState("whatsapp");
  const [newNumber, setNewNumber] = useState("");
  const [newReason, setNewReason] = useState("");

  // --- AUTH ---
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
      const json = await authedFetch("/api/admin/chatbot/conversations");
      setConversations(json.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

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
      setExcluded(json.excluded || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadConversations();
    loadExcluded();
  }, [ready, loadConversations, loadExcluded]);

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
  }, [selectedId, loadThread]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      await authedFetch(`/api/admin/chatbot/conversations/${selectedId}/reply`, {
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

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "handed_off" ? "active" : "handed_off";
    try {
      await authedFetch(`/api/admin/chatbot/conversations/${id}`, {
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
      await authedFetch("/api/admin/chatbot/excluded-numbers", {
        method: "POST",
        body: JSON.stringify({ channel: newChannel, externalUserId: newNumber.trim(), reason: newReason.trim() || undefined }),
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
      await authedFetch("/api/admin/chatbot/excluded-numbers", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await loadExcluded();
    } catch (err) {
      alert(`Failed to remove: ${(err as Error).message}`);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-orbitron animate-pulse">
        Loading Inbox...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-saira pb-20">
      <Navbar />

      <div className="pt-32 px-6 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-brand-purple">CHATBOT INBOX</h1>
            <p className="text-brand-silver text-sm">Live conversations across WhatsApp, Instagram, Messenger</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExclusions((s) => !s)}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/10 transition-all"
            >
              <FaBan /> Excluded Numbers ({excluded.length})
            </button>
            <button
              onClick={loadConversations}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold border border-white/10 transition-all"
            >
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {showExclusions && (
          <div className="mb-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className="font-orbitron text-sm font-bold text-brand-purple mb-4 uppercase tracking-widest">
              Numbers the bot never auto-replies to
            </h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="messenger">Messenger</option>
              </select>
              <input
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder={newChannel === "whatsapp" ? "Phone number, e.g. 917707801014" : "Platform user ID"}
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
              />
              <input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Reason (optional)"
                className="bg-[#121212] border border-white/10 rounded px-3 py-2 text-sm flex-1 min-w-[150px]"
              />
              <button
                onClick={addExclusion}
                className="bg-brand-purple hover:bg-brand-purple/80 px-4 py-2 rounded text-xs uppercase font-bold"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {excluded.length === 0 && <p className="text-brand-silver text-sm">None yet.</p>}
              {excluded.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-[#121212] border border-white/5 rounded px-4 py-2">
                  <div className="text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold mr-2 border ${CHANNEL_COLOR[e.channel] || ""}`}>
                      {e.channel}
                    </span>
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
          {/* Conversation list */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden lg:col-span-1">
            <div className="p-4 border-b border-white/10 text-xs uppercase font-bold text-brand-silver tracking-widest">
              {loadingList ? "Loading..." : `${conversations.length} conversations`}
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/5">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-all ${selectedId === c.id ? "bg-white/10" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${CHANNEL_COLOR[c.channel] || ""}`}>
                      {c.channel}
                    </span>
                    {c.status === "handed_off" && (
                      <span className="text-[10px] uppercase font-bold text-yellow-400">Paused</span>
                    )}
                  </div>
                  <div className="text-sm font-bold truncate">{c.displayName || c.externalUserId}</div>
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

          {/* Thread + reply */}
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
                    <div className="text-xs text-brand-silver">
                      {selectedConversation.channel} · {selectedConversation.externalUserId}
                    </div>
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
                          m.role === "user"
                            ? "bg-white/5 border border-white/10"
                            : m.provider === "human"
                              ? "bg-blue-500/20 border border-blue-400/30"
                              : "bg-brand-purple/20 border border-brand-purple/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-bold text-brand-silver">
                          {m.role === "user" ? <FaUser /> : m.provider === "human" ? <FaUser /> : <FaRobot />}
                          {m.role === "user" ? "Customer" : m.provider === "human" ? "You (manual)" : `Bot (${m.provider || "?"})`}
                        </div>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-white/10 flex gap-3">
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
                    className="bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-40 px-4 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold"
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
