import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from './CategoryClient';

// Helper to format nice titles (e.g. 'cpu' -> 'Processors')
const formatTitle = (cat: string) => {
  const map: Record<string, string> = {
    cpu: "Processors (CPU)",
    gpu: "Graphics Cards (GPU)",
    ram: "Memory (RAM)",
    motherboard: "Motherboards",
    storage: "SSD & Storage",
    psu: "Power Supplies (PSU)",
    cabinet: "PC Cabinets",
    cooler: "CPU Coolers",
    monitor: "Gaming Monitors",
    keyboard: "Mechanical Keyboards",
    mouse: "Gaming Mice",
    combo: "Keyboard & Mouse Combos",
    mousepad: "Mouse Pads",
    usb: "USB Drives",
    prebuilt: "Pre-Built Gaming PCs",
    workpro: "Workstation PCs"
  };
  return map[cat.toLowerCase()] || cat.toUpperCase();
};

const validCategories = [
  "cpu", "gpu", "motherboard", "memory", "ram", "storage", "psu", "cooler", "cabinet", "prebuilt",
  "monitor", "keyboard", "mouse", "combo", "mousepad", "usb"
];

// 1. GENERATE SEO TITLE & DESC (Server Side)
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  
  if (!validCategories.includes(category.toLowerCase())) {
    return { title: "Category Not Found" };
  }

  const niceTitle = formatTitle(category);

  return {
    title: `Buy ${niceTitle} | Rig Builders India`,
    description: `Shop premium ${niceTitle} at Rig Builders. High-performance components, official warranty, and secure shipping across India.`,
    openGraph: {
      title: `${niceTitle} - Premium PC Components`,
      description: `Upgrade your rig with the best ${niceTitle} from Rig Builders.`,
      url: `https://www.rigbuilders.in/products/${category}`,
      type: 'website',
    },
  };
}

// 2. MAIN PAGE (Server Side)
export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  if (!validCategories.includes(category.toLowerCase())) {
    return notFound();
  }

  // Pass the category to the Client Component
  return <CategoryClient category={category.toLowerCase()} />;
}