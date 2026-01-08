"use client";

import Link from "next/link";
import { FaHome, FaChevronRight } from "react-icons/fa";

interface ProductBreadcrumbProps {
  category: string;
  name: string;
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

  // Helper: Map DB series names to actual URL routes
  const getSeriesLink = (seriesName: string) => {
    const s = seriesName.toLowerCase();
    // These match the routes defined in your Navbar
    if (['workpro', 'ascend', 'creator', 'signature'].includes(s)) {
      return `/${s}`;
    }
    return '/desktops'; // Fallback
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
            {/* Level 1: Desktops */}
            <Link href="/desktops" className="hover:text-brand-purple transition-colors">
              Desktops
            </Link>

            {/* Level 2: Series (e.g., Workpro Series) */}
            {series && (
              <>
                <FaChevronRight size={10} className="opacity-50" />
                <Link 
                  href={getSeriesLink(series)} 
                  className="hover:text-brand-purple transition-colors capitalize"
                >
                  {series} Series
                </Link>
              </>
            )}

            {/* Level 3: Tier (e.g., Workpro 7) */}
            {series && tier && (
              <>
                <FaChevronRight size={10} className="opacity-50" />
                <Link 
                  /* FIX: Direct link to the dynamic route /workpro/[tier] */
                  href={`/${series.toLowerCase()}/${tier}`} 
                  className="hover:text-brand-purple transition-colors capitalize"
                >
                  {series} {tier}
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            {/* Level 1: Components */}
            <Link href="/products" className="hover:text-brand-purple transition-colors">
              Components
            </Link>
            
            <FaChevronRight size={10} className="opacity-50" />
            
            {/* Level 2: Specific Component Category */}
            <Link href={`/products/${category}`} className="hover:text-brand-purple transition-colors capitalize">
              {category === 'gpu' ? 'Graphics Card' :
               category === 'cpu' ? 'Processor' :
               category === 'psu' ? 'Power Supply' :
               category}
            </Link>
          </>
        )}

        <FaChevronRight size={10} className="opacity-50" />
        
        {/* 3. Product Name (Current Page) */}
        <span className="text-white truncate max-w-[200px] capitalize font-bold">
          {breadcrumbName ? breadcrumbName : name.toLowerCase()}
        </span>
      </div>
    </div>
  );
}