/**
 * Storefront product visibility.
 *
 * A product is visible to customers IF AND ONLY IF:
 *     listing_created = 'true'   (every required field for its category is filled)
 *   AND
 *     listing_status  = 'published'  (a human reviewed it and clicked Publish)
 *
 * Completeness alone does not publish; publishing alone does not reveal an
 * incomplete row. Both are required. `listing_created` is DERIVED state —
 * never write it by hand to "unhide" a product; fill the missing fields
 * instead (see lib/listingCompleteness.ts + the admin save handler).
 *
 * This helper is the ONE place that encodes the rule. Wrap every
 * customer-facing read of `products` with it:
 *
 *     const { data } = await onlyVisible(
 *       supabase.from('products').select('*').eq('category', cat)
 *     ).order('created_at');
 *
 * It applies both filters and returns the SAME builder, so .order / .limit /
 * .single / .then still chain off it.
 *
 * Do NOT apply it to: the configurator inventory (app/configure/**), the
 * curated build-recipe pages (signature, ascend/creator/workpro [tier]), or
 * admin tooling (app/admin/**) — those must see hidden rows.
 */
export function onlyVisible<T>(query: T): T {
  // Supabase query builders are chainable and return themselves; the generic
  // keeps the caller's exact type so downstream .order/.limit/.single/.then
  // keep working.
  return (query as any)
    .eq("listing_created", "true")
    .eq("listing_status", "published") as T;
}
