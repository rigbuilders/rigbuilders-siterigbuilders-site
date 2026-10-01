"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/context/CartContext";
import { getRecentViews } from "@/lib/recentViews";
import { Reveal } from "@/components/ui/MotionWrappers";
import {
  BsCpu, BsGpuCard, BsMotherboard, BsMemory, BsDeviceHddFill, BsFan, BsPlugFill, BsBox,
} from "react-icons/bs";
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaShoppingCart } from "react-icons/fa";
import { toast } from "sonner";
import type { IconType } from "react-icons";

const EASE = [0.22, 1, 0.36, 1] as const;
const COLS_LG = 4; // hover-expand only runs on desktop (4-col grid)

function catIcon(slug: string): IconType {
  const k = slug.toLowerCase();
  if (k.includes("cpu") || k.includes("processor")) return BsCpu;
  if (k.includes("gpu") || k.includes("graphic")) return BsGpuCard;
  if (k.includes("mother") || k.includes("mobo")) return BsMotherboard;
  if (k.includes("ram") || k.includes("memory")) return BsMemory;
  if (k.includes("storage") || k.includes("ssd") || k.includes("hdd") || k.includes("nvme")) return BsDeviceHddFill;
  if (k.includes("cool") || k.includes("fan")) return BsFan;
  if (k.includes("psu") || k.includes("power")) return BsPlugFill;
  if (k.includes("cabinet") || k.includes("case")) return BsBox;
  return BsCpu;
}

interface Cat { id: string; name: string; short_name: string | null; }
interface Product {
  id: string; name: string; breadcrumb_name: string | null; price: number;
  image_url: string | null; in_stock: boolean | null; cod_policy: string | null; category: string | null;
}
interface Featured { id: string; source: string; }

export default function ComponentsPicker() {
  const { cart, addToCart } = useCart();

  const [cats, setCats] = useState<Cat[]>([]);
  const [topViewByCat, setTopViewByCat] = useState<Record<string, string>>({});
  const [userRecentByCat, setUserRecentByCat] = useState<Record<string, string>>({});
  const [localRecentByCat, setLocalRecentByCat] = useState<Record<string, string>>({});

  const [hovered, setHovered] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [productsByCat, setProductsByCat] = useState<Record<string, Product[]>>({});
  const [loadingCat, setLoadingCat] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load categories + the personalized-pick signals (recents / most-viewed).
  useEffect(() => {
    (async () => {
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name, short_name, group_id, active, sort_order")
        .eq("group_id", "components")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      const categories: Cat[] = (catData || []).map((c: any) => ({ id: c.id, name: c.name, short_name: c.short_name }));
      setCats(categories);
      const catIds = categories.map((c) => c.id);
      if (catIds.length === 0) return;

      const localRecent: Record<string, string> = {};
      for (const r of getRecentViews()) if (r.category && catIds.includes(r.category) && !localRecent[r.category]) localRecent[r.category] = r.id;
      setLocalRecentByCat(localRecent);

      const { data: views } = await supabase
        .from("product_views").select("product_id, category, view_count")
        .in("category", catIds).order("view_count", { ascending: false });
      const topView: Record<string, string> = {};
      (views || []).forEach((v: any) => { if (v.category && !topView[v.category]) topView[v.category] = v.product_id; });
      setTopViewByCat(topView);

      const userRecent: Record<string, string> = {};
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: uv } = await supabase
          .from("user_views").select("product_id, category, viewed_at")
          .eq("user_id", auth.user.id).in("category", catIds).order("viewed_at", { ascending: false });
        (uv || []).forEach((v: any) => { if (v.category && !userRecent[v.category]) userRecent[v.category] = v.product_id; });
      }
      setUserRecentByCat(userRecent);
    })();
  }, []);

  // On hover: lazy-load that category's products for the carousel.
  const openCat = (id: string) => {
    setHovered(id);
    if (productsByCat[id]) return;
    setLoadingCat(id);
    supabase
      .from("products")
      .select("id, name, breadcrumb_name, price, image_url, in_stock, cod_policy, category, created_at")
      .eq("category", id)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        setProductsByCat((prev) => ({ ...prev, [id]: (data || []) as Product[] }));
        setLoadingCat(null);
      });
  };

  // The personalized pick id per category (Cart → Recent → Most-viewed).
  const pickByCat = useMemo(() => {
    const out: Record<string, Featured> = {};
    const setIf = (cat: string | null | undefined, id: string | undefined, source: string) => {
      if (cat && id && !out[cat]) out[cat] = { id, source };
    };
    [...cart].reverse().forEach((ci) => setIf(ci.category, ci.id, "In your cart"));
    cats.forEach((c) => setIf(c.id, localRecentByCat[c.id], "Recently viewed"));
    cats.forEach((c) => setIf(c.id, userRecentByCat[c.id], "Recently viewed"));
    cats.forEach((c) => setIf(c.id, topViewByCat[c.id], "Most viewed"));
    return out;
  }, [cart, cats, localRecentByCat, userRecentByCat, topViewByCat]);

  const handleAdd = (p: Product) => {
    addToCart({ id: p.id, name: p.name, price: p.price, image: p.image_url || undefined, category: p.category || undefined, cod_policy: (p.cod_policy as any) || "full_cod" });
    toast.success("Added to cart", { description: p.breadcrumb_name || p.name });
  };

  if (cats.length === 0) return null;

  const hoveredIndex = hovered ? cats.findIndex((c) => c.id === hovered) : -1;
  const rowEndIndex = hoveredIndex >= 0 ? Math.min(Math.floor(hoveredIndex / COLS_LG) * COLS_LG + (COLS_LG - 1), cats.length - 1) : -1;
  const hoveredCat = hovered ? cats.find((c) => c.id === hovered) : null;

  return (
    <section className="relative bg-rb-black py-24 border-t border-rb-line overflow-hidden">
      <div className="rb-shell relative z-10">
        <Reveal>
          <div className="text-center mb-12">
            <span className="rb-kicker">Pick your parts</span>
            <h2 className="mt-3 font-orbitron text-3xl md:text-5xl font-black text-rb-white uppercase">
              Build it <span className="rb-text-ember">component by component</span>
            </h2>
            <p className="mt-3 font-saira text-rb-silver text-sm md:text-base max-w-xl mx-auto">
              Every category surfaces a pick tuned to you — what&apos;s in your cart, what you viewed, or what everyone&apos;s buying.
            </p>
          </div>
        </Reveal>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-start"
          onMouseLeave={() => setHovered(null)}
        >
          {cats.map((c, i) => {
            const Icon = catIcon(c.id);
            const isOpen = isDesktop && hovered === c.id;
            const dimmed = isDesktop && hovered !== null && hovered !== c.id;
            return (
              <Fragment key={c.id}>
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.35, ease: EASE } }}
                  onMouseEnter={() => isDesktop && openCat(c.id)}
                  className={`relative rounded-xl border bg-rb-elevated transition-[filter,opacity,border-color] duration-300 ${
                    isOpen ? "border-rb-orange/60 z-20"
                    : dimmed ? "border-rb-line blur-[2px] opacity-40 scale-[0.99]"
                    : "border-rb-line"
                  }`}
                >
                  <Link href={`/products/${c.id}`} className="flex items-center gap-3 p-3.5 sm:p-4 lg:p-5 group/head">
                    <span className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg bg-rb-orange/10 border border-rb-orange/20 flex items-center justify-center text-rb-orange text-base sm:text-lg shrink-0">
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-orbitron font-bold text-rb-white text-xs sm:text-sm uppercase truncate">
                        {c.short_name || c.name}
                      </span>
                      <span className="hidden sm:block text-[10px] text-rb-silver uppercase tracking-widest">Shop now</span>
                    </span>
                    <FaArrowRight className="text-rb-silver group-hover/head:text-rb-orange transition-colors shrink-0 hidden sm:block" size={11} />
                  </Link>
                </motion.div>

                {/* Full-width product carousel drops in after the hovered card's row. */}
                {isDesktop && i === rowEndIndex && (
                  <div className="col-span-full">
                    <AnimatePresence>
                      {hoveredCat && (
                        <motion.div
                          key={rowEndIndex}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <CategoryCarousel
                            cat={hoveredCat}
                            products={productsByCat[hoveredCat.id] || []}
                            loading={loadingCat === hoveredCat.id}
                            pick={pickByCat[hoveredCat.id]}
                            onAdd={handleAdd}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── The horizontal carousel of standalone product cards ── */
function CategoryCarousel({
  cat, products, loading, pick, onAdd,
}: {
  cat: Cat; products: Product[]; loading: boolean; pick?: Featured; onAdd: (p: Product) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => scroller.current?.scrollBy({ left: dir * 400, behavior: "smooth" });

  // Personalized pick pinned first (tagged); the rest follow, plain.
  const ordered = useMemo(() => {
    if (!pick) return products.map((p) => ({ p, tag: null as string | null }));
    const first = products.find((p) => p.id === pick.id);
    const rest = products.filter((p) => p.id !== pick.id);
    const tail = rest.map((p) => ({ p, tag: null as string | null }));
    return first ? [{ p: first, tag: pick.source }, ...tail] : tail;
  }, [products, pick]);

  return (
    <div className="pt-5">
      <div className="flex items-center justify-between mb-4">
        <span className="rb-kicker">
          {cat.short_name || cat.name}
          {products.length > 0 && <span className="text-rb-silver/50"> · {products.length} products</span>}
        </span>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Scroll left" className="w-8 h-8 rounded-full bg-rb-elevated border border-rb-line flex items-center justify-center text-rb-mist hover:text-rb-orange hover:border-rb-orange/50 transition-colors">
            <FaChevronLeft size={11} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" className="w-8 h-8 rounded-full bg-rb-elevated border border-rb-line flex items-center justify-center text-rb-mist hover:text-rb-orange hover:border-rb-orange/50 transition-colors">
            <FaChevronRight size={11} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-none w-[190px] h-64 rounded-xl border border-rb-line bg-rb-elevated animate-pulse" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <p className="text-rb-silver/60 text-sm italic py-6">No products in this category yet.</p>
      ) : (
        <div ref={scroller} className="flex gap-4 overflow-x-auto custom-scrollbar pb-3 snap-x">
          {ordered.map(({ p, tag }) => (
            <ProductCard key={p.id} p={p} tag={tag} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, tag, onAdd }: { p: Product; tag: string | null; onAdd: (p: Product) => void }) {
  return (
    <div className="relative flex-none w-[190px] snap-start rounded-xl border border-rb-line bg-rb-elevated p-3 hover:border-rb-orange/40 transition-colors">
      {tag && (
        <span className="absolute top-2 left-2 z-10 bg-rb-orange text-rb-orange-ink text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          {tag}
        </span>
      )}
      <Link href={`/product/${p.id}`} className="block">
        <div className="h-28 rounded-lg bg-black/40 border border-rb-line overflow-hidden flex items-center justify-center">
          {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-contain" /> : <span className="text-white/15 text-xs">No image</span>}
        </div>
        <div className="mt-2.5 text-white text-xs font-bold leading-tight line-clamp-2 min-h-[2rem]">
          {p.breadcrumb_name || p.name}
        </div>
        <div className="text-rb-orange font-saira text-sm font-bold mt-1">₹{Number(p.price).toLocaleString("en-IN")}</div>
      </Link>

      <button
        onClick={() => onAdd(p)}
        disabled={p.in_stock === false}
        className="rb-cta w-full mt-3 py-2 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FaShoppingCart size={9} /> {p.in_stock === false ? "Out of Stock" : "Add to Cart"}
      </button>
      <Link href={`/product/${p.id}`} className="block text-center mt-2 text-[9px] uppercase tracking-widest text-rb-silver hover:text-rb-orange transition-colors">
        View Details
      </Link>
    </div>
  );
}
