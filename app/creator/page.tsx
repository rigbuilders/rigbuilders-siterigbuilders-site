import { Metadata } from "next";
import SeriesTierList from "@/components/series/SeriesTierList";

export const metadata: Metadata = {
  title: "Creator Series | Built for Professionals",
  description: "Pre-Builts Desktop series for creators, editors, and 3D artists — optimized for rendering, multitasking, and speed",
};

export default function CreatorPage() {
  return (
    <SeriesTierList
      kicker="Studio-grade"
      title="CREATOR"
      accent="SERIES"
      subtitle="Designed for streamers, artists, and editors. Optimized for the Adobe Suite and 3D pipelines."
      ctaLabel="Open Studio"
      tiers={[
        {
          num: "05", title: "Creator 5", href: "/creator/5", icon: "pen",
          desc: "Photo Editing & 1080p Video. The perfect canvas for Adobe Photoshop, Lightroom, and digital illustration.",
        },
        {
          num: "07", title: "Creator 7", href: "/creator/7", icon: "video", bestSeller: true,
          desc: "4K Video Editing & Motion Graphics. Optimized timeline performance for After Effects and Premiere Pro.",
        },
        {
          num: "09", title: "Creator 9", href: "/creator/9", icon: "cube",
          desc: "3D Rendering & Cinema 4D. Workstation-grade power for Blender, Maya, and heavy VFX simulation.",
        },
      ]}
    />
  );
}
