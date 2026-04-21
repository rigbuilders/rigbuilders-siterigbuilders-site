import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import MobileCategoryClient from './MobileCategoryClient';

// Helper to format nice titles for SEO
const formatTitle = (cat: string) => {
  const map: Record<string, string> = {
    cpu: "Processors (CPU)", gpu: "Graphics Cards (GPU)", ram: "Memory (RAM)",
    motherboard: "Motherboards", storage: "SSD & Storage", psu: "Power Supplies",
    cabinet: "PC Cabinets", cooler: "CPU Coolers", monitor: "Gaming Monitors",
    keyboard: "Mechanical Keyboards", mouse: "Gaming Mice", combo: "Keyboard & Mouse",
    mousepad: "Mouse Pads", usb: "USB Drives"
  };
  return map[cat.toLowerCase()] || cat.toUpperCase();
};

// Security Check Array
const validCategories = [
  "cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet",
  "monitor", "keyboard", "mouse", "combo", "mousepad", "usb"
];

// 1. GENERATE DYNAMIC SEO METADATA
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  
  if (!validCategories.includes(category.toLowerCase())) {
    return { title: "Category Not Found" };
  }

  const niceTitle = formatTitle(category);

  return {
    title: `Buy ${niceTitle} | Rig Builders Mobile`,
    description: `Shop premium ${niceTitle} at Rig Builders. High-performance components, official warranty, and secure shipping across India.`,
    openGraph: {
      title: `${niceTitle} - Premium PC Components`,
      description: `Upgrade your rig with the best ${niceTitle} from Rig Builders.`,
      url: `https://www.rigbuilders.in/m/components/${category}`,
      type: 'website',
    },
  };
}

// 2. MAIN SERVER COMPONENT
export default async function MobileCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  // 404 Protection
  if (!validCategories.includes(category.toLowerCase())) {
    notFound();
  }

  return (
    // Suspense boundary is required in Next.js 15 when the child component uses useSearchParams()
    <Suspense fallback={
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-orbitron text-[#B084FF]">
            <div className="w-8 h-8 border-2 border-[#B084FF] border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-xs tracking-widest uppercase animate-pulse">Establishing Link...</div>
        </div>
    }>
        <MobileCategoryClient category={category} />
    </Suspense>
  );
}