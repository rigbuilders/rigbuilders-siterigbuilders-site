import type { NextConfig } from "next";

// Baseline security response headers applied to every route.
// These are safe defaults that do not affect Razorpay/Supabase functionality.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disallow the site being framed by other origins (clickjacking protection).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers from MIME-sniffing responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful browser features the site doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

// ---------------------------------------------------------------------------
// OPTIONAL: Content-Security-Policy (defense-in-depth against XSS).
//
// A CSP is powerful but easy to get wrong — a missing source silently breaks a
// feature. This app loads several third parties (Razorpay, Supabase, Vercel
// Analytics, a Pixabay hero video, the India Post pincode API). Enable this only
// after testing every page, ideally first via "Content-Security-Policy-Report-Only".
//
// To turn it on, add this object to the `headers` array above:
//
// {
//   key: "Content-Security-Policy",
//   value: [
//     "default-src 'self'",
//     // 'unsafe-inline' is needed for the JSON-LD script + styled-jsx; tighten with nonces later.
//     "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://va.vercel-scripts.com",
//     "style-src 'self' 'unsafe-inline'",
//     "img-src 'self' data: blob: https:",
//     "font-src 'self' data:",
//     "connect-src 'self' https://*.supabase.co https://*.razorpay.com https://api.postalpincode.in https://va.vercel-scripts.com",
//     "frame-src https://*.razorpay.com https://api.razorpay.com",
//     "media-src 'self' https://cdn.pixabay.com",
//     "object-src 'none'",
//     "base-uri 'self'",
//     "form-action 'self'",
//     "frame-ancestors 'self'",
//   ].join("; "),
// }
// ---------------------------------------------------------------------------
