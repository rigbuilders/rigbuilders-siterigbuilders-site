"use client";

import { use } from "react";
import SeriesTierProducts from "@/components/series/SeriesTierProducts";

export default function CreatorTierPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = use(params);
  return (
    <SeriesTierProducts
      series="creator"
      label="Creator"
      subtitle="High-fidelity systems for creative professionals."
      tier={tier}
    />
  );
}
