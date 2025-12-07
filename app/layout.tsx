import type { Metadata } from "next";
import { Saira, Orbitron } from "next/font/google"; 
import "./globals.css";

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
      {/* FIX: suppressHydrationWarning={true} tells Next.js to ignore 
        attributes added by browser extensions (like ColorZilla) 
        so the app doesn't crash.
      */}
      <body 
        suppressHydrationWarning={true}
        className={`${saira.variable} ${orbitron.variable} antialiased bg-[#121212] text-[#D0D0D0]`}
      >
        {children}
      </body>
    </html>
  );
}