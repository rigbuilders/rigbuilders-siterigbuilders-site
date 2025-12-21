/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 🟢 ALLOWS ALL EXTERNAL IMAGES
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
};

export default nextConfig;