import { Metadata } from "next";
import SeriesTierList from "@/components/series/SeriesTierList";

export const metadata: Metadata = {
  title: "Ascend Series | High-Performance Gaming PCs",
  description: "High-performance gaming PCs in India with powerful CPUs, GPUs, and clean builds by Rig Builders",
};

export default function AscendPage() {
  return (
    <SeriesTierList
      kicker="Competitive gaming"
      title="ASCEND"
      accent="SERIES"
      subtitle="Precision-tuned for competitive dominance. Choose your performance bracket."
      ctaLabel="Deploy System"
      tiers={[
        {
          num: "05", title: "Ascend Level 5", href: "/ascend/5", icon: "crosshairs",
          desc: "1080p Competitive Dominance. High-FPS architecture optimized for E-Sports titles like Valorant, CS2, and Apex Legends.",
        },
        {
          num: "07", title: "Ascend Level 7", href: "/ascend/7", icon: "bolt", bestSeller: true,
          desc: "1440p Sweet Spot. The perfect balance of power and value for modern AAA titles and streaming capabilities.",
        },
        {
          num: "09", title: "Ascend Level 9", href: "/ascend/9", icon: "crown",
          desc: "4K Ultra Performance. No compromises. Pure silicon power for enthusiasts who demand max settings.",
        },
      ]}
    />
  );
}
