"use client";

/* ============================================================
   Reusable FilterSidebar — Accordion (checkbox + range + toggle)
   ------------------------------------------------------------
   Config-driven so any route can reuse it. Renders a sticky rounded
   panel on desktop and a bottom-sheet drawer on mobile.

   Controlled: pass `value` (per-group state) + `onChange(key, next)`.
     • checkbox group → value[key] is string[]
     • range group    → value[key] is [number, number]
     • toggle group   → value[key] is boolean
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaSlidersH } from "react-icons/fa";

export type FilterOption = string | { value: string; count?: number };

export type FilterGroupDef =
  | { key: string; label: string; type: "checkbox"; options: FilterOption[]; defaultOpen?: boolean }
  | { key: string; label: string; type: "range"; min: number; max: number; step?: number; prefix?: string; defaultOpen?: boolean }
  | { key: string; label: string; type: "toggle"; defaultOpen?: boolean };

export interface FilterSidebarProps {
  groups: FilterGroupDef[];
  value: Record<string, any>;
  onChange: (key: string, next: any) => void;
  onClearAll?: () => void;
  resultCount?: number;
  title?: string;
  /** Sticky offset from the top (clears the fixed navbar). Default 96px. */
  stickyTop?: number;
  className?: string;
}

const optValue = (o: FilterOption) => (typeof o === "string" ? o : o.value);
const optCount = (o: FilterOption) => (typeof o === "string" ? undefined : o.count);
const fmt = (n: number, prefix = "") => `${prefix}${n.toLocaleString("en-IN")}`;

/* Derive removable "active filter" chips from the current value. */
function useChips(groups: FilterGroupDef[], value: Record<string, any>, onChange: FilterSidebarProps["onChange"]) {
  return useMemo(() => {
    const chips: { key: string; label: string; remove: () => void }[] = [];
    for (const g of groups) {
      const v = value[g.key];
      if (g.type === "checkbox" && Array.isArray(v)) {
        v.forEach((opt: string) =>
          chips.push({ key: `${g.key}:${opt}`, label: opt, remove: () => onChange(g.key, v.filter((x: string) => x !== opt)) })
        );
      } else if (g.type === "range" && Array.isArray(v)) {
        const [lo, hi] = v;
        if (lo > g.min || hi < g.max) {
          chips.push({ key: g.key, label: `${fmt(lo, g.prefix)} – ${fmt(hi, g.prefix)}`, remove: () => onChange(g.key, [g.min, g.max]) });
        }
      } else if (g.type === "toggle" && v) {
        chips.push({ key: g.key, label: g.label, remove: () => onChange(g.key, false) });
      }
    }
    return chips;
  }, [groups, value, onChange]);
}

/* ── one accordion section ── */
function Section({ group, value, onChange }: { group: FilterGroupDef; value: Record<string, any>; onChange: FilterSidebarProps["onChange"] }) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);

  return (
    <div className="border-t border-rb-line py-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex justify-between items-center group">
        <span className="font-orbitron text-[11px] font-bold uppercase tracking-[0.15em] text-rb-white group-hover:text-rb-orange transition-colors">
          {group.label}
        </span>
        <span className="text-rb-orange text-lg font-light leading-none">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-3.5">
          {group.type === "checkbox" && (
            <div className="space-y-2.5">
              {group.options.map((o) => {
                const val = optValue(o);
                const selected: string[] = value[group.key] || [];
                const checked = selected.includes(val);
                return (
                  <label key={val} className="flex items-center justify-between gap-3 cursor-pointer group/i">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-all ${checked ? "bg-rb-orange border-rb-orange" : "border-rb-line group-hover/i:border-rb-silver"}`}>
                        {checked && <span className="w-1.5 h-1.5 bg-rb-orange-ink rounded-[1px]" />}
                      </span>
                      <span className={`text-xs font-saira truncate ${checked ? "text-rb-white" : "text-rb-silver group-hover/i:text-rb-white"}`}>{val}</span>
                    </span>
                    {optCount(o) !== undefined && <span className="text-[10px] text-rb-silver/50 shrink-0">{optCount(o)}</span>}
                    <input type="checkbox" className="hidden" checked={checked}
                      onChange={() => onChange(group.key, checked ? selected.filter((x) => x !== val) : [...selected, val])} />
                  </label>
                );
              })}
            </div>
          )}

          {group.type === "range" && (
            <RangeSlider
              min={group.min}
              max={group.max}
              step={group.step ?? 1}
              prefix={group.prefix ?? ""}
              value={(value[group.key] as [number, number]) || [group.min, group.max]}
              onChange={(next) => onChange(group.key, next)}
            />
          )}

          {group.type === "toggle" && (
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-saira text-rb-silver">{group.label}</span>
              <span
                onClick={() => onChange(group.key, !value[group.key])}
                className={`w-9 h-5 rounded-full relative transition-colors ${value[group.key] ? "bg-rb-orange" : "bg-rb-line"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${value[group.key] ? "left-4" : "left-0.5"}`} />
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

/* ── dual-thumb range slider ── */
function RangeSlider({ min, max, step, prefix, value, onChange }: {
  min: number; max: number; step: number; prefix: string; value: [number, number]; onChange: (v: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const pct = (n: number) => ((n - min) / (max - min || 1)) * 100;
  return (
    <div>
      <div className="relative h-1 bg-rb-line rounded-full">
        <div className="absolute h-1 bg-rb-orange rounded-full" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" className="rb-range" min={min} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])} />
        <input type="range" className="rb-range" min={min} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])} />
      </div>
      <div className="flex justify-between text-[10px] font-saira text-rb-silver mt-3">
        <span>{fmt(lo, prefix)}</span>
        <span>{fmt(hi, prefix)}</span>
      </div>
    </div>
  );
}

/* ── shared inner content (used by both desktop panel & mobile drawer) ── */
function Content({ groups, value, onChange, onClearAll, resultCount, title = "Filters" }: FilterSidebarProps) {
  const chips = useChips(groups, value, onChange);
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-orbitron font-black text-sm uppercase tracking-widest text-rb-white">{title}</span>
          {resultCount !== undefined && <span className="text-[10px] text-rb-silver">{resultCount} results</span>}
        </div>
        {chips.length > 0 && (
          <button onClick={onClearAll} className="text-[10px] uppercase tracking-widest text-rb-orange hover:text-rb-white transition-colors">
            Clear all
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {chips.map((c) => (
            <button key={c.key} onClick={c.remove}
              className="flex items-center gap-1.5 bg-rb-orange/15 border border-rb-orange/40 text-rb-orange text-[10px] px-2 py-1 rounded">
              {c.label} <FaTimes size={7} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {groups.map((g) => <Section key={g.key} group={g} value={value} onChange={onChange} />)}
      </div>
    </>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  const { stickyTop = 96, className = "" } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chips = useChips(props.groups, props.value, props.onChange);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while the pop-up is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  // The pop-up is portaled to <body> so it overlays the LIVE viewport instead
  // of being trapped (and pushed to the bottom of the page) by any ancestor
  // that establishes a containing block for fixed elements (transform/filter).
  const drawer = drawerOpen && mounted
    ? createPortal(
        <div className="fixed inset-0 z-[200] flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-h-[85vh] overflow-y-auto custom-scrollbar bg-rb-surface border-t border-rb-line rounded-t-2xl p-5 animate-in slide-in-from-bottom-6 duration-200">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-rb-silver hover:text-white"><FaTimes size={18} /></button>
            <Content {...props} />
            <button onClick={() => setDrawerOpen(false)} className="rb-cta w-full mt-6 py-3 rounded-lg uppercase tracking-widest text-sm">
              Show {props.resultCount !== undefined ? `${props.resultCount} ` : ""}results
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    // The ROOT is the single grid item and carries `sticky` itself. Paired with
    // `items-start` on the parent grid, the item is content-height and top-aligns
    // to the same row line as the content column, while the (tall) grid area gives
    // the sticky element room to travel on scroll. This is the reliable pattern.
    <div className={`lg:sticky ${className}`} style={{ top: stickyTop }}>
      {/* DESKTOP — rounded panel */}
      <div className="hidden lg:block rb-surface-card p-5">
        <Content {...props} />
      </div>

      {/* MOBILE — trigger button (the pop-up itself is portaled below) */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 rb-surface-card py-3 font-orbitron text-xs font-bold uppercase tracking-widest text-rb-white"
        >
          <FaSlidersH className="text-rb-orange" /> Filters{chips.length > 0 && <span className="text-rb-orange">({chips.length})</span>}
        </button>
      </div>

      {drawer}
    </div>
  );
}
