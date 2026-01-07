import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
import Navbar from "@/components/Navbar"; // <--- 1. IMPORT NAVBAR
import { Toaster } from 'sonner';

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