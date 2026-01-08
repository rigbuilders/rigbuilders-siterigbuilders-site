import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
// import Navbar from "@/components/Navbar"; 
import { Toaster } from 'sonner';

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

export const metadata: Metadata = {
  title: {
    default: "Rig Builders | Premium Custom PC Commissions",
    template: "%s | Rig Builders",
  },
  description: "India's premium custom PC builder.",
  applicationName: "Rig Builders",
  keywords: ["Custom PC", "Gaming PC India", "Workstation Build", "Rig Builders"],
  openGraph: {
    title: "Rig Builders",
    description: "Premium Custom PCs built for performance.",
    type: "website",
    locale: "en_IN",
    url: "https://rigbuilders.in",
    siteName: "Rig Builders",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        suppressHydrationWarning={true}
        className={`${saira.variable} ${orbitron.variable} font-saira antialiased bg-brand-black text-brand-silver`}
      >
        <ModalProvider>
          <CartProvider>
            <GlobalModal />
            
            {/* <Navbar /> */}
            
            {children}

            {/* --- 1. FLOATING BUILDER BUTTON (New Horizontal Style) --- */}
            <FloatingBuilderBtn />

            {/* --- 2. FLOATING SUPPORT BUTTON (Updated) --- */}
            <a 
              href="https://wa.me/917707801014?text=Hi%0AI%20need%20consultation%20for%20my%20PC%20Build"
              target="_blank"
              rel="noopener noreferrer"
              // Responsive classes: p-3 for mobile, md:p-4 for desktop
              className="fixed bottom-6 right-6 z-[999] bg-white text-black p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 group flex items-center justify-center"
              title="Consult an Expert"
            >
              {/* Responsive Icon Size: w-6 (24px) for mobile, w-8 (32px) for desktop */}
              <Headset className="w-6 h-6 md:w-8 md:h-8" />
              
              {/* Tooltip Text on Hover */}
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
      </body>
    </html>
  );
}