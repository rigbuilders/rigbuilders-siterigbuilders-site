"use client";

import Link from "next/link";
import { FaHome, FaChevronRight } from "react-icons/fa";
import { getCategory } from "@/app/data/categories";

interface ProductBreadcrumbProps {
  category: string;
  name?: string;          // set on product detail pages
  series?: string | null; // prebuilt: desktop series | components: chipset series
  tier?: string | null;   // prebuilt tier
  maker?: string | null;  // components funnel: NVIDIA / AMD / Intel
  chipset?: string | null;// components funnel: e.g. RTX 4070
  breadcrumbName?: string;
}

const SITE = "https://www.rigbuilders.in";

type Crumb = { label: string; href?: string };

export default function ProductBreadcrumb({
  category,
  name,
  series,
  tier,
  maker,
  chipset,
  breadcrumbName,
}: ProductBreadcrumbProps) {
  const cat = getCategory(category);

  const getSeriesLink = (s: string) =>
    ["workpro", "ascend", "creator", "signature"].includes(s.toLowerCase()) ? `/${s.toLowerCase()}` : "/desktops";

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  if (category === "prebuilt") {
    crumbs.push({ label: "Desktops", href: "/desktops" });
    if (series) crumbs.push({ label: `${series} Series`, href: getSeriesLink(series) });
    if (series && tier) crumbs.push({ label: `${series} ${tier}`, href: `/${series.toLowerCase()}/${tier}` });
  } else {
    const slug = cat?.slug ?? category.toLowerCase();
    crumbs.push({ label: "Components", href: "/products" });
    crumbs.push({ label: cat?.short ?? category, href: `/products/${slug}` });
    if (maker) crumbs.push({ label: maker, href: `/products/${slug}?maker=${encodeURIComponent(maker)}` });
    if (maker && series)
      crumbs.push({ label: series, href: `/products/${slug}?maker=${encodeURIComponent(maker)}&series=${encodeURIComponent(series)}` });
    if (chipset) crumbs.push({ label: chipset, href: `/products/${slug}?chipset=${encodeURIComponent(chipset)}` });
  }

  if (name) crumbs.push({ label: breadcrumbName || name });

  // The deepest crumb is the current page — render it bold and non-clickable.
  if (crumbs.length > 1) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };

  // schema.org BreadcrumbList for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE}${c.href}` } : {}),
    })),
  };

  return (
    <div className="pt-[20px] pb-4 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10 border-b border-white/5 bg-[#121212]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex flex-wrap items-center gap-2 text-sm text-brand-silver font-medium">
        {crumbs.map((c, i) => (
          <div key={`${c.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <FaChevronRight size={10} className="opacity-50" />}
            {c.href ? (
              <Link
                href={c.href}
                className="hover:text-brand-purple transition-colors flex items-center gap-1 capitalize"
              >
                {i === 0 && <FaHome />}
                {c.label}
              </Link>
            ) : (
              <span className="text-white truncate max-w-[220px] capitalize font-bold">{c.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
