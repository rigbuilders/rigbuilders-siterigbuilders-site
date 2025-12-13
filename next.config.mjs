/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com', // If using external video thumbnails
      },
      // Add your own bucket later (e.g., supabase.co)
    ],
  },
};

export default nextConfig;