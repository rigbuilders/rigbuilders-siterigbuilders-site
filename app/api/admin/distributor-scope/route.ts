import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET ?userId=... → that distributor's current scope + the catalog to pick from.
//   scope: { mode: 'all' | 'custom', categories[], brands[], products[] }
//   catalog: { categories[], brands[], products[] }
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const [{ data: scopeRows, error: scopeErr }, { data: products, error: prodErr }] = await Promise.all([
    admin.from("distributor_scope").select("scope_type, category, brand, product_id").eq("user_id", userId),
    admin.from("products").select("id, name, breadcrumb_name, nickname, category, brand").order("category").order("name"),
  ]);
  if (scopeErr) return NextResponse.json({ error: scopeErr.message }, { status: 500 });
  if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });

  const rows = scopeRows || [];
  const mode = rows.some((r) => r.scope_type === "all") ? "all" : "custom";
  const scope = {
    mode,
    categories: rows.filter((r) => r.scope_type === "category").map((r) => r.category),
    brands: rows.filter((r) => r.scope_type === "brand").map((r) => r.brand),
    products: rows.filter((r) => r.scope_type === "product").map((r) => r.product_id),
  };

  const catalogProducts = (products || []).map((p) => ({
    id: p.id,
    label: p.breadcrumb_name || p.name || p.nickname || p.id,
    category: p.category,
    brand: p.brand,
  }));
  const categories = Array.from(new Set(catalogProducts.map((p) => p.category).filter(Boolean))).sort();
  const brands = Array.from(new Set(catalogProducts.map((p) => p.brand).filter(Boolean))).sort();

  return NextResponse.json({ scope, catalog: { categories, brands, products: catalogProducts } });
}

// PUT { userId, mode, categories?, brands?, products? } → replace the scope.
// mode='all' → single 'all' grant. mode='custom' → one row per selected
// category / brand / product (deny-by-default: empty selection = sees nothing).
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const userId = body?.userId;
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  // Confirm this is actually a distributor before granting scope.
  const { data: member } = await admin.from("distributor_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not a distributor." }, { status: 400 });

  // Replace: clear existing, then insert the new set.
  const del = await admin.from("distributor_scope").delete().eq("user_id", userId);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });

  let toInsert: any[] = [];
  if (body?.mode === "all") {
    toInsert = [{ user_id: userId, scope_type: "all" }];
  } else {
    const cats = Array.isArray(body?.categories) ? body.categories : [];
    const brands = Array.isArray(body?.brands) ? body.brands : [];
    const products = Array.isArray(body?.products) ? body.products : [];
    toInsert = [
      ...cats.map((c: string) => ({ user_id: userId, scope_type: "category", category: c })),
      ...brands.map((b: string) => ({ user_id: userId, scope_type: "brand", brand: b })),
      ...products.map((id: string) => ({ user_id: userId, scope_type: "product", product_id: id })),
    ];
  }

  if (toInsert.length) {
    const ins = await admin.from("distributor_scope").insert(toInsert);
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, granted: toInsert.length });
}
