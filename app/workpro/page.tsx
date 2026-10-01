import { Metadata } from "next";
import SeriesTierList from "@/components/series/SeriesTierList";

export const metadata: Metadata = {
  title: "WorkPro Series | Professional Workstation Desktops",
  description: "Professional Desktop series for Workstations built by Rig Builders for performance and stability.",
};

export default function WorkProPage() {
  return (
    <SeriesTierList
      kicker="Workstation-grade"
      title="WORKPRO"
      accent="SERIES"
      subtitle="Precision-engineered workstations. Designed for stability, rendering, and heavy computation."
      ctaLabel="Explore Series"
      tiers={[
        {
          num: "05", title: "WorkPro 5", href: "/workpro/5", icon: "code",
          desc: "Efficient Office & Entry Productivity. Optimized for coding, financial modeling, and heavy multitasking.",
        },
        {
          num: "07", title: "WorkPro 7", href: "/workpro/7", icon: "drafting", bestSeller: true,
          desc: "Engineering & Content Creation. The standard for 4K video editing, 3D modeling, and CAD workflows.",
        },
        {
          num: "09", title: "WorkPro 9", href: "/workpro/9", icon: "brain",
          desc: "Data Science & AI Training. Unmatched computational power for deep learning and heavy simulation.",
        },
      ]}
    />
  );
}
