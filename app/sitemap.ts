import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path matches your project

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Define your Base URL (Change this to your actual domain)
  const baseUrl = 'https://www.rigbuilders.in'; 

  // 2. Fetch all dynamic product IDs from Supabase
  // We only need the ID and updated_at date to keep it fast
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at');

  // 3. Generate URLs for each product
  const productUrls = (products || []).map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8, // Products are high priority
  }));

  // 4. Define your static pages (Home, About, etc.)
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // Homepage is highest priority
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9, // Main catalog page
    },
    // Add other static pages here (e.g., /contact, /about)
  ];

  // 5. Combine and return
  return [...staticRoutes, ...productUrls];
}