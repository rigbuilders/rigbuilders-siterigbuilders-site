// Recently-viewed products — browser cache (localStorage). Works logged-out.
// Shape: newest first, capped. Each entry: { id, category, ts }.

export interface RecentView {
  id: string;
  category: string | null;
  ts: number;
}

const KEY = "rb_recent_views";
const CAP = 24;

export function getRecentViews(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentView[]) : [];
  } catch {
    return [];
  }
}

export function addRecentView(id: string, category: string | null) {
  if (typeof window === "undefined" || !id) return;
  try {
    const list = getRecentViews().filter((r) => r.id !== id);
    list.unshift({ id, category: category ?? null, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

// Most recent viewed product id for a given category (or null).
export function recentIdForCategory(cat: string): string | null {
  const hit = getRecentViews().find((r) => r.category === cat);
  return hit ? hit.id : null;
}
