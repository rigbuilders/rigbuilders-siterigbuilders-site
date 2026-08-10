# Bluedart shipping + live order tracking — build plan

Goal: dispatch straight from Docs & Dispatch (auto AWB + label + pickup), and have the
customer dashboard advance itself (Dispatched → In transit → Out for delivery → Delivered)
with **no manual clicks** after handoff. The dashboard is already Supabase-Realtime driven,
so the work is mostly about **who writes the status** and adding a proper timeline.

---

## 1. Canonical status vocabulary

One lowercase `status` field on `orders` drives everything (dashboard + ops filters).
Migrate today's mixed values (`paid`, `pending`, `shipped`) onto this set:

| status | meaning | who sets it | progress % |
|---|---|---|---|
| `processing` | paid/confirmed, in pipeline | checkout / ops | 20 |
| `procurement` | parts being sourced | Procurement page | 40 |
| `assembly` | building / QC | Build Station | 55 |
| `ready_to_ship` | built, QC done, **packed** | Build Station | 70 |
| `dispatched` | waybill made, handed to courier | Dispatch / cron | 80 |
| `in_transit` | moving | tracking sync | 88 |
| `out_for_delivery` | on the vehicle | tracking sync | 95 |
| `delivered` | done | tracking sync | 100 |
| `cancelled` | cancelled | admin/customer | — |
| `rto` | return to origin | tracking sync | — |

`getProgressWidth()` in the dashboard gets extended to this exact map.

---

## 2. Database changes

### 2a. New columns on `public.orders`
```
carrier                 text default 'bluedart'
awb_number              text            -- Bluedart tracking number
label_url               text            -- shipping label PDF
pickup_token            text            -- Bluedart pickup confirmation
pickup_date             date
scheduled_dispatch_date date            -- for "ship on X"
packed_weight_kg        numeric         -- captured at build/pack
box_dimensions          jsonb           -- { l, w, h, boxes }
tracking_last_synced    timestamptz
delivered_at            timestamptz
```

### 2b. New table `public.order_events` (append-only timeline)
```
id          uuid primary key default gen_random_uuid()
order_id    uuid references orders(id) on delete cascade
status      text            -- the stage this event represents
note        text            -- "Picked up from Bathinda hub", etc.
source      text            -- 'admin' | 'bluedart' | 'system'
created_at  timestamptz default now()
```
Every status change (admin action **and** tracking scan) inserts a row. The dashboard
renders the timeline from this — real timestamps, not just a % bar.

RLS: customer can `select` their own order's events (join on order_id → orders.user_id);
writes are service-role only (server routes / cron).

---

## 3. Phased build

### Phase 0 — Foundations (no Bluedart yet)
- Run the SQL above (columns + `order_events` + RLS).
- Standardise the status vocabulary; backfill existing orders.
- Make every ops action (procurement/build/dispatch) also insert an `order_events` row.
- Dashboard: extend the progress map + render the timeline from `order_events`.
- **Value on its own:** customers get a real, live status timeline immediately, still admin-driven.

### Phase 1 — Capture packing data (Build Station)
- At "Finish Build", add inputs for **packed weight (kg)** and **box dimensions** (and piece count).
- Set `ready_to_ship`, write an event. Weight/dims are required by the waybill later.

### Phase 2 — Waybill + pickup on Dispatch (the core)
- Add Bluedart env vars (server-only).
- New server routes (hold credentials, never hit from the browser):
  - `POST /api/shipping/serviceability` — pincode check (also usable at checkout).
  - `POST /api/shipping/waybill` — generate AWB + label PDF for an order.
  - `POST /api/shipping/pickup` — register/append to a pickup for a date.
- Docs & Dispatch: replace the manual tracking prompt with **Dispatch now** and **Schedule date**.
  On dispatch: waybill → pickup → store `awb_number`/`label_url` → `status = dispatched` →
  event → notify customer. **Keep manual AWB entry as a fallback.**
- **COD is critical here:** a COD order's waybill must declare the **balance due** so Bluedart
  collects cash on delivery and remits it. Pass `pending_amount` into the waybill for COD/partial-COD.

### Phase 3 — Scheduled batch dispatch (cron)
- Daily scheduled task, before Bluedart's pickup cutoff:
  find `ready_to_ship` orders with `scheduled_dispatch_date = today` → waybill each →
  **one batched pickup** for the lot → `dispatched` + events + notifications.
- Delays are free: an order with no dispatch date just waits in the Ready queue; the AWB is
  only created when it actually ships, so tracking never goes stale.

### Phase 4 — Tracking sync (cron) — ends the "manual clicks" problem
- Periodic task (e.g., every 3–6h): for orders in `dispatched`/`in_transit`/`out_for_delivery`,
  call Bluedart tracking, map their scan codes → our statuses, update `status`, append events,
  set `delivered_at`, and notify on transitions. This is the automated writer; the dashboard
  (already subscribed to Realtime) advances on its own.

### Phase 5 — Dashboard polish + notifications
- Show **AWB + "Track shipment" link** once dispatched; render the `order_events` timeline.
- Notify on `dispatched` / `out_for_delivery` / `delivered` via Resend email + WhatsApp
  (reuse the existing chatbot/Meta infra — no new provider needed).
- Dashboard keeps reading the **DB only** (credentials stay server-side; no per-visitor Bluedart calls).

---

## 4. Admin pages touched
- **Build Station** (`admin/ops/builds`): packing inputs at finish; write events.
- **Docs & Dispatch** (`admin/ops/documents`): Dispatch-now / Schedule buttons, label print,
  AWB display, pickup status; manual fallback retained.
- (Optional) a small **Dispatch board**: Ready → Scheduled → Dispatched → In transit → Delivered columns.

## 5. Customer dashboard touched
- `getProgressWidth` → new status map.
- New timeline component reading `order_events` + AWB/track link.
- Realtime plumbing: **unchanged** (already live).

---

## 6. Env vars (Phase 2+, server-only, add to Vercel + `.env.local`)
Exact set depends on API flavour, but expect:
```
BLUEDART_API_BASE          # REST base URL, or SOAP WSDL endpoint
BLUEDART_LICENSE_KEY
BLUEDART_LOGIN_ID
BLUEDART_ORIGIN_AREA       # your hub area code (Bathinda)
BLUEDART_CUSTOMER_CODE     # your account/customer code
BLUEDART_PRODUCT_CODE      # service, e.g. Apex / Surface
BLUEDART_SUB_PRODUCT_CODE  # e.g. COD vs Prepaid variant
```
Reuses existing `SUPABASE_SERVICE_ROLE_KEY` + Resend for the cron/notify pieces.

---

## 7. Decisions to confirm before Phase 2
1. **API flavour: SOAP/XML or REST/JSON?** Biggest factor in effort — the waybill/pickup code differs a lot.
2. **Service level** you ship on (Apex / Surface / Ground), and the COD sub-product code.
3. **COD remittance:** confirm Bluedart collects the `pending_amount` and how they report it back
   (so we can reconcile COD orders as paid once remitted).
4. **Multi-box** PCs — waybill piece count / per-box weight.
5. **RTO/returns** — do you want the sync to flag return-to-origin and reopen the order?
6. **Scheduling from day one, or manual "dispatch now" first?** (Phase 3 can come later.)

## Suggested order to actually build
Phase 0 (timeline + status) → 1 (packing) → 2 (dispatch + waybill, manual trigger) →
4 (tracking sync) → 5 (dashboard + notifications) → 3 (scheduled batch, once the manual path is proven).
Phases 0, 1, 5-timeline give visible value even before Bluedart is wired.
