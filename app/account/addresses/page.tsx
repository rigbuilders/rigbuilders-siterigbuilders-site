"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Address Book now lives inside the dashboard as a tab. This route just
// redirects there (opening the Address Book tab) so old links keep working.
export default function AddressesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard?tab=addresses");
  }, [router]);

  return (
    <div className="min-h-screen bg-rb-black flex items-center justify-center text-rb-silver font-saira animate-pulse tracking-widest uppercase text-sm">
      Redirecting…
    </div>
  );
}
