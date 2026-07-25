# Security Fixes — What I changed & what you must do

## ✅ Code changes made (critical fixes)

### 1. Price tampering closed
- New `lib/pricing.ts` recomputes the cart subtotal, shipping, coupon discount and total **on the server** from the `products` table and the `validate_coupon` DB function. Client prices are never trusted.
- `app/api/payment/create/route.ts` now takes the **cart** (not an amount) and creates the Razorpay order for the server-computed amount. The `₹1-for-a-₹150k-build` exploit is gone.
- `app/api/payment/verify/route.ts` recomputes the total server-side, stores that value, and derives `amount_paid` / `pending_amount` itself. If any item's price can't be verified against the DB, the order is **rejected**.
- `app/checkout/page.tsx` updated to send `cartItems` + `couponCode` instead of a price.

### 2. Passwords hashed
- New `lib/password.ts` (Node `scrypt`, no new dependency).
- `signup` hashes; `login` verifies and **transparently upgrades** any existing plaintext password to a hash on the next successful login. No data migration needed.

### 3. Blog locked down (was unauthenticated → stored XSS)
- New `lib/adminAuth.ts` validates the caller's Supabase token and checks the admin email.
- `api/blog/create` and `api/blog/manage` (GET/PUT/DELETE) now require admin auth.
- New `lib/sanitizeHtml.ts` strips `<script>`, event handlers and `javascript:`/`data:` URLs; applied on save **and** on render (`blog/[slug]`), so old posts are covered too.
- `app/admin/blog/page.tsx` now sends its token and guards the page.

---

## 🔴 You must do these (I can't from code)

### A. Rotate every secret — treat all as leaked
The live keys are sitting in `.env` / `.env.local`. Rotate now:
- **Razorpay** live key + secret (dashboard → API keys → regenerate).
- **Supabase** service-role key (Project settings → API → roll). Also rotate the anon key if you can.
- **Neon** Postgres password (reset role password, update `POSTGRES_*` URLs).
- **Resend** API key.
- **Google** Places API key (and restrict it by referrer/IP).
Update Vercel/host env vars with the new values. Do **not** commit them (they're gitignored — keep it that way).

### B. Run the SQL files in Supabase
1. `security/atomic_counters.sql` — creates `increment_counter()`. **Required** now: `lib/id-generator.ts` calls it for order/invoice numbers. Run this before deploying or new orders fall back to non-sequential IDs.
2. `security/rls_policies.sql` — Row Level Security. Run **on a branch/staging DB first**, then test every flow (storefront, checkout, account, all `/admin` pages). Without RLS, the public anon key can still read all customer data. See the comments in that file — the admin email and table list may need tweaking.

### C. Confirm `validate_coupon` is `SECURITY DEFINER`
The storefront calls this function as an anonymous user. After RLS locks the `coupons` table, the function must be `SECURITY DEFINER` to still read it:
```sql
alter function public.validate_coupon(text, numeric, uuid) security definer;
```
(Adjust the argument types to match your actual function signature.)

### D. Optional env hygiene
- `.env.local` has **duplicate** keys and **leading spaces** on `NEXT_PUBLIC_GOOGLE_PLACE_ID` / `GOOGLE_PLACES_API_KEY` (`= ChIJ...`). Remove the dupes and the spaces.
- Add `NEXT_PUBLIC_SITE_URL=https://www.rigbuilders.in` (used by forgot-password; currently falls back to localhost).
- Optionally set `ADMIN_EMAILS=rigbuilders123@gmail.com,freelancer@realdomain.com` — `lib/adminAuth.ts` reads it.

---

## ✅ Second round — now done in code

- **Auth consolidated**: `/signin` and `/signup` (desktop + mobile) already use Supabase Auth. The unused Prisma `/api/auth/login` and `/api/auth/signup` routes were the duplicate system — they now return **410 Gone**, removing that surface. Login rate-limiting is handled by Supabase's built-in protection. (You can later delete those two route files plus the unused `User`/`Order` models in `prisma/schema.prisma`; `lib/password.ts` is now unused too.)
- **Comment deletion secured**: `DELETE /api/blog/interact` now requires an admin token; the admin blog UI sends it.
- **ID race condition fixed**: `lib/id-generator.ts` now uses the atomic `increment_counter()` RPC (run `security/atomic_counters.sql`).
- **Security headers added**: `next.config.ts` now sends HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every route. A tested-and-commented **CSP template** is included there — enable it (report-only first) for defense-in-depth against XSS.

## 🟠 Still open (lower priority / your call)

- **Enable the CSP** in `next.config.ts` after testing (currently commented out to avoid breaking Razorpay/Supabase/video).
- **Guest checkout passwords** (`api/payment/verify`) still use `Math.random()` + a constant suffix. Prefer creating the Supabase user without a password and sending a set-password/magic link.
- **Delete dead code**: the disabled Prisma auth routes, `lib/password.ts`, and unused Prisma `User`/`Order` models.
