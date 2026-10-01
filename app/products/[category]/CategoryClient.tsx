"use client";

import NavbarNeo from "@/components/home/NavbarNeo";
import Footer from "@/components/Footer";
import { useMemo, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { StaggerGrid, StaggerItem } from "@/components/ui/MotionWrappers";
import { FaShoppingCart, FaArrowRight } from "react-icons/fa";
import { toast } from "sonner";
import CategoryLanding from "@/components/CategoryLanding";
import FilterSidebar, { FilterGroupDef } from "@/components/ui/FilterSidebar";
import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import { getCategory } from "@/app/data/categories";

const FILTER_KEYS = ["brand", "budget", "socket", "memory", "capacity", "form_factor", "radiator"] as const;

export default function CategoryClient({
  category,
  initialProducts,
  categoryData,
}: {
  category: string;
  initialProducts: any[];
  categoryData?: any;
}) {
  // Prefer the DB-resolved category passed from the server (so the funnel flag
  // set in the admin Category Builder actually controls behaviour); fall back to
  // the code config for safety.
  const cat = categoryData ?? getCategory(category);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addToCart } = useCart();

  const dbCategory = cat?.db ?? category.toLowerCase();
  const products = initialProducts;

  // --- FUNNEL PARAMS ---
  const pMaker = searchParams.get("maker");
  const pSeries = searchParams.get("series");
  const pChipset = searchParams.get("chipset");
  const pBrand = searchParams.get("brand");
  const searchQuery = searchParams.get("search") || "";

  // --- FILTERS ---
  // Client state gives instant filtering; we mirror it into the URL with
  // history.replaceState so the view stays shareable / bookmarkable / refresh-safe
  // WITHOUT triggering a server navigation (which would refetch all products on
  // every toggle). Initial values are seeded from the URL for deep links.
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(() => {
    const obj: Record<string, string[]> = {};
    for (const k of FILTER_KEYS) obj[k] = searchParams.get(k)?.split(",").filter(Boolean) || [];
    return obj;
  });

  const syncUrl = (filters: Record<string, string[]>) => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    for (const k of FILTER_KEYS) {
      if (filters[k]?.length) p.set(k, filters[k].join(","));
      else p.delete(k);
    }
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  // Reusable FilterSidebar hands us the FULL next value for a key.
  const setFilter = (key: string, next: any) => {
    const updated = { ...activeFilters, [key]: next };
    setActiveFilters(updated);
    syncUrl(updated);
  };

  const clearAllFilters = () => {
    const cleared: Record<string, string[]> = {};
    for (const k of FILTER_KEYS) cleared[k] = [];
    setActiveFilters(cleared);
    syncUrl(cleared);
  };

  const hasActiveFilters =
    FILTER_KEYS.some((k) => activeFilters[k].length > 0) || searchQuery !== "";

  // --- STAGE GATING (simple + derived purely from URL / config) ---
  // Landing: brand/maker picker for gpu/cpu/motherboard, before any selection.
  // (The chipset hub has been removed — a maker selection now goes straight to
  // the products grid, filtered by that maker.)
  const showLanding = cat?.funnel === "landing" && !pMaker && !pChipset && !pBrand && !hasActiveFilters;

  const eq = (a?: string | null, b?: string | null) =>
    (a ?? "").toString().trim().toLowerCase() === (b ?? "").toString().trim().toLowerCase();

  // --- FILTERING (client-side over server-provided products) ---
  const filteredProducts = useMemo(() => {
    const { brand, budget, socket, memory, capacity, form_factor, radiator } = activeFilters;

    return products.filter((product) => {
      // maker (from the landing) filters against the chipset maker so
      // /products/gpu?maker=NVIDIA shows NVIDIA cards directly.
      if (pMaker && !eq(product.specs?.chipset_maker, pMaker)) return false;
      if (pChipset && product.specs?.chipset !== pChipset) return false;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (brand.length > 0 && !brand.includes(product.brand)) return false;

      if (budget.length > 0) {
        const matchesPrice = budget.some((range) => {
          if (range === "Under ₹10K") return product.price < 10000;
          if (range === "₹10K - ₹30K") return product.price >= 10000 && product.price <= 30000;
          if (range === "₹30K - ₹80K") return product.price > 30000 && product.price <= 80000;
          if (range === "Above ₹80K") return product.price > 80000;
          return false;
        });
        if (!matchesPrice) return false;
      }

      if (socket.length > 0 && !socket.includes(product.specs?.socket)) return false;
      if (memory.length > 0 && !memory.includes(product.specs?.memory_type)) return false;
      if (capacity.length > 0 && !capacity.includes(product.specs?.capacity) && !capacity.includes(product.specs?.vram)) return false;
      if (form_factor.length > 0 && !form_factor.includes(product.specs?.form_factor)) return false;
      if (radiator.length > 0 && !radiator.includes(product.specs?.radiator_size)) return false;

      return true;
    });
  }, [products, activeFilters, searchQuery, pChipset, pMaker]);

  // --- FILTER GROUPS (config for the reusable FilterSidebar) ---
  // Only surface a group when the current products actually offer those options.
  const GROUPS: FilterGroupDef[] = useMemo(() => {
    const uniq = (fn: (p: any) => any) =>
      Array.from(new Set(products.map(fn).filter(Boolean))) as string[];

    const brands = uniq((p) => p.brand);
    const sockets = uniq((p) => p.specs?.socket);
    const memory = uniq((p) => p.specs?.memory_type);
    const capacity = uniq((p) => p.specs?.capacity || p.specs?.vram);
    const formFactor = uniq((p) => p.specs?.form_factor);
    const radiator = uniq((p) => p.specs?.radiator_size);

    const g: FilterGroupDef[] = [];
    if (brands.length) g.push({ key: "brand", label: "Brands", type: "checkbox", options: brands });
    g.push({ key: "budget", label: "Budget", type: "checkbox", options: ["Under ₹10K", "₹10K - ₹30K", "₹30K - ₹80K", "Above ₹80K"] });
    if (sockets.length) g.push({ key: "socket", label: "Socket Type", type: "checkbox", options: sockets });
    if (memory.length) g.push({ key: "memory", label: "Memory Type", type: "checkbox", options: memory });
    if (capacity.length) {
      const capLabel = dbCategory === "gpu" ? "VRAM" : dbCategory === "ram" ? "Capacity" : "Capacity / VRAM";
      g.push({ key: "capacity", label: capLabel, type: "checkbox", options: capacity });
    }
    if (formFactor.length) g.push({ key: "form_factor", label: "Form Factor", type: "checkbox", options: formFactor });
    if (radiator.length) g.push({ key: "radiator", label: "Radiator Size", type: "checkbox", options: radiator });
    return g;
  }, [products, dbCategory]);

  const handleAction = async (product: any, isBuyNow: boolean) => {
    addToCart(product);
    if (isBuyNow) router.push("/checkout");
    else toast.success("Added to Gear", { description: `${product.name} is secure in your cart.`, action: { label: "View Cart", onClick: () => router.push("/cart") } });
  };

  // --- RENDERS ---
  if (showLanding) {
    return (
      <div className="min-h-screen bg-rb-black text-white font-saira flex flex-col">
        <NavbarNeo />
        <CategoryLanding category={dbCategory} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rb-black text-white font-saira flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rb-orange/10 blur-[150px] pointer-events-none z-0" />

      <NavbarNeo />

      {/* BREADCRUMB — aligned to the same rb-shell guideline as the content */}
      <ProductBreadcrumb category={dbCategory} maker={pMaker} series={pSeries} chipset={pChipset} />

      <section className="rb-shell py-8 lg:py-10 flex-grow relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
          {/* REUSABLE FILTER SIDEBAR (sticky panel on desktop, pop-up on mobile) */}
          <FilterSidebar
            groups={GROUPS}
            value={activeFilters}
            onChange={setFilter}
            onClearAll={clearAllFilters}
            resultCount={filteredProducts.length}
            stickyTop={104}
            title="Specs"
          />

          {/* PRODUCT GRID */}
          <div>
            {filteredProducts.length === 0 ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-rb-silver border border-dashed border-rb-line rounded-2xl">
                <p className="font-orbitron text-xl mb-2 uppercase">No signals detected</p>
                <p className="text-sm text-rb-silver/50 uppercase tracking-widest text-center mt-1">
                  Try adjusting your filters or checking a different category.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-6 px-6 py-2 rounded-lg border border-rb-orange text-rb-orange text-xs font-bold uppercase tracking-widest hover:bg-rb-orange hover:text-rb-orange-ink transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <StaggerGrid key={`grid-${filteredProducts.length}`} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {filteredProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <div className="group relative rb-surface-card overflow-hidden flex flex-col h-full">
                      {!product.in_stock && (
                        <div className="absolute top-3 right-3 z-20 bg-rb-danger text-white text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">
                          Out of Stock
                        </div>
                      )}

                      <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-rb-surface to-transparent border-b border-rb-line">
                        <div className="absolute inset-0 bg-rb-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl z-0" />
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover relative z-10 group-hover:scale-[1.15] transition-transform duration-700" />
                        ) : (
                          <span className="text-rb-silver/20 font-saira text-2xl font-bold -rotate-12 select-none">{product.name}</span>
                        )}
                      </Link>

                      <div className="p-6 flex flex-col flex-grow relative z-10">
                        <span className="text-[10px] font-bold text-rb-orange tracking-[0.2em] uppercase mb-2 block">{product.brand}</span>

                        <Link href={`/product/${product.id}`} className="block mb-4">
                          <h4 className="text-rb-white font-saira text-base leading-tight group-hover:text-rb-orange transition-colors line-clamp-2 uppercase">
                            {product.name}
                          </h4>
                        </Link>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6 mt-1 min-h-[40px]">
                          {product.specs && Object.keys(product.specs).length > 0 ? (
                            Object.entries(product.specs)
                              .filter(([key]) => !["wattage", "variant_label", "group"].includes(key.toLowerCase()))
                              .slice(0, 4)
                              .map(([key, value]: any) => (
                                <div key={key} className="border-l border-rb-line pl-2">
                                  <span className="block text-white/40 text-[9px] uppercase tracking-wider truncate">{key.replace(/_/g, " ")}</span>
                                  <span className="text-rb-silver text-xs font-bold truncate block">{value}</span>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-2 border-l border-rb-line pl-2">
                              <span className="block text-white/40 text-[9px] uppercase tracking-wider">Details</span>
                              <span className="text-rb-silver text-xs font-bold">See Product Page</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-rb-line flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-rb-silver uppercase tracking-widest mb-1">Price</p>
                            <span className="text-rb-white font-saira font-bold text-xl">₹{Number(product.price || 0).toLocaleString("en-IN")}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(product, false)}
                              disabled={!product.in_stock}
                              className="h-10 w-11 rounded-lg border border-rb-line text-rb-white hover:border-rb-orange hover:text-rb-orange transition-all flex items-center justify-center disabled:opacity-20"
                              title="Add to Cart"
                            >
                              <FaShoppingCart size={13} />
                            </button>
                            <button
                              onClick={() => handleAction(product, true)}
                              disabled={!product.in_stock}
                              className="h-10 px-5 rounded-lg bg-rb-orange text-rb-orange-ink text-[10px] font-saira font-bold uppercase tracking-widest hover:bg-rb-orange-deep transition-all disabled:opacity-20 flex items-center gap-2"
                            >
                              Buy <FaArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
