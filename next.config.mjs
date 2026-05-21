/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. YOUR EXISTING IMAGE CONFIG
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows all external images
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',  
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },

  // 2. PHASE 2: REDIRECTS (The "Traffic Rescuers")
  async redirects() {
    return [
      // --- COMMON WORDPRESS REDIRECTS ---
      
      // Case A: Old Category Pages
      {
        source: '/product-category/:slug*', 
        destination: '/products', 
        permanent: true, 
      },

      // Case B: Old "Shop" Landing Page
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },

      // Case C: Old Tag Pages
      {
        source: '/product-tag/:slug*',
        destination: '/products',
        permanent: true,
      },

      // Case D: The "Ghost" WP Admin
      {
        source: '/wp-admin',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // 3. NEW: SECURITY HEADERS (For Advergent Marketers Portfolio Iframing)
  async headers() {
    return [
      {
        // Apply this security rule to every single page on Rig Builders
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Unlocks the vault ONLY for your agency and your local dev environment
            value: "frame-ancestors 'self' http://localhost:3000 https://advergentmarketers.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;