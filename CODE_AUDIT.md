# Rig Builders Site — Code Audit

Next.js 16 / React 19 e-commerce app (Prisma + Neon Postgres for auth/blog, Supabase for orders, Razorpay for payments). This audit lists flaws found by severity. The critical items are exploitable by anyone with a browser and should be fixed before this handles real money.

---

## 🔴 Critical (fix before taking real orders)

### 1. Prices are set by the client — order total can be forged
`app/checkout/page.tsx` computes the total in the browser and POSTs it to the server, which trusts it verbatim.

- `POST /api/payment/create` receives `{ amount }` from the client and creates the Razorpay order for exactly that amount (`route.ts:13`). A user can open dev tools and pay ₹1 for a ₹150,000 build.
- `POST /api/payment/verify` saves `total_amount: totalAmount` straight from the request body (`route.ts:145`). The cart itself lives in `localStorage` (`CartContext.tsx:32-39`) where `price` is freely editable.
- The Razorpay signature check (`verify/route.ts:73-80`) only proves the payment ID matches the order ID — it does **not** prove the amount equals the value of the goods.

**Fix:** never trust client prices. On the server, look up each cart item's price from the database, recompute subtotal + tax + shipping − validated coupon, and use that server-computed figure both to create the Razorpay order and to store `total_amount`. Reject if the client figure disagrees.

### 2. Passwords stored and compared in plaintext
`app/api/auth/signup/route.ts:31` writes `password` to the DB as-is. `app/api/auth/login/route.ts:19` does `user.password !== password`. No hashing anywhere.

**Fix:** hash with bcrypt/argon2 on signup, compare hashes on login. Also note there is **no rate limiting** on login, so credential stuffing is unimpeded.

### 3. Two separate, inconsistent auth systems
Signup/login use **Prisma** (`user` table, plaintext). Forgot-password, checkout, and every admin page use **Supabase Auth**. A user who registers via `/api/auth/signup` does not exist in Supabase, so:
- Forgot-password (`api/auth/forgot-password/route.ts`) will never find them.
- They can't check out as a logged-in user or see admin.

This is an architectural split that will silently break account flows. Pick one system (Supabase Auth is already doing the heavy lifting) and delete the other.

### 4. Blog API is completely unauthenticated → stored XSS
`app/api/blog/create/route.ts` has a literal comment `// --- SECURITY CHECK REMOVED ---` (line 20). Anyone can POST a published post. `manage/route.ts` (PUT/DELETE) has no auth either — anyone can edit or delete any post.

Worse, `app/blog/[slug]/page.tsx:149` renders `post.content` with `dangerouslySetInnerHTML`. Unauthenticated post creation + raw HTML rendering = **stored XSS**: an attacker can inject `<script>` that runs for every visitor (session theft, defacement, etc.).

**Fix:** require server-side admin auth on all blog write routes, and sanitize `content` (e.g. DOMPurify / a server-side sanitizer) before storing or rendering.

### 5. Admin access is enforced only in the browser
Every admin page (`app/admin/**`) is a `"use client"` component that checks `user.email === "rigbuilders123@gmail.com"` and calls `router.push("/")` otherwise (e.g. `admin/page.tsx:31`, `admin/orders/page.tsx:20`). This is cosmetic — it hides the UI but does not protect data. All admin reads/writes go through the **anon** Supabase client (`lib/supabaseClient.ts`), so the real gate is Supabase Row Level Security.

**Action required:** verify RLS policies on `orders`, `orders_ops`, `users`, `user_addresses`, `products`, `counters`, `coupons`. If any allow anonymous read, all customer PII (names, phones, addresses, order history) is readable by anyone with the public anon key, which ships in the client bundle. If RLS is off/permissive, this is critical data exposure.

### 6. Live production secrets sit in the working tree
`.env` and `.env.local` contain **live** credentials: a `rzp_live_` Razorpay key **and its secret**, the Supabase **service-role** key, a Neon Postgres connection string with password, Resend and Google API keys. `.gitignore` does exclude `.env*` (good), but:
- These live keys are duplicated across both files and left in plaintext locally.
- If they were ever committed before the ignore rule, or shared, they're compromised.

**Fix:** treat all of these as leaked and **rotate them now** (Razorpay, Supabase service role, Neon password, Resend, Google). Keep only `.env.local`, remove `.env`, and never expose the service-role key anywhere client-reachable.

---

## 🟠 High

### 7. Weak sync secret
`SYNC_SECRET_KEY="my-secret-password-123"` guards `POST /api/admin/sync-prices`, which can rewrite every product's price and stock. Guessable/bruteforceable. Use a long random secret and, ideally, real admin auth.

### 8. Order-ID / invoice-number generation has a race condition
`lib/id-generator.ts` does read-then-write on the `counters` table (`select` current value, then `update`). Two concurrent orders can read the same value and produce **duplicate order IDs / invoice numbers** — a compliance problem for GST invoices. Use an atomic DB increment (Postgres `UPDATE ... RETURNING`, a sequence, or a Supabase RPC).

### 9. Guest checkout creates accounts with weak, unrecoverable passwords
`verify/route.ts:105` sets `Math.random().toString(36).slice(-8) + "Rig!23"`. `Math.random()` isn't cryptographically secure and the `"Rig!23"` suffix is constant, so every auto-created account shares a predictable password pattern. The user is never told the password and can only recover via reset. Prefer creating the user without a password and forcing a set-password/magic-link flow.

---

## 🟡 Medium

### 10. Duplicate desktop/mobile route trees
There's a full parallel `app/m/**` tree (`m/signin`, `m/signup`, `m/dashboard`, `m/product/[id]`, `m/[series]/[tier]`, etc.) mirroring the desktop routes. Two copies of the same logic will drift out of sync (a fix applied to one gets missed on the other) and roughly doubles maintenance. Prefer one responsive route set, or share logic via common components/hooks.

### 11. Debug logging left in production paths
Heavy `console.log` throughout the API routes, including `console.log("Login Request for:", email)` (login), full Google reviews payloads (`api/reviews/route.ts:23`), and emoji-tagged order/DB traces. This leaks PII into server logs and adds noise. Strip or gate behind a debug flag.

### 12. Error messages leak internals to the client
Signup returns `error.message` from raw DB/Prisma errors (`signup/route.ts:43`); several routes do the same. This can reveal schema/driver details. Return generic messages to clients, log details server-side.

### 13. `.env.local` is malformed / duplicated
`NEXT_PUBLIC_SUPABASE_URL`, the anon key, and Razorpay vars are each defined twice. `NEXT_PUBLIC_GOOGLE_PLACE_ID` and `GOOGLE_PLACES_API_KEY` have a leading space after `=` (`= ChIJ...`, `= AIza...`) which can end up in the value and break the API call. `NEXT_PUBLIC_SITE_URL` is referenced in forgot-password but not defined, so reset links fall back to `http://localhost:3000`.

### 14. Payment key var name is inconsistent
`payment/create/route.ts` reads `RAZORPAY_KEY_ID`; `payment/verify/route.ts` reads `NEXT_PUBLIC_RAZORPAY_KEY_ID`. They happen to hold the same value today, but this is fragile — standardize on one.

### 15. `forgot-password` lists all users to find one
`api/auth/forgot-password/route.ts:23` calls `admin.listUsers()` and scans in memory. That returns only the first page (default 50), so beyond that it will report "not found" for real users, and it's O(all users) on every request. Use a targeted lookup by email.

---

## 🟢 Low / cleanup

- `next.config.ts` is empty — no image domains, security headers, or CSP configured. Adding a Content-Security-Policy would blunt the XSS in #4.
- Duplicated code/comments left in source (e.g. the doubled `ROLE-BASED UI FILTER` comment block in `admin/page.tsx:128-131`, doubled `[FIX]` comments in checkout).
- Hardcoded emails (`rigbuilders123@gmail.com`, placeholder `freelancer@gmail.com`) scattered across admin pages instead of a role column in the DB.
- `PrismaClient` is instantiated per-route-module; under serverless this can exhaust DB connections. Use a singleton.
- `jsonLd` injected via `dangerouslySetInnerHTML` (layout/product pages) is lower-risk but should still escape `<` in any DB-sourced strings to avoid `</script>` breakout.

---

## Suggested priority order
1. Server-side price recalculation (#1) — direct financial loss.
2. Rotate all leaked secrets (#6).
3. Lock down blog write routes + sanitize HTML (#4).
4. Verify/enforce Supabase RLS (#5).
5. Hash passwords + consolidate to one auth system (#2, #3).
6. Then work through High/Medium items.
