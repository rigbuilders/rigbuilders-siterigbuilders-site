// Service worker for the /admin chatbot PWA — push notifications only, no
// offline caching/asset precaching (the admin dashboard needs to always show
// live data, so there's nothing to gain from an offline shell here). Served
// from the public root as /sw.js but registered with an explicit
// `{ scope: "/admin/" }` (see components/admin/PushNotificationSetup.tsx),
// so it never controls or intercepts requests outside /admin — the rest of
// the site (customer-facing pages, the website chat widget) is untouched.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON payload (shouldn't happen — push-notify.ts always sends
    // JSON.stringify'd data) — fall back to an empty notification rather
    // than letting the whole handler throw.
  }

  const title = data.title || "Rig Builders";
  const options = {
    body: data.body || "",
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    data: { url: data.url || "/admin/chatbot" },
    // Same tag = same conversation collapses into one notification instead
    // of stacking a fresh one per message during a rapid back-and-forth.
    tag: data.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an already-open admin tab on that
// conversation's page if one exists, otherwise opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/chatbot";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })
  );
});
