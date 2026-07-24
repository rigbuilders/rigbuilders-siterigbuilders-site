import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "@/app/globals.css";
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/next"
import { Headset } from "lucide-react"; 
import FloatingBuilderBtn from "@/components/FloatingBuilderBtn";
import DesktopWidgets from "@/components/DesktopWidgets";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  weight: ["300", "400", "500", "600", "700"], 
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// --- SEO CONFIGURATION ---
export const metadata: Metadata = {
  metadataBase: new URL("https://www.rigbuilders.in"),

  // Reinforces "Rig Builders" as the site/app name for Google's site-name feature.
  applicationName: "Rig Builders",

  title: {
    default: "Rig Builders - Custom Gaming PCs & Workstations India",
    template: "%s | Rig Builders",
  },
  description: "India's premium custom PC builder. We commission high-performance Gaming PCs, Workstations, and Creator Rigs with pan-India insured delivery.",

  keywords: ["Custom PC India", "Gaming PC Build", "Workstation PC", "Rig Builders", "Liquid Cooled PC"],

  alternates: {
    canonical: "/",
  },

  // 2. UNIFIED ICON CONFIGURATION (Best for Google Search)
  // Assumes you place a solid square 'icon.png' (e.g. 192x192px) in your public folder
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },

  openGraph: {
    // Keep og:title consistent with the <title> so brand signals don't conflict.
    title: "Rig Builders - Custom Gaming PCs & Workstations India",
    description: "Premium Custom PCs built for performance.",
    type: "website",
    locale: "en_IN",
    url: "https://www.rigbuilders.in",
    siteName: "Rig Builders", // Strongly hints the name to Google
    images: [
      {
        url: "/opengraph-image.png", 
        width: 1200,
        height: 630,
        alt: "Rig Builders Custom PCs",
      },
    ],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // JSON-LD SCHEMA (Brand Identity & Site Name for Google)
  // A single connected @graph — WebSite is explicitly published by the
  // Organization entity (@id linked). This is the pattern Google reads with the
  // highest confidence when deciding the site name shown in Search.
  const siteUrl = "https://www.rigbuilders.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Rig Builders",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/icon.png`,
          "width": 512,
          "height": 512,
        },
        "sameAs": [
          "https://www.instagram.com/rig_builders/",
          "https://www.youtube.com/@RIGBUILDERS",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-7707801014",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": "en",
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "MCB Z2 12267, Sahibzada Jujhar Singh Nagar",
          "addressLocality": "Bathinda",
          "addressRegion": "Punjab",
          "postalCode": "151001",
          "addressCountry": "IN",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "name": "Rig Builders",
        "alternateName": ["RigBuilders", "Rig Builders India"],
        "url": siteUrl,
        "publisher": { "@id": `${siteUrl}/#organization` },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/products?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body 
        suppressHydrationWarning={true}
        className={`${saira.variable} ${orbitron.variable} font-saira antialiased bg-brand-black text-brand-silver`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <ModalProvider>
          <CartProvider>
            <GlobalModal />
            {children}

            {/* HIDES DESKTOP FLOATING WIDGETS ON MOBILE */}
            <div className="hidden md:block">
                <DesktopWidgets />
            </div>

          </CartProvider>
        </ModalProvider>
        
        <Toaster 
          position="top-center" 
          theme="dark" 
          richColors 
          closeButton
        />
      </body>
    </html>
  );
}