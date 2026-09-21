import type { Metadata, Viewport } from "next";
import PushNotificationSetup from "@/components/admin/PushNotificationSetup";

/**
 * Scopes PWA installability to /admin only, not the whole site. Next.js's
 * own `app/manifest.ts` file convention is app-root-only and would make the
 * ENTIRE site installable — this layout instead sets a per-segment
 * `metadata.manifest`, which Next.js supports on any layout/page and merges
 * into just the pages under this segment. public/admin-manifest.webmanifest
 * itself also sets "scope": "/admin/" as a second line of defense, so even a
 * browser that somehow picked up this manifest elsewhere wouldn't treat
 * pages outside /admin as part of the installed app.
 */
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#121212",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Registers the service worker + offers to enable push notifications
          — see the component's own comment for why it lives here rather
          than inside the chatbot dashboard specifically: an admin might
          land on /admin/orders or /admin/products first, and shouldn't have
          to find their way to the chatbot page just to turn this on. */}
      <PushNotificationSetup />
    </>
  );
}
