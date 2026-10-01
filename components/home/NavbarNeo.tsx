"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import {
  FaSearch, FaShoppingCart, FaUser, FaBars, FaTimes, FaArrowRight,
  FaMicrochip, FaDesktop, FaHeadset, FaCompass,
  FaKeyboard, FaMouse, FaUsb, FaHeadphones, FaPlug, FaBriefcase,
  FaBorderAll, FaClone, FaCircle,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import GlobalSearch from "@/components/GlobalSearch";

// ── Fallback category menus (used until Supabase categories load) ──
const FALLBACK_MENU = {
  components: [
    { slug: "cpu", label: "Processors" }, { slug: "gpu", label: "Graphics Cards" },
    { slug: "motherboard", label: "Motherboards" }, { slug: "ram", label: "Memory (RAM)" },
    { slug: "storage", label: "Storage" }, { slug: "psu", label: "Power Supply" },
    { slug: "cabinet", label: "PC Cabinets" }, { slug: "cooler", label: "Cooling" },
  ],
  accessories: [
    { slug: "monitor", label: "Displays" }, { slug: "keyboard", label: "Keyboards" },
    { slug: "mouse", label: "Mouse" }, { slug: "combo", label: "Combos" },
    { slug: "mousepad", label: "Mouse Pads" }, { slug: "usb", label: "USB Drives" },
  ],
};

const SERIES = [
  { name: "ASCEND", label: "Ascend", href: "/ascend", tag: "Gaming" },
  { name: "WORKPRO", label: "WorkPro", href: "/workpro", tag: "Workstation" },
  { name: "CREATOR", label: "Creator", href: "/creator", tag: "Creation" },
  { name: "SIGNATURE", label: "Signature", href: "/signature", tag: "Flagship" },
];

const NAV = ["products", "desktops", "accessories", "support"];

// Pick an icon for an accessory by its label/slug keywords (categories are DB-driven).
function accessoryIcon(key: string): IconType {
  const k = key.toLowerCase();
  if (k.includes("monitor") || k.includes("display")) return FaDesktop;
  if (k.includes("keyboard")) return FaKeyboard;
  if (k.includes("pad")) return FaBorderAll;
  if (k.includes("combo")) return FaClone;
  if (k.includes("headphone") || k.includes("headset")) return FaHeadphones;
  if (k.includes("adapt")) return FaPlug;
  if (k.includes("bag")) return FaBriefcase;
  if (k.includes("mouse")) return FaMouse;
  if (k.includes("usb") || k.includes("drive")) return FaUsb;
  return FaCircle;
}

// Small reusable logo mark that always routes home.
function LogoMark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5 group shrink-0">
      <span className="relative w-8 h-8 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-rb-orange/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <Image src="/icons/icon_only.svg" alt="Rig Builders — home" width={30} height={30} className="relative z-10" priority />
      </span>
      <span className="hidden sm:block font-orbitron font-black tracking-[0.18em] text-[13px] text-rb-white leading-none">
        RIG<span className="text-rb-orange">BUILDERS</span>
      </span>
    </Link>
  );
}

export default function NavbarNeo({ overlay = false }: { overlay?: boolean }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenu] = useState(FALLBACK_MENU);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpenRef = useRef(false);

  const openMenu = (m: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    menuOpenRef.current = true;
    setActiveMenu(m);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      menuOpenRef.current = false;
      setActiveMenu(null);
    }, 180);
  };

  // Auth + categories
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase
      .from("categories")
      .select("id, name, short_name, group_id, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const comp = data.filter((c: any) => c.group_id === "components").map((c: any) => ({ slug: c.id, label: c.short_name || c.name }));
        const acc = data.filter((c: any) => c.group_id === "accessories").map((c: any) => ({ slug: c.id, label: c.short_name || c.name }));
        setMenu({
          components: comp.length ? comp : FALLBACK_MENU.components,
          accessories: acc.length ? acc : FALLBACK_MENU.accessories,
        });
      });
  }, []);

  // Portaled to <body> so it escapes app/template.tsx's transform+filter
  // wrapper — otherwise `position: fixed` anchors to that wrapper and scrolls
  // away (i.e. the navbar wouldn't actually stay stuck).
  useEffect(() => setMounted(true), []);

  // Sticky: always visible. Only darken the glass slightly once scrolled
  // (no size/margin shrink).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const linkBase =
    "relative py-1 font-saira text-[12px] font-bold uppercase tracking-[0.16em] transition-colors";

  // The bar is fixed + portaled to <body>. On non-homepage pages we also drop
  // an in-flow spacer so page content clears it (the homepage passes
  // overlay so the hero can sit behind the transparent bar instead).
  return (
    <>
      {!overlay && <div aria-hidden style={{ height: 84 }} />}
      {mounted &&
        createPortal(
          <>
            <header className="fixed top-0 inset-x-0 z-[100] pointer-events-none">
        {/* Same .rb-shell container the sections use → the pill sits in the
            exact same box (capped 1600px + matching gutter), so the BAR itself
            is inset from the screen edges and lines up with the content. */}
        <div className="rb-shell">
          <div
            className="pointer-events-auto relative mt-4"
            onMouseLeave={scheduleClose}
          >
            {/* soft ember under the capsule */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-72 h-16 bg-rb-orange/10 blur-2xl pointer-events-none" />

            {/* ── CAPSULE (glassmorphism) ── */}
            <div
              className={`relative flex items-center justify-between gap-3 rounded-full h-[60px] px-6 sm:px-8 backdrop-blur-md backdrop-saturate-150 transition-all duration-500 ${
              scrolled || activeMenu
                ? "bg-rb-black/92 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]"
                : "bg-rb-black/80 shadow-[0_6px_18px_-18px_rgba(0,0,0,0.45)]"
            }`}
          >
            {/* animated top hairline accent */}
            <span className="absolute top-0 left-8 right-8 h-[1.5px] rb-bar-anim rounded-full opacity-70" />

            {/* LEFT: logo */}
            <LogoMark />

            {/* CENTER: links (desktop) */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV.map((item) => {
                const isActive = activeMenu === item;
                const hasMenu = item !== "support";
                return (
                  <div
                    key={item}
                    className="relative"
                    onMouseEnter={() => (hasMenu ? openMenu(item) : setActiveMenu(null))}
                  >
                    <Link
                      href={`/${item}`}
                      className={`${linkBase} ${isActive ? "text-rb-orange" : "text-rb-mist hover:text-rb-white"}`}
                    >
                      {item}
                      <span
                        className={`absolute -bottom-0.5 left-0 h-[2px] bg-rb-orange transition-all duration-300 ${
                          isActive ? "w-full" : "w-0"
                        }`}
                      />
                    </Link>
                  </div>
                );
              })}
            </nav>

            {/* RIGHT: actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* --- MOBILE ORDER: account, search, menu (logo already left) --- */}
              {/* Account — hover dropdown (anchored under the icon), link on mobile */}
              <div
                className="relative h-[60px] flex items-center"
                onMouseEnter={() => openMenu("user")}
              >
                <Link
                  href={user ? "/dashboard" : "/signin"}
                  aria-label="Account"
                  className="block p-2.5 text-rb-mist hover:text-rb-orange transition-colors"
                >
                  <FaUser size={15} />
                </Link>
              </div>

              {/* Search — hover dropdown (detached below), overlay on mobile */}
              <div
                className="relative h-[60px] flex items-center"
                onMouseEnter={() => openMenu("search")}
              >
                <button
                  aria-label="Search"
                  onClick={() => setMobileSearchOpen(true)}
                  className="p-2.5 text-rb-mist hover:text-rb-orange transition-colors"
                >
                  <FaSearch size={15} />
                </button>
              </div>

              {/* Cart (desktop only in capsule) */}
              <Link href="/cart" aria-label="Cart" className="hidden lg:block p-2.5 text-rb-mist hover:text-rb-orange transition-colors">
                <FaShoppingCart size={15} />
              </Link>

              {/* Build (desktop) */}
              <Link href="/configure" className="hidden lg:block ml-1">
                <button className="rb-cta rb-sheen px-5 py-2.5 text-[11px] uppercase tracking-[0.16em]">
                  Build Yours
                </button>
              </Link>

              {/* Hamburger (mobile) — last per requested order */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
                className="lg:hidden p-2.5 text-rb-white hover:text-rb-orange transition-colors"
              >
                <FaBars size={17} />
              </button>
            </div>
          </div>

          {/* ══════════ DETACHED DROPDOWN PANELS (A) ══════════ */}
          {/* PRODUCTS */}
          <MegaWrap show={activeMenu === "products"} onEnter={() => openMenu("products")} onLeave={scheduleClose} className="left-0 right-0">
            <div className="grid grid-cols-4 divide-x divide-rb-line">
              <MegaCol title="PC Components" icon={FaMicrochip}>
                {menu.components.map((c) => (
                  <MegaLink key={c.slug} href={`/products/${c.slug}`} label={c.label} />
                ))}
              </MegaCol>
              <MegaCol title="Desktops" icon={FaDesktop}>
                {SERIES.map((s) => (
                  <MegaLink key={s.href} href={s.href} label={`${s.label} Series`} />
                ))}
              </MegaCol>
              <MegaCol title="Accessories" icon={FaHeadset}>
                {menu.accessories.map((c) => (
                  <MegaLink key={c.slug} href={`/products/${c.slug}`} label={c.label} />
                ))}
              </MegaCol>
              <MegaCol title="Find / Quick Links" icon={FaCompass}>
                <div className="mb-4">
                  <GlobalSearch placeholder="Search components…" variant="minimal" onSearchSubmit={scheduleClose} />
                </div>
                <MegaLink href="/configure" label="System Configurator" />
                <MegaLink href="/products/cpu" label="Processors" />
                <MegaLink href="/products/gpu" label="Graphics Cards" />
                <MegaLink href="/products/monitor" label="Displays" />
              </MegaCol>
            </div>
          </MegaWrap>

          {/* DESKTOPS */}
          <MegaWrap show={activeMenu === "desktops"} onEnter={() => openMenu("desktops")} onLeave={scheduleClose} className="left-0 right-0">
            <div className="grid grid-cols-4 gap-4">
              {SERIES.map((s) => (
                <Link key={s.href} href={s.href} onClick={scheduleClose} className="group rb-surface-card rb-sheen p-6 flex flex-col items-center text-center">
                  <span className="rb-kicker text-rb-orange/80 text-[9px] mb-2">{s.tag}</span>
                  <h3 className="font-orbitron text-2xl font-black text-rb-white group-hover:text-rb-orange transition-colors">{s.name}</h3>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rb-orange">
                    View Series <FaArrowRight size={9} />
                  </span>
                </Link>
              ))}
            </div>
          </MegaWrap>

          {/* ACCESSORIES */}
          <MegaWrap show={activeMenu === "accessories"} onEnter={() => openMenu("accessories")} onLeave={scheduleClose} className="left-1/2 -translate-x-1/2 w-[640px] max-w-[calc(100%-1rem)]" pad="p-8">
            <div className="flex gap-10">
              <div className="w-1/3 border-r border-rb-line pr-8 flex flex-col justify-center">
                <FaHeadset className="text-rb-orange text-3xl mb-4" />
                <h3 className="font-orbitron text-xl font-bold text-rb-white mb-2 uppercase">Accessories</h3>
                <p className="text-rb-silver text-xs leading-relaxed">Upgrade your battlestation with premium peripherals and displays.</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                {menu.accessories.map((c) => {
                  const Icon = accessoryIcon(c.label);
                  return (
                    <Link
                      key={c.slug}
                      href={`/products/${c.slug}`}
                      onClick={scheduleClose}
                      className="group flex items-center gap-3 py-1.5 text-sm text-rb-silver hover:text-rb-orange transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-rb-orange/10 border border-rb-orange/20 flex items-center justify-center text-rb-orange shrink-0 group-hover:bg-rb-orange/20 transition-colors">
                        <Icon size={14} />
                      </span>
                      <span className="uppercase tracking-wide font-medium">{c.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </MegaWrap>

          {/* ACCOUNT (detached so the glass blur is effective) */}
          <MegaWrap show={activeMenu === "user"} onEnter={() => openMenu("user")} onLeave={scheduleClose} className="right-0 w-72" pad="p-0">
            {user ? (
              <div className="font-saira text-rb-white">
                <div className="px-5 py-4 border-b border-rb-line flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-rb-orange/40 bg-rb-orange/10 flex items-center justify-center text-rb-orange">
                    <FaUser size={13} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate font-orbitron">{user.user_metadata?.full_name || "RigBuilder"}</p>
                    <p className="text-[10px] text-rb-silver truncate">{user.email}</p>
                  </div>
                </div>
                <div className="py-2">
                  <AcctLink href="/dashboard" label="Dashboard" onClick={scheduleClose} />
                  <AcctLink href="/dashboard" label="Orders" onClick={scheduleClose} />
                  <AcctLink href="/cart" label="Cart" onClick={scheduleClose} />
                  <AcctLink href="/support" label="Support" onClick={scheduleClose} />
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm text-rb-danger hover:bg-rb-danger/10 border-t border-rb-line mt-1 font-bold">
                    <FaArrowRight size={10} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center font-saira">
                <p className="text-sm font-bold mb-4 font-orbitron text-rb-white">WELCOME</p>
                <div className="space-y-3">
                  <Link href="/signin" onClick={scheduleClose} className="block w-full py-2.5 bg-white/5 hover:bg-white/10 border border-rb-line text-xs uppercase font-bold tracking-wider text-rb-white transition-all rounded-lg">Log In</Link>
                  <Link href="/signup" onClick={scheduleClose} className="rb-cta block w-full py-2.5 text-xs uppercase font-bold tracking-wider rounded-lg">Sign Up</Link>
                </div>
              </div>
            )}
          </MegaWrap>

          {/* SEARCH (detached so the glass blur is effective) */}
          <MegaWrap show={activeMenu === "search"} onEnter={() => openMenu("search")} onLeave={scheduleClose} className="right-0 w-[380px] max-w-[calc(100vw-2rem)]">
            <div className="mb-5">
              <GlobalSearch placeholder="Search rigbuilders.in…" variant="standard" onSearchSubmit={scheduleClose} />
            </div>
            <h4 className="rb-kicker mb-3">Quick Links</h4>
            <div className="space-y-1">
              <MegaLink href="/ascend" label="Ascend Series" />
              <MegaLink href="/products" label="All Components" />
              <MegaLink href="/configure" label="System Configurator" />
            </div>
          </MegaWrap>

          </div>
        </div>
      </header>

      {/* ══════════ MOBILE DRAWER ══════════ */}
      <div
        className={`lg:hidden fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 h-[100dvh] w-[85%] max-w-[330px] bg-rb-surface border-r border-rb-line p-6 flex flex-col transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8 border-b border-rb-line pb-4">
            <LogoMark onClick={() => setMobileMenuOpen(false)} />
            <button onClick={() => setMobileMenuOpen(false)} className="text-rb-white text-xl"><FaTimes /></button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <Link href={user ? "/dashboard" : "/signin"} onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center justify-center bg-rb-elevated p-3 rounded-lg border border-rb-line hover:border-rb-orange/50">
              <FaUser className="text-rb-white mb-2" />
              <span className="text-[10px] text-rb-silver uppercase font-bold">{user ? "Account" : "Login"}</span>
            </Link>
            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex flex-col items-center justify-center bg-rb-elevated p-3 rounded-lg border border-rb-line hover:border-rb-orange/50">
              <FaShoppingCart className="text-rb-white mb-2" />
              <span className="text-[10px] text-rb-silver uppercase font-bold">Cart</span>
            </Link>
            <Link href="/configure" onClick={() => setMobileMenuOpen(false)} className="rb-cta flex flex-col items-center justify-center p-3 rounded-lg">
              <span className="font-bold text-lg leading-none mb-1">+</span>
              <span className="text-[10px] uppercase font-bold">Build</span>
            </Link>
          </div>

          <div className="space-y-8 overflow-y-auto font-orbitron flex-grow pr-1">
            <div>
              <h3 className="rb-kicker text-rb-orange mb-4 border-b border-rb-line pb-2">Main Menu</h3>
              <ul className="space-y-4 text-rb-white text-lg">
                <li><Link href="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link></li>
                <li><Link href="/accessories" onClick={() => setMobileMenuOpen(false)}>Accessories</Link></li>
                <li><Link href="/support" onClick={() => setMobileMenuOpen(false)}>Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="rb-kicker text-rb-orange mb-4 border-b border-rb-line pb-2">Desktops</h3>
              <ul className="space-y-4 text-rb-white text-lg">
                {SERIES.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} onClick={() => setMobileMenuOpen(false)}>
                      {s.label} Series
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-6 text-center text-xs text-rb-silver/50 border-t border-rb-line font-saira">
            © {new Date().getFullYear()} Rig Builders.
          </div>
        </div>
      </div>

      {/* ══════════ MOBILE SEARCH OVERLAY ══════════ */}
      {mobileSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] bg-rb-surface p-6 flex flex-col animate-in slide-in-from-top-8 duration-200">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-orbitron text-rb-white">Search</h2>
            <button onClick={() => setMobileSearchOpen(false)} className="text-rb-white text-2xl"><FaTimes /></button>
          </div>
          <GlobalSearch placeholder="Search anything…" variant="standard" onSearchSubmit={() => setMobileSearchOpen(false)} className="w-full" />
        </div>
      )}
          </>,
          document.body
        )}
    </>
  );
}

/* ── Dropdown shell: detached, rounded, blurred panel under the capsule ── */
function MegaWrap({
  show, children, onEnter, onLeave, className = "", pad = "p-6",
}: {
  show: boolean; children: React.ReactNode; onEnter: () => void; onLeave: () => void; className?: string; pad?: string;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`absolute top-full mt-3 z-50 origin-top transition-all duration-200 ${
        show ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
      } ${className}`}
    >
      <div className={`relative overflow-hidden rounded-2xl bg-rb-black/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 ring-1 ring-inset ring-white/5 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.95)] ${pad}`}>
        {/* glass sheen across the top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        {children}
      </div>
    </div>
  );
}

function MegaCol({ title, icon: Icon, children }: { title: string; icon?: IconType; children: React.ReactNode }) {
  return (
    <div className="px-6 first:pl-0 last:pr-0">
      <h3 className="rb-kicker mb-4 flex items-center gap-2">
        {Icon && (
          <span className="w-6 h-6 rounded-md bg-rb-orange/10 border border-rb-orange/20 flex items-center justify-center text-rb-orange">
            <Icon size={11} />
          </span>
        )}
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function MegaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 text-sm text-rb-silver hover:text-rb-orange transition-colors">
      <span className="w-0 group-hover:w-4 h-[2px] bg-rb-orange transition-all duration-300 rounded-full" />
      {label}
    </Link>
  );
}

function AcctLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-5 py-2.5 text-sm text-rb-silver hover:text-rb-white hover:bg-white/5 transition-colors">
      <FaArrowRight size={9} className="text-rb-orange" /> {label}
    </Link>
  );
}
