import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
// IMPORT THE CART PROVIDER
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   
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

// app/layout.tsx

export const metadata: Metadata = {
  // 1. THE SITE NAME (Replaces "rigbuilders.in")
  title: {
    default: "Rig Builders | Premium Custom PC Commissions", // Shows on Home Page
    template: "%s | Rig Builders", // Shows on other pages (e.g., "RTX 4090 Build | Rig Builders")
  },
  
  // 2. THE DESCRIPTION (Replaces the "stress-tested" text)
  description: "India's premium custom PC builder. We craft high-performance workstations and gaming rigs with studio-quality aesthetics and thermal validation.",
  
  // 3. EXTRA HINTS FOR GOOGLE
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
        {/* WRAP THE APP IN CART PROVIDER */}
        <ModalProvider>
          <CartProvider>
            <GlobalModal />
            {children}
          </CartProvider>
        </ModalProvider>
        
        {/* UPDATED TOASTER CONFIGURATION */}
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