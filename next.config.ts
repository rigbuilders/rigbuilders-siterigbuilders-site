import type { NextConfig } from "next";

// Content-Security-Policy — the main defense-in-depth control against XSS.
//
// This is shipped as "Report-Only" first: the browser does NOT block anything,
// it only logs violations to the devtools Console. Click through the whole site
// (checkout with Razorpay, admin realtime, the hero video, reviews) and watch for
// "Content Security Policy" violation messages. If a legit resource is flagged,
// add its origin to the right directive below. Once the console is clean, switch
// the header key from "Content-Security-Policy-Report-Only" to
// "Content-Security-Policy" to start enforcing.
const cspValue = [
  "default-src 'self'",
  // 'unsafe-inline' covers the JSON-LD script + Next's styled-jsx. Razorpay + Vercel Analytics scripts.
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Supabase REST + realtime (wss), Razorpay, India Post pincode API, Vercel Analytics.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://api.postalpincode.in https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src https://*.razorpay.com https://api.razorpay.com",
  "media-src 'self' https://cdn.pixabay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

// Baseline security response headers applied to every route.
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
  // CSP in report-only mode — see note above. Rename to "Content-Security-Policy" to enforce.
  { key: "Content-Security-Policy-Report-Only", value: cspValue },
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
