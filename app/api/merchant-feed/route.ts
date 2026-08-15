import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  // 1. Fetch all active, PUBLISHED products from your database — drafts from
  //    the auto-listing pipeline must never reach the Google Shopping feed.
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('listing_status', 'published');

  if (error || !products) {
    return new NextResponse('Error fetching products from database', { status: 500 });
  }

  const DOMAIN = 'https://www.rigbuilders.in';

  // 2. Loop through your products and map them to Google's XML tags
  const itemsXml = products.map((product) => {
    // Escape special characters to prevent XML parsing errors
    // Escape special characters to prevent XML parsing errors
    const title = escapeXml(product.name);
    const description = escapeXml(product.description || product.name);
    
    // NOTE: Adjusted URL structure to match the actual Next.js frontend path
    const link = `${DOMAIN}/product/${product.id}`; 
    
    const availability = product.in_stock ? 'in_stock' : 'out_of_stock';
    const brand = escapeXml(product.brand || 'Rig Builders');
    const productType = escapeXml(product.category || 'Computer Components');

    // --- PRICE / MRP LOGIC ---
    // Google shows a strikethrough "was" price when g:price (the list price) is
    // higher than g:sale_price (what the customer actually pays). We had an MRP
    // column sitting unused — previously only the selling price went out, so
    // Google/customers never saw the discount at all.
    const hasDiscount = typeof product.mrp === 'number' && product.mrp > product.price;
    const priceXml = hasDiscount
      ? `<g:price>${product.mrp}.00 INR</g:price>\n        <g:sale_price>${product.price}.00 INR</g:sale_price>`
      : `<g:price>${product.price}.00 INR</g:price>`;

    // --- SHIPPING LOGIC ---
    // If it's a desktop, tag it for heavy freight so GMC knows to charge delivery
    const isDesktop = product.category?.toLowerCase() === 'desktop' || product.category?.toLowerCase() === 'pre-built';
    const shippingLabel = isDesktop ? 'Heavy_Freight' : 'Standard_Component';

    // --- VARIANT LOGIC ---
    // Group variants together if they share a variant_group_id
    const itemGroupIdXml = product.variant_group_id 
      ? `<g:item_group_id>${escapeXml(product.variant_group_id)}</g:item_group_id>`
      : '';

    // Loop through your JSONB specs to tell Google what makes this variant unique.
    // NOTE: specs can hold strings (socket, chipset), numbers (wattage, length_mm,
    // max_gpu_length_mm), and arrays (supported_motherboards, supported_radiators) —
    // all of these need to reach the feed, not just strings, or Google (and now the
    // chatbot's RAG lookup sharing this same column) is working off incomplete data.
    const SPEC_HIDE = new Set(['group', 'variant_label']);
    const specKeysSeen = new Set<string>();
    let specsXml = '';
    if (product.specs && typeof product.specs === 'object') {
      Object.entries(product.specs).forEach(([key, value]) => {
        if (SPEC_HIDE.has(key)) return;
        if (value === null || value === undefined || value === '') return;

        const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
        if (!stringValue) return;

        specKeysSeen.add(key.toLowerCase());

        // If the spec is 'color', use Google's native color tag
        if (key.toLowerCase() === 'color') {
          specsXml += `<g:color>${escapeXml(stringValue)}</g:color>\n`;
        } else {
          // Otherwise, output it as a custom attribute (e.g., GPU, RAM, Storage)
          specsXml += `
            <g:custom_attribute>
              <g:name>${escapeXml(key)}</g:name>
              <g:value>${escapeXml(stringValue)}</g:value>
            </g:custom_attribute>
          `;
        }
      });
    }

    // --- REMAINING ROW-LEVEL FIELDS ---
    // Everything else on the product row that customers/Google can use, aside
    // from the internal short-name fields (breadcrumb_name, configurator_name,
    // nickname) which are matching keys for the admin UI/chatbot, not public data.
    let rowFieldsXml = '';

    if (product.warranty) {
      rowFieldsXml += `<g:custom_attribute><g:name>warranty</g:name><g:value>${escapeXml(String(product.warranty))}</g:value></g:custom_attribute>`;
    }

    if (product.series) {
      rowFieldsXml += `<g:custom_attribute><g:name>series</g:name><g:value>${escapeXml(String(product.series))}</g:value></g:custom_attribute>`;
    }

    if (product.tier) {
      rowFieldsXml += `<g:custom_attribute><g:name>tier</g:name><g:value>${escapeXml(String(product.tier))}</g:value></g:custom_attribute>`;
    }

    if (product.cod_policy) {
      const codLabel =
        product.cod_policy === 'no_cod' ? 'Cash on Delivery not available' :
        product.cod_policy === 'partial_cod' ? 'Partial Cash on Delivery' :
        'Full Cash on Delivery available';
      rowFieldsXml += `<g:custom_attribute><g:name>cod_policy</g:name><g:value>${escapeXml(codLabel)}</g:value></g:custom_attribute>`;
    }

    // length_mm / max_gpu_length_mm are top-level columns on every product
    // row regardless of category (the admin form only ever *sets* them for
    // gpu/cabinet respectively, but the column itself isn't null-constrained
    // per-category) — gate by category here too, or a stray/default value on
    // a CPU or OS row shows up in the feed as a nonsensical "gpu length"
    // attribute. Also still skip it if specs already carried the same key.
    if (
      product.category === 'gpu' &&
      typeof product.length_mm === 'number' &&
      !specKeysSeen.has('length_mm')
    ) {
      rowFieldsXml += `<g:custom_attribute><g:name>length_mm</g:name><g:value>${product.length_mm}</g:value></g:custom_attribute>`;
    }
    if (
      product.category === 'cabinet' &&
      typeof product.max_gpu_length_mm === 'number' &&
      !specKeysSeen.has('max_gpu_length_mm')
    ) {
      rowFieldsXml += `<g:custom_attribute><g:name>max_gpu_length_mm</g:name><g:value>${product.max_gpu_length_mm}</g:value></g:custom_attribute>`;
    }

    // Features map to Google's native repeatable product_highlight tag (max 10)
    // rather than a custom_attribute — it's the semantically correct field.
    let highlightsXml = '';
    if (Array.isArray(product.features)) {
      product.features.slice(0, 10).forEach((feature: string) => {
        if (feature) highlightsXml += `<g:product_highlight>${escapeXml(feature)}</g:product_highlight>\n`;
      });
    }

    // --- SMART IMAGE LOGIC (Absolute URLs + White BG Fallback) ---
    // 1. Prefer the Google-specific white background image, otherwise fall back to standard image
    const rawPrimaryImage = product.feed_image_url || product.image_url;
    
    // 2. Ensure the URL is absolute so Google bots can fetch it
    const absoluteImageLink = rawPrimaryImage?.startsWith('http') 
        ? rawPrimaryImage 
        : `${DOMAIN}${rawPrimaryImage}`;
        
    const imageLink = absoluteImageLink ? escapeXml(absoluteImageLink) : '';

    let additionalImagesXml = '';
    if (product.gallery_urls && Array.isArray(product.gallery_urls)) {
      // Google accepts a max of 10 additional images
      product.gallery_urls.slice(0, 10).forEach((url: string) => {
        // Make gallery images absolute as well
        const absUrl = url.startsWith('http') ? url : `${DOMAIN}${url}`;
        additionalImagesXml += `<g:additional_image_link>${escapeXml(absUrl)}</g:additional_image_link>\n`;
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
        ${priceXml}
        <g:brand>${brand}</g:brand>
        <g:product_type>${productType}</g:product_type>
        <g:shipping_label>${shippingLabel}</g:shipping_label>
        ${itemGroupIdXml}
        ${highlightsXml}
        ${specsXml}
        ${rowFieldsXml}
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