import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

const baseUrl = "https://www.rigbuilders.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. STATIC ROUTES (Hardcoded to ensure they ALWAYS exist)
  const staticRoutes = [
    '',
    '/products',
    '/ascend',
    '/workpro',
    '/creator',
    '/signature',
    '/cart',
    '/configure',
    '/support',
    '/how-we-commission',
  ];

  const staticUrls = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 2. CATEGORIES (Hardcoded to prevent DB failures hiding them)
  const categories = [
    "cpu", "gpu", "ram", "motherboard", "storage", 
    "psu", "cabinet", "cooler", "monitor", 
    "keyboard", "mouse", "combo", "mousepad", "usb"
  ];

  const categoryUrls = categories.map(cat => ({
    url: `${baseUrl}/products/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. DYNAMIC PRODUCTS (Wrapped in try/catch so it doesn't break the whole file)
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at');

    if (products) {
      productUrls = products.map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Sitemap DB Error:", error);
    // Even if DB fails, we still return the static pages!
  }

  return [...staticUrls, ...categoryUrls, ...productUrls];
}