# Google appearance fixes — site name + `?srsltid=` URL

Two separate problems, two separate root causes.

---

## 1. Google shows `rigbuilders.in` instead of "Rig Builders"

The purple clickable title is correct — that's your `<title>`. The grey line by the favicon is Google's **site name**, a different feature. When Google isn't confident about your brand name it falls back to the bare domain.

Your structured data and `og:site_name` were already set to "Rig Builders", so the tags weren't missing — the signals were just **weak and slightly inconsistent**, which lets Google fall back to the domain.

### What I changed in code (`app/layout.tsx`)
- Rebuilt the JSON-LD into a **single connected `@graph`**: the `WebSite` entity is now explicitly `publisher`-linked to the `Organization` (via `@id`), plus a `SearchAction`. This is the shape Google reads with the highest confidence for site names.
- Set `og:title` to match the `<title>` (was "Rig Builders India" — a conflicting signal).
- Added `applicationName: "Rig Builders"` and made the title template `%s | Rig Builders` (was "... | Rig Builders India").

### What still limits confidence (optional, needs a design touch)
Google also weighs the homepage `<h1>` and visible text near the logo. Right now:
- The homepage `<h1>` is "COMMISSIONED. NOT ASSEMBLED." — no brand name in it.
- The logo is an image (alt text is "Rig Builders", which is good, but visible HTML text is a stronger signal).

If it still shows the domain after re-indexing, add a small visible "Rig Builders" wordmark next to the logo, or a brand mention in the homepage hero copy.

### After deploying — you must do this
Site names are cached by Google and update slowly. To speed it up:
1. Google **Search Console** → URL Inspection → enter `https://www.rigbuilders.in/` → **Request Indexing**.
2. Validate the markup at `https://search.google.com/test/rich-results` (paste the homepage URL) — confirm the Organization + WebSite entities are detected with name "Rig Builders".
3. Then wait — this can take days to a few weeks to reflect. There is no instant switch.

---

## 2. The `?srsltid=...` parameter on the homepage link

This is **not a bug in your site**. `srsltid` is added by **Google Merchant Center auto-tagging** (your product feed — you have `app/api/merchant-feed/route.ts`). Since ~August 2024 Google started appending it to **organic** result URLs too, not just Shopping. It's a click-time tracking tag.

### Fix (Merchant Center dashboard — I can't do this from code)
1. Go to **Google Merchant Center → Settings (gear) → Conversion settings**.
2. Find **Automatic tagging** (URL tracking) and **turn it off**.
3. New crawls will stop showing the parameter; existing ones clear over time.

Trade-off: auto-tagging feeds Shopping conversion attribution. Turning it off removes the ugly URLs but you lose that specific attribution signal. Most stores prioritise clean organic URLs; decide based on how much you rely on Shopping conversion tracking.

### Code side — already correct
Your homepage already emits a canonical of `https://www.rigbuilders.in/` (via `alternates.canonical: "/"`), which tells Google the clean URL is the real one. No code change needed. If you use any CDN/caching, make sure it **ignores `srsltid` as a cache key** so parameterized hits don't pollute the cache.

---

## Quick checklist
- [x] Code: connected JSON-LD graph + consistent brand metadata (done — deploy it).
- [ ] Merchant Center: turn off Automatic tagging (removes `srsltid`).
- [ ] Search Console: Request Indexing for the homepage.
- [ ] Rich Results Test: confirm Organization + WebSite detected.
- [ ] (Optional) Add a visible "Rig Builders" wordmark near the logo / in the hero.
- [ ] Wait for Google to reprocess (days–weeks).
