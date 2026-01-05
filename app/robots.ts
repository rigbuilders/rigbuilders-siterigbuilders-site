import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/private'], // Hide admin routes from Google
    },
    sitemap: 'https://www.rigbuilders.in/sitemap.xml', // Update with your domain
  };
}