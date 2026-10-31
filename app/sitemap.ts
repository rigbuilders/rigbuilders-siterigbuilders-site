import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { getCategorySlugs } from '@/lib/categories.server';

const baseUrl = "https://www.rigbuilders.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. STATIC ROUTES (Hardcoded to ensure they ALWAYS exist)
  // NOTE: /cart is intentionally excluded — it's a thin, user-specific utility
  // page with no search value and is marked noindex (see app/cart/page metadata).
  // The homepage keeps top priority; the rest are ranked below it.
  const staticRoutes: { path: string; priority: number }[] = [
    { path: '', priority: 1.0 },
    { path: '/products', priority: 0.9 },
    { path: '/ascend', priority: 0.8 },
    { path: '/workpro', priority: 0.8 },
    { path: '/creator', priority: 0.8 },
    { path: '/signature', priority: 0.8 },
    { path: '/configure', priority: 0.7 },
    { path: '/support', priority: 0.6 },
    { path: '/how-we-commission', priority: 0.6 },
  ];

  const staticUrls = staticRoutes.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority,
  }));

  // 2. CATEGORIES — canonical slugs from the DB (with code fallback), so new
  //    categories appear in the sitemap automatically. Exclude 'prebuilt'.
  const categories = (await getCategorySlugs()).filter((s) => s !== "prebuilt");

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
      .select('id, updated_at')
      .eq('listing_status', 'published')
      .eq('listing_created', 'true');

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