"use client";

import { use } from "react";
import SeriesTierProducts from "@/components/series/SeriesTierProducts";

export default function WorkProTierPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = use(params);
  return (
    <SeriesTierProducts
      series="workpro"
      label="WorkPro"
      subtitle="Professional workstations engineered for stability and heavy computation."
      tier={tier}
    />
  );
}
