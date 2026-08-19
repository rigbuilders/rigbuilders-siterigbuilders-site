"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { FaWhatsapp, FaFacebookMessenger, FaInstagram, FaGlobe, FaArrowRight } from "react-icons/fa";

const ADMIN_EMAIL = "rigbuilders123@gmail.com";

interface ConversationSummary {
  id: string;
  channel: string;
  status: "active" | "handed_off" | "closed";
  updatedAt: string;
}

const CARDS = [
  {
    route: "whatsapp",
    channel: "whatsapp",
    label: "WhatsApp",
    icon: <FaWhatsapp />,
    gradient: "from-[#075E54] to-[#128C7E]",
  },
  {
    route: "facebook",
    channel: "messenger",
    label: "Facebook",
    icon: <FaFacebookMessenger />,
    gradient: "from-[#0084FF] to-[#00C6FF]",
  },
  {
    route: "instagram",
    channel: "instagram",
    label: "Instagram",
    icon: <FaInstagram />,
    gradient: "from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
  },
  {
    route: "website",
    channel: "website",
    label: "Website",
    icon: <FaGlobe />,
    gradient: "from-[#4A1D8F] to-[#7C3AED]",
  },
];

async function authedFetch(path: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

/**
 * Hub page: pick a channel, land on its own dedicated dashboard at
 * app/admin/chatbot/[channel]/page.tsx. Each dashboard is a full
 * ChannelChatDashboard instance (components/admin/ChannelChatDashboard.tsx)
 * themed and filtered to just that channel.
 */
export default function ChatbotHub() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      setReady(true);
      try {
        const json = await authedFetch("/api/admin/chatbot/conversations");
        setConversations(json.conversations || []);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [router]);

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
        <div className="mb-10">
          <h1 className="font-orbitron text-3xl font-bold text-brand-purple">CHATBOT INBOX</h1>
          <p className="text-brand-silver text-sm">Pick a channel to open its live dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card) => {
            const channelConvos = conversations.filter((c) => c.channel === card.channel);
            const paused = channelConvos.filter((c) => c.status === "handed_off").length;

            return (
              <button
                key={card.route}
                onClick={() => router.push(`/admin/chatbot/${card.route}`)}
                className={`group relative overflow-hidden rounded-2xl p-6 text-left border border-white/10 bg-gradient-to-br ${card.gradient} hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-4xl">{card.icon}</span>
                  <FaArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-orbitron text-xl font-bold">{card.label}</div>
                <div className="text-sm text-white/80 mt-1">
                  {channelConvos.length} conversation{channelConvos.length === 1 ? "" : "s"}
                  {paused > 0 && <span className="ml-2 text-yellow-300 font-bold">· {paused} paused</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
