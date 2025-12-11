import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";
// IMPORT THE CART PROVIDER
import { CartProvider } from "./context/CartContext"; 

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
  title: "Rig Builders | Commissioned Custom PCs",
  description: "India's premium custom PC brand.",
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
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}