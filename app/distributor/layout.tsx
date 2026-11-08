import type { Metadata } from "next";

// Partner-only portal — keep it out of search engines. The page itself is a
// client component ("use client") and can't export metadata, so it lives here.
export const metadata: Metadata = {
  title: "Distributor Portal",
  robots: { index: false, follow: false },
};

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
