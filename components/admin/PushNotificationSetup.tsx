"use client";

import { useEffect, useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SW_URL = "/sw.js";
const SW_SCOPE = "/admin/";

type Status =
  | "checking"
  | "unsupported"
  | "ios-not-installed"
  | "prompt"
  | "denied"
  | "subscribing"
  | "subscribed";

// Web Push's applicationServerKey needs raw bytes, not the base64url string
// VAPID keys are normally shared as — standard conversion, same one used in
// every Web Push tutorial/library.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function authedFetch(path: string, body: unknown, method: "POST" | "DELETE") {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

/**
 * Small floating control that registers the /admin PWA's service worker and
 * lets an admin turn on push notifications for new customer messages (see
 * lib/chatbot/push-notify.ts for the send side, public/sw.js for how the
 * notification itself gets shown). Lives in app/admin/layout.tsx so it's
 * available no matter which /admin page is open first.
 *
 * iOS Safari specifically only supports Web Push inside an installed PWA
 * (Add to Home Screen), never in a regular browser tab — detected via
 * `display-mode: standalone` and surfaced as a one-time instruction instead
 * of just silently failing to subscribe.
 */
export default function PushNotificationSetup() {
  const [status, setStatus] = useState<Status>("checking");
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (typeof window === "undefined") return;

      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

      if (!supported) {
        // iOS Safari in a plain tab: PushManager genuinely doesn't exist
        // there, so this branch also catches "not installed yet" on iOS.
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone =
          window.matchMedia?.("(display-mode: standalone)").matches ||
          (navigator as unknown as { standalone?: boolean }).standalone === true;
        setStatus(isIos && !isStandalone ? "ios-not-installed" : "unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
        const existing = await registration.pushManager.getSubscription();
        setStatus(existing ? "subscribed" : "prompt");
      } catch (err) {
        console.error("[push-setup] service worker registration failed:", err);
        setStatus("unsupported");
      }
    }
    check();
  }, []);

  async function enable() {
    if (!VAPID_PUBLIC_KEY) {
      setError("Push isn't configured yet (missing NEXT_PUBLIC_VAPID_PUBLIC_KEY).");
      return;
    }
    setStatus("subscribing");
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "prompt");
        return;
      }

      const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
      // Same lib.dom generic-strictness gap as the PDF route fix elsewhere in
      // this codebase: a freshly-constructed Uint8Array's backing buffer
      // types as ArrayBufferLike (which includes SharedArrayBuffer) rather
      // than the narrower ArrayBuffer that PushSubscriptionOptionsInit's
      // applicationServerKey (via BufferSource) requires under this
      // Next.js/TS version. It's a real Uint8Array over a real ArrayBuffer
      // at runtime — this is a type-checking gap, not a real mismatch.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      await authedFetch("/api/admin/push/subscribe", subscription.toJSON(), "POST");
      setStatus("subscribed");
    } catch (err) {
      console.error("[push-setup] subscribe failed:", err);
      setError((err as Error).message);
      setStatus("prompt");
    }
  }

  async function disable() {
    try {
      const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await authedFetch("/api/admin/push/subscribe", { endpoint: subscription.endpoint }, "DELETE");
        await subscription.unsubscribe();
      }
      setStatus("prompt");
    } catch (err) {
      console.error("[push-setup] unsubscribe failed:", err);
    }
  }

  if (status === "checking" || status === "unsupported" || dismissed) return null;

  if (status === "subscribed") {
    return (
      <button
        onClick={disable}
        title="Notifications are on for this device — click to turn off"
        className="fixed bottom-6 left-6 z-[999] flex items-center gap-2 py-2 px-4 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-full shadow-lg text-xs font-bold uppercase tracking-wide transition-colors"
      >
        <FaBell className="w-3.5 h-3.5" /> Notifications On
      </button>
    );
  }

  if (status === "ios-not-installed") {
    return (
      <div className="fixed bottom-6 left-6 z-[999] max-w-[260px] bg-[#1A1A1A] border border-white/10 rounded-xl p-4 shadow-lg text-xs text-brand-silver">
        <button
          onClick={() => setDismissed(true)}
          className="float-right text-white/40 hover:text-white -mt-1 -mr-1"
          aria-label="Dismiss"
        >
          ×
        </button>
        <p className="font-bold text-white mb-1">Get message alerts on your phone</p>
        <p>
          On iPhone, tap Share → <span className="text-white">Add to Home Screen</span> first, then open Rig
          Builders Admin from there to turn on notifications.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="fixed bottom-6 left-6 z-[999] max-w-[260px] bg-[#1A1A1A] border border-white/10 rounded-xl p-4 shadow-lg text-xs text-brand-silver">
        <button
          onClick={() => setDismissed(true)}
          className="float-right text-white/40 hover:text-white -mt-1 -mr-1"
          aria-label="Dismiss"
        >
          ×
        </button>
        <p className="font-bold text-white mb-1 flex items-center gap-1.5">
          <FaBellSlash className="w-3 h-3" /> Notifications blocked
        </p>
        <p>Notifications were blocked for this site. Re-enable them from your browser&apos;s site settings.</p>
      </div>
    );
  }

  // status === "prompt" or "subscribing"
  return (
    <div className="fixed bottom-6 left-6 z-[999] flex items-center gap-2">
      <button
        onClick={enable}
        disabled={status === "subscribing"}
        className="flex items-center gap-2 py-2 px-4 bg-brand-purple hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 text-white rounded-full shadow-lg text-xs font-bold uppercase tracking-wide transition-all"
      >
        <FaBell className="w-3.5 h-3.5" />
        {status === "subscribing" ? "Enabling..." : "Enable Notifications"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white text-sm"
      >
        ×
      </button>
      {error && <p className="text-[10px] text-red-400 max-w-[180px]">{error}</p>}
    </div>
  );
}
