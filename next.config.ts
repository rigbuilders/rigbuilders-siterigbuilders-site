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
  // Merged in from the now-removed next.config.mjs: lets the agency
  // (advergentmarketers.com) iframe the site for portfolio/demo purposes,
  // plus localhost for them to test that locally. Was previously its own
  // separate, ENFORCING "Content-Security-Policy" header in next.config.mjs
  // — kept here as part of the single report-only CSP instead so there's
  // only one source of truth for this header. If Next.js was in fact
  // loading next.config.mjs in production (the two config files silently
  // fighting for precedence is the likely cause of prod/localhost drift —
  // see the comment below), that means frame-ancestors was actually being
  // ENFORCED in prod and everything else in this CSP was NOT — flip this
  // whole header back to enforcing (see note above) once you've confirmed
  // in the browser console that nothing else here breaks anything.
  "frame-ancestors 'self' http://localhost:3000 https://advergentmarketers.com",
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

/**
 * IMPORTANT: this is the ONLY next.config file in the repo now. There used
 * to also be a next.config.mjs sitting alongside this one — Next.js only
 * ever loads ONE config file, and having two different formats present at
 * once (.ts and .mjs) is invalid: depending on the Next.js version, it
 * either picks one arbitrarily/silently (meaning whichever one "loses" has
 * every one of its settings — images, redirects, headers — quietly ignored)
 * or fails the build outright. A failed Vercel build means production just
 * keeps serving the last deployment that DID build — which is exactly the
 * "localhost shows the new chat widget, the live site doesn't, even though
 * the branch is up to date" symptom. All of next.config.mjs's settings
 * (images.remotePatterns, the WordPress redirects, and the agency-iframe
 * CSP allowance) have been merged in below. Do not add a next.config.mjs
 * (or .js/.cjs) back — if you ever need a change, edit this file only.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Allows all external images
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
    ],
    // Next.js 16 requires every `quality` value passed to next/image to be
    // explicitly allowlisted. 75 is next/image's own default (used by every
    // <Image> in the app that doesn't set quality itself); 50 is the one
    // explicit override, in components/HowWeCommission.tsx.
    qualities: [50, 75],
  },

  // Old WordPress-era URLs redirected to their modern equivalents.
  async redirects() {
    return [
      { source: "/product-category/:slug*", destination: "/products", permanent: true },
      { source: "/shop", destination: "/products", permanent: true },
      { source: "/product-tag/:slug*", destination: "/products", permanent: true },
      { source: "/wp-admin", destination: "/", permanent: false },
    ];
  },

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
