import { notFound } from "next/navigation";
import { FaWhatsapp, FaFacebookMessenger, FaInstagram, FaGlobe } from "react-icons/fa";
import ChannelChatDashboard, { type ChannelTheme } from "@/components/admin/ChannelChatDashboard";

/**
 * URL segment -> internal channel value. The URL/card say "Facebook" (the
 * platform customers know), but every table row, adapter key, and existing
 * query in lib/chatbot/* already uses "messenger" (the actual product this
 * is — Messenger, Meta's chat product for Facebook Pages) — renaming that
 * throughout the codebase for a cosmetic label wasn't worth the churn, so
 * this one map bridges the two.
 */
const ROUTE_TO_CHANNEL: Record<string, string> = {
  whatsapp: "whatsapp",
  facebook: "messenger",
  instagram: "instagram",
  website: "website",
};

const THEMES: Record<string, ChannelTheme> = {
  whatsapp: {
    label: "WhatsApp",
    icon: <FaWhatsapp />,
    accentText: "text-green-400",
    accentBorder: "border-green-500",
    accentBg: "bg-green-500/10",
    headerBg: "bg-gradient-to-r from-[#075E54] to-[#128C7E]",
    bubbleOut: "bg-[#005C4B]",
    buttonBg: "bg-[#25D366] hover:bg-[#20bd5a] text-[#0B141A]",
  },
  facebook: {
    label: "Facebook Messenger",
    icon: <FaFacebookMessenger />,
    accentText: "text-blue-400",
    accentBorder: "border-blue-500",
    accentBg: "bg-blue-500/10",
    headerBg: "bg-gradient-to-r from-[#0084FF] to-[#00C6FF]",
    bubbleOut: "bg-[#0084FF]/30",
    buttonBg: "bg-[#0084FF] hover:bg-[#006fd6] text-white",
  },
  instagram: {
    label: "Instagram",
    icon: <FaInstagram />,
    accentText: "text-pink-400",
    accentBorder: "border-pink-500",
    accentBg: "bg-pink-500/10",
    headerBg: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
    bubbleOut: "bg-gradient-to-br from-[#833AB4]/40 to-[#FD1D1D]/30",
    buttonBg: "bg-gradient-to-r from-[#833AB4] to-[#FD1D1D] hover:opacity-90 text-white",
  },
  website: {
    label: "Website",
    icon: <FaGlobe />,
    accentText: "text-brand-purple",
    accentBorder: "border-brand-purple",
    accentBg: "bg-brand-purple/10",
    headerBg: "bg-gradient-to-r from-[#4A1D8F] to-[#7C3AED]",
    bubbleOut: "bg-brand-purple/20",
    buttonBg: "bg-brand-purple hover:bg-brand-purple/80 text-white",
  },
};

export default async function ChannelPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel: routeChannel } = await params;
  const channel = ROUTE_TO_CHANNEL[routeChannel];
  const theme = THEMES[routeChannel];

  if (!channel || !theme) {
    notFound();
  }

  return <ChannelChatDashboard channel={channel} theme={theme} />;
}
