import type { Metadata } from "next";

// The cart is a thin, user-specific utility page with no search value. We keep
// it out of Google's index (and out of the sitemap — see app/sitemap.ts). This
// server-component layout carries the metadata because app/cart/page.tsx is a
// client component ("use client") and so can't export `metadata` itself.
export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
