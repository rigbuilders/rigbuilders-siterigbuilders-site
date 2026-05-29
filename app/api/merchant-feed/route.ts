import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  // 1. Fetch all active products from your database
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error || !products) {
    return new NextResponse('Error fetching products from database', { status: 500 });
  }

  const DOMAIN = 'https://www.rigbuilders.in';

  // 2. Loop through your products and map them to Google's XML tags
  const itemsXml = products.map((product) => {
    // Escape special characters to prevent XML parsing errors
    const title = escapeXml(product.name);
    const description = escapeXml(product.description || product.name);
    
    // NOTE: Adjust this URL structure if your frontend product pages use a different path
    const link = `${DOMAIN}/products/${product.category?.toLowerCase()}/${product.id}`; 
    
    const imageLink = product.image_url ? escapeXml(product.image_url) : '';
    const price = `${product.price}.00 INR`;
    const availability = product.in_stock ? 'in_stock' : 'out_of_stock';
    const brand = escapeXml(product.brand || 'Rig Builders');
    const productType = escapeXml(product.category || 'Computer Components');
    
    // --- SHIPPING LOGIC ---
    // If it's a desktop, tag it for heavy freight so GMC knows to charge delivery
    const isDesktop = product.category?.toLowerCase() === 'desktop' || product.category?.toLowerCase() === 'pre-built';
    const shippingLabel = isDesktop ? 'Heavy_Freight' : 'Standard_Component';

    // --- VARIANT LOGIC ---
    // Group variants together if they share a variant_group_id
    const itemGroupIdXml = product.variant_group_id 
      ? `<g:item_group_id>${escapeXml(product.variant_group_id)}</g:item_group_id>`
      : '';

    // Loop through your JSONB specs to tell Google what makes this variant unique
    let specsXml = '';
    if (product.specs && typeof product.specs === 'object') {
      Object.entries(product.specs).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          // If the spec is 'color', use Google's native color tag
          if (key.toLowerCase() === 'color') {
            specsXml += `<g:color>${escapeXml(value)}</g:color>\n`;
          } else {
            // Otherwise, output it as a custom attribute (e.g., GPU, RAM, Storage)
            specsXml += `
              <g:custom_attribute>
                <g:name>${escapeXml(key)}</g:name>
                <g:value>${escapeXml(value)}</g:value>
              </g:custom_attribute>
            `;
          }
        }
      });
    }

    // --- MULTIPLE IMAGES ---
    let additionalImagesXml = '';
    if (product.gallery_urls && Array.isArray(product.gallery_urls)) {
      // Google accepts a max of 10 additional images
      product.gallery_urls.slice(0, 10).forEach((url: string) => {
        additionalImagesXml += `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>\n`;
      });
    }

    // Build the individual <item> block
    return `
      <item>
        <g:id>${product.id}</g:id>
        <g:title>${title}</g:title>
        <g:description>${description}</g:description>
        <g:link>${link}</g:link>
        <g:image_link>${imageLink}</g:image_link>
        ${additionalImagesXml}
        <g:condition>new</g:condition>
        <g:availability>${availability}</g:availability>
        <g:price>${price}</g:price>
        <g:brand>${brand}</g:brand>
        <g:product_type>${productType}</g:product_type>
        <g:shipping_label>${shippingLabel}</g:shipping_label>
        ${itemGroupIdXml}
        ${specsXml}
      </item>
    `;
  }).join('');

  // 3. Wrap everything in the official Google RSS 2.0 structure
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
      <channel>
        <title>Rig Builders Store</title>
        <link>${DOMAIN}</link>
        <description>Premium PC Components and Custom Desktops in India</description>
        ${itemsXml}
      </channel>
    </rss>
  `;

  // 4. Return the response to Google with the correct XML headers
  return new NextResponse(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      // Instructs Next.js not to aggressively cache this, ensuring Google always gets fresh stock levels
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

// Utility function to safely escape characters like <, >, and & for XML
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}