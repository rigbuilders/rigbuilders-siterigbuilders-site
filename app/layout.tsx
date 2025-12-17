import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
// IMPORT THE CART PROVIDER
import { CartProvider } from "./context/CartContext"; 
import { ModalProvider } from "./context/ModalContext"; 
import GlobalModal from "@/components/ui/GlobalModal";   

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
  title: "Rig Builders | Custom PC Commissions",
  description: "India's premium custom PC building service. Professional workstations, gaming rigs, and signature series.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest', // Links the manifest file for PWA/Android support
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
      </body>
    </html>
  );
}