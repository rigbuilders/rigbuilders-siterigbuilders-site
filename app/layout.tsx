import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
import Navbar from "@/components/Navbar"; // <--- 1. IMPORT NAVBAR
import { Toaster } from 'sonner';
import { FaWhatsapp } from "react-icons/fa";

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
             {/* <--- 2. ADD NAVBAR HERE (Outside the children) */}
            {children}
            {/* --- FLOATING EXPERT CONSULTATION BUTTON --- */}
            <a 
              href="https://wa.me/917707801014?text=Hi%20Rig%20Builders,%20I%20need%20expert%20consultation%20for%20a%20PC%20build."
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] transition-all duration-300 group flex items-center justify-center"
              title="Expert Consultation"
            >
              <FaWhatsapp size={32} />
              
              {/* Optional: Tooltip Text on Hover */}
              <span className="absolute right-full mr-4 bg-[#121212] border border-white/10 text-white text-xs font-bold py-2 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-wider font-orbitron">
                Talk to an Expert
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