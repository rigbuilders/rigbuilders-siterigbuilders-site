# Environment variables — required by the code

This is the authoritative list, extracted from every `process.env.*` reference in
the repo (plus `prisma/schema.prisma`). Compare it against your Vercel list.

## 🔒 Server-only secrets — must exist, mark **Sensitive**, rotate the leaked ones
| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | payment routes, adminAuth, sync-prices, supabaseAdmin | Full DB access — most sensitive key you have |
| `RAZORPAY_KEY_SECRET` | payment create/verify (signature) | Live payment secret |
| `RAZORPAY_KEY_ID` | payment/create | Server key id (falls back to the public one) |
| `RESEND_API_KEY` | order email, forgot-password | |
| `GOOGLE_PLACES_API_KEY` | /api/reviews | Restrict by IP/referrer in Google Cloud |
| `SYNC_SECRET_KEY` | /api/admin/sync-prices | Guards bulk price updates — use a long random value |
| `POSTGRES_PRISMA_URL` | Prisma (blog) — `schema.prisma` | ⚠️ see note below |
| `POSTGRES_URL_NON_POOLING` | Prisma migrations — `schema.prisma` | ⚠️ see note below |

## 🌐 Public (`NEXT_PUBLIC_*`) — safe to expose, shipped in the browser bundle
| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase client + all admin clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase client, BlogInteractions |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | checkout, CheckoutButton, payment/verify |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID` | /api/reviews |
| `NEXT_PUBLIC_SITE_URL` | forgot-password reset link — **currently missing → falls back to `http://localhost:3000`** |

## ⚙️ Optional
| Variable | Used by | Default if unset |
|---|---|---|
| `ADMIN_EMAILS` | lib/adminAuth | `rigbuilders123@gmail.com` |

## 🤖 Chatbot (WhatsApp / Instagram / Messenger auto-replies)
Server-only, used by `lib/chatbot/*` and `app/api/webhook/[channel]/route.ts`. Each is
independently optional — a missing one just disables that provider/channel, never crashes
the route. You need at least one of Gemini/Together for replies to work at all, and
`META_VERIFY_TOKEN` + a channel's own token for that channel's webhook to work.
| Variable | Used by | Default if unset |
|---|---|---|
| `GEMINI_API_KEY` | llm/providers/gemini | disables Gemini |
| `GEMINI_MODEL` | llm/providers/gemini | `gemini-2.5-flash-lite` |
| `TOGETHER_API_KEY` | llm/providers/together | disables Together |
| `TOGETHER_MODEL` | llm/providers/together | `meta-llama/Llama-3.3-70B-Instruct-Turbo-Free` |
| `META_VERIFY_TOKEN` | webhook GET handshake, all 3 adapters | disables all 3 channels |
| `WA_PHONE_ID` | adapters/whatsapp | disables WhatsApp |
| `WHATSAPP_ACCESS_TOKEN` | adapters/whatsapp | disables WhatsApp |
| `INSTAGRAM_ACCESS_TOKEN` | adapters/instagram | disables Instagram |
| `INSTAGRAM_BUSINESS_ID` | adapters/instagram | falls back to `/me/messages` endpoint |
| `MESSENGER_ACCESS_TOKEN` | adapters/messenger | disables Messenger |
| `META_GRAPH_API_VERSION` | adapters/meta-graph-client | `v21.0` |

This feature reuses `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` above (via
`lib/supabaseAdmin.ts`) — no separate Supabase credentials needed. It writes to three new
tables (`chatbot_users`, `chatbot_conversations`, `chatbot_messages`) in the same project.

---

## ⚠️ Important mismatch to check
The Prisma schema reads **`POSTGRES_PRISMA_URL`** and **`POSTGRES_URL_NON_POOLING`**,
NOT `DATABASE_URL`. Your Vercel screenshot shows `DATABASE_URL`. If the two
`POSTGRES_*` names aren't also present, the **blog (Prisma) will fail in production**.
The Vercel/Neon integration usually creates all three — confirm the two `POSTGRES_*`
names exist, or update `schema.prisma` to use `DATABASE_URL`.

## Likely NOT yet in Vercel (verify — they weren't visible in the screenshot)
- `GOOGLE_PLACES_API_KEY` + `NEXT_PUBLIC_GOOGLE_PLACE_ID` (reviews break without them)
- `NEXT_PUBLIC_SITE_URL` (password-reset links point to localhost without it)
- `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` (blog breaks without them)
- `ADMIN_EMAILS` (optional)

---

## How to confirm — fastest method (Vercel CLI)
```bash
npm i -g vercel
vercel login
vercel link          # link this folder to the project
vercel env ls        # lists every variable + which environments it's set in
```
To diff against what the code needs, pull them into a file and eyeball:
```bash
vercel env pull .env.vercel.check   # downloads current values for the linked env
```
Then make sure every name in the tables above appears. (Delete `.env.vercel.check`
after — it contains secrets and must not be committed.)

## How to confirm — in the dashboard
- Use the **search box** to look up each name from the tables above one by one.
- Check each is set for the right **Environments** (Production, Preview, and
  Development if you run `vercel dev`).
- The **"Needs Attention"** badge = Vercel noticed a secret stored in plaintext.
  For each: **rotate at the source**, paste the new value, tick **Sensitive**
  (so it can't be read back in the UI), and only tick *"I've revoked the old
  value"* AFTER you've actually revoked it at Razorpay/Supabase/etc.
