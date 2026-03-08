"use client";

import Link from "next/link";
import { FaHome, FaChevronRight } from "react-icons/fa";

interface ProductBreadcrumbProps {
  category: string;
  name?: string; // <-- Make this optional
  series?: string;
  tier?: string;
  breadcrumbName?: string;
}

export default function ProductBreadcrumb({ 
  category, 
  name, 
  series, 
  tier, 
  breadcrumbName 
}: ProductBreadcrumbProps) {

  const getSeriesLink = (seriesName: string) => {
    const s = seriesName.toLowerCase();
    if (['workpro', 'ascend', 'creator', 'signature'].includes(s)) return `/${s}`;
    return '/desktops';
  };

  // Helper to format category nicely
  const formatCategory = (cat: string) => {
      const map: Record<string, string> = {
          gpu: 'Graphics Card', cpu: 'Processor', psu: 'Power Supply', ram: 'Memory (RAM)'
      };
      return map[cat.toLowerCase()] || cat;
  };

  return (
    <div className="pt-[20px] pb-4 px-[20px] md:px-[40px] 2xl:px-[100px] relative z-10 border-b border-white/5 bg-[#121212]">
      <div className="flex flex-wrap items-center gap-2 text-sm text-brand-silver font-medium">
        
        {/* 1. Home */}
        <Link href="/" className="hover:text-brand-purple transition-colors flex items-center gap-1">
          <FaHome /> Home
        </Link>
        <FaChevronRight size={10} className="opacity-50" />

        {/* 2. Category Logic */}
        {category === 'prebuilt' ? (
          <>
            <Link href="/desktops" className="hover:text-brand-purple transition-colors">Desktops</Link>
            {series && (
              <>
                <FaChevronRight size={10} className="opacity-50" />
                <Link href={getSeriesLink(series)} className={`capitalize ${!name ? 'text-white font-bold pointer-events-none' : 'hover:text-brand-purple transition-colors'}`}>
                  {series} Series
                </Link>
              </>
            )}
            {series && tier && (
              <>
                <FaChevronRight size={10} className="opacity-50" />
                <Link href={`/${series.toLowerCase()}/${tier}`} className={`capitalize ${!name ? 'text-white font-bold pointer-events-none' : 'hover:text-brand-purple transition-colors'}`}>
                  {series} {tier}
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <Link href="/products" className="hover:text-brand-purple transition-colors">Components</Link>
            <FaChevronRight size={10} className="opacity-50" />
            <Link href={`/products/${category}`} className={`capitalize ${!name ? 'text-white font-bold pointer-events-none' : 'hover:text-brand-purple transition-colors'}`}>
              {formatCategory(category)}
            </Link>
          </>
        )}

        {/* 3. Product Name (Only shows if on a Product Page) */}
        {name && (
            <>
                <FaChevronRight size={10} className="opacity-50" />
                <span className="text-white truncate max-w-[200px] capitalize font-bold">
                {breadcrumbName ? breadcrumbName : name.toLowerCase()}
                </span>
            </>
        )}
      </div>
    </div>
  );
}