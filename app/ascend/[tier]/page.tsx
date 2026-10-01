"use client";

import { use } from "react";
import SeriesTierProducts from "@/components/series/SeriesTierProducts";

export default function AscendTierPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = use(params);
  return (
    <SeriesTierProducts
      series="ascend"
      label="Ascend"
      subtitle="Expertly crafted configurations for this performance tier."
      tier={tier}
    />
  );
}
