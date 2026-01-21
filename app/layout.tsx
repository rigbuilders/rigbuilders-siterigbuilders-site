import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/next"
import { Headset } from "lucide-react"; 
import FloatingBuilderBtn from "@/components/FloatingBuilderBtn";

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
  // 1. CRITICAL: Set the Base URL so images/links resolve correctly
  metadataBase: new URL("https://www.rigbuilders.in"),

  title: {
    default: "Rig Builders | Premium Custom PC Commissions",
    template: "%s | Rig Builders",
  },
  description: "India's premium custom PC builder. We commission high-performance Gaming PCs, Workstations, and Creator Rigs.",
  applicationName: "Rig Builders",
  keywords: ["Custom PC", "Gaming PC India", "Workstation Build", "Rig Builders", "PC Components", "Liquid Cooling"],
  
  // 2. Canonical Link (Prevents duplicate content issues)
  alternates: {
    canonical: "/",
  },

  // 3. Open Graph (Social Previews)
  openGraph: {
    title: "Rig Builders",
    description: "Premium Custom PCs built for performance.",
    type: "website",
    locale: "en_IN",
    url: "https://www.rigbuilders.in",
    siteName: "Rig Builders",
    // Ensure you have an 'opengraph-image.png' in your app/ folder for this to work!
    images: [
      {
        url: "/opengraph-image.png", 
        width: 1200,
        height: 630,
        alt: "Rig Builders Custom PCs",
      },
    ],
  },
  
  // 4. Robots (Ensure Google is allowed to index you)
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
  
  // 5. JSON-LD SCHEMA (The "Brand Card" Fix)
  // This tells Google exactly what your Logo, Name, and Contacts are.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rig Builders",
    "url": "https://www.rigbuilders.in",
    "logo": "https://www.rigbuilders.in/icons/navbar/logo.svg", // Ensure this file exists!
    "sameAs": [
      "https://www.instagram.com/rigbuilders", // Update with your actual socials
      "https://twitter.com/rigbuilders",
      "https://www.youtube.com/@rigbuilders"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-7707801014",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": "en"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "MCB Z2 12267, Sahibzada Jujhar Singh Nagar",
      "addressLocality": "Bathinda",
      "addressRegion": "Punjab",
      "postalCode": "151001",
      "addressCountry": "IN"
    }
  };

  return (
    <html lang="en">
      <body 
        suppressHydrationWarning={true}
        className={`${saira.variable} ${orbitron.variable} font-saira antialiased bg-brand-black text-brand-silver`}
      >
        {/* INJECT SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <ModalProvider>
          <CartProvider>
            <GlobalModal />
            {children}

            <FloatingBuilderBtn />

            <a 
              href="https://wa.me/917707801014?text=Hi%0AI%20need%20consultation%20for%20my%20PC%20Build"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-[999] bg-white text-black p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 group flex items-center justify-center"
              title="Consult an Expert"
            >
              <Headset className="w-6 h-6 md:w-8 md:h-8" />
              <span className="absolute right-full mr-4 bg-[#121212] border border-white/10 text-white text-xs font-bold py-2 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider font-orbitron">
                Consult an Expert
              </span>
            </a>

          </CartProvider>
        </ModalProvider>
        
        <Toaster 
          position="top-center" 
          theme="dark" 
          richColors 
          closeButton
        />
        
        <Analytics />
      </body>
    </html>
  );
}