import Link from "next/link";
import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import SearchResultCard from "@/components/SearchResultCard";
import { supabase } from "@/lib/supabaseClient";
import { onlyVisible } from "@/lib/productVisibility";

/**
 * Results for /products?search=<query>.
 *
 * That URL is what GlobalSearch.tsx navigates to on Enter, and what the
 * site's JSON-LD SearchAction advertises to Google. Searched fields match
 * GlobalSearch's dropdown (`name` and `breadcrumb_name`, never the internal
 * `nickname`) so pressing Enter shows the same products the dropdown previewed.
 *
 * Rendered with the full storefront chrome (NavbarNeo + Footer) and the same
 * rb-surface-card product card used on the category pages.
 */

interface SearchHit {
  id: string;
  name: string;
  breadcrumb_name: string | null;
  price: number | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  in_stock: boolean | null;
}

export default async function SearchResults({ query }: { query: string }) {
  // PostgREST treats these as delimiters inside an `or` filter, so strip them.
  const clean = query.replace(/[,()%]/g, " ").trim();

  const { data, error } = await onlyVisible(
    supabase
      .from("products")
      .select("id, name, breadcrumb_name, price, brand, category, image_url, in_stock")
      .or(`name.ilike.%${clean}%,breadcrumb_name.ilike.%${clean}%`)
      .order("price", { ascending: true })
  ).limit(48);

  if (error) console.error(`[products:search] "${clean}" failed: ${error.message}`);

  const results = (data ?? []) as SearchHit[];

  return (
    <div className="min-h-screen bg-rb-black text-rb-white flex flex-col">
      <NavbarNeo />

      <section className="rb-shell py-8 lg:py-12 flex-grow w-full">
        <p className="text-[11px] font-bold text-rb-silver tracking-[0.3em] uppercase mb-2">Search results</p>
        <h1 className="font-saira text-3xl md:text-4xl uppercase text-rb-white mb-2">
          &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-rb-silver mb-10">
          {results.length === 0
            ? "No matching products."
            : `${results.length} ${results.length === 1 ? "product" : "products"} found`}
        </p>

        {results.length === 0 ? (
          <div className="rb-surface-card p-10 text-center max-w-xl">
            <p className="text-rb-silver mb-6 text-sm">
              We may still be able to source it — browse the categories below, or ask us directly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/products" className="rb-ghost px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest">
                Browse all categories
              </Link>
              <Link href="/support" className="rb-cta px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest">
                Ask our team
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {results.map((product) => (
              <SearchResultCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
