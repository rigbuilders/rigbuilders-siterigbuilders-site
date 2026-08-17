# Chatbot eval harness

Generates a wide-coverage test suite for the chatbot from the real product
catalog, runs it against the live pipeline, and automatically flags checkable
problems (wrong/hallucinated products, bad build math, broken formatting
rules, errors, slow responses). Built because I don't have shell/network
access to your machine from where I'm running — you run these three scripts
locally, then share `report.md` (or paste bits of it) back for me to fix.

Model under test: whatever `OLLAMA_MODEL` is set to in `.env.local` —
currently `ornith:9b` (swapped from the smaller `qwen3.5:2b-q4_K_M` used for
the earlier plumbing tests, specifically so this eval reflects realistic
answer quality). The chat widget UI itself is disabled right now (see
`docs/CHATBOT_TOGGLE.md`) but that doesn't matter here — this harness talks
straight to `/api/chatbot/website`, the same endpoint the widget calls.

## One-time setup

```bash
ollama pull ornith:9b
ollama serve            # if not already running
npm run dev              # in the rigbuilders-site project, another terminal
```

No new npm packages needed — everything here is plain Node (`.mjs`) plus
`@supabase/supabase-js`, which is already a project dependency.

## Running the full pipeline

From the project root (`rigbuilders-site`):

```bash
# 1. Generate test cases from the real catalog (test-cases.json)
node scripts/chatbot-eval/generate-test-cases.mjs

# 2. Run them against your local dev server (results.jsonl)
node scripts/chatbot-eval/run-tests.mjs

# 3. Analyze the results (report.json + report.md)
node scripts/chatbot-eval/analyze-results.mjs
```

Then open `scripts/chatbot-eval/report.md`.

### Recommended: smoke-test first

A full run can be large (every published product gets exercised) and a 9B
local model is slow — don't discover a bug in the harness itself after a
6-hour run. Do a small pass first:

```bash
node scripts/chatbot-eval/generate-test-cases.mjs --sample=3
node scripts/chatbot-eval/run-tests.mjs --limit=40
node scripts/chatbot-eval/analyze-results.mjs
```

Once that looks sane, regenerate the full set (`generate-test-cases.mjs`
with no `--sample`) and do the full run.

### Useful flags

**`run-tests.mjs`** — `--concurrency=N` (default 3; how many test cases run
in parallel — turns within one multi-turn case always run sequentially),
`--limit=N` / `--offset=N` (slice which cases run), `--group=name` (only run
cases in one group, e.g. `--group=build` or `--group=catalog`), `--resume`
(continue an interrupted run instead of starting over — skips case ids
already present in the output file).

Since a full run can take a while, it's fine to run it in slices, e.g.:

```bash
node scripts/chatbot-eval/run-tests.mjs --group=catalog
node scripts/chatbot-eval/run-tests.mjs --group=build --resume
node scripts/chatbot-eval/run-tests.mjs --group=policy --resume
node scripts/chatbot-eval/run-tests.mjs --group=edge --resume
```

(Use `--resume` from the second command onward so each new group's results
get appended instead of wiping the file.)

**`analyze-results.mjs`** — `--slow-ms=N` (latency threshold for the "slow"
flag, default 20000).

## What gets generated

| Group | What it covers | Auto-graded against |
|---|---|---|
| `catalog-listing` | "Do you have any X?" per category | expected product ids (cheapest 8, matching how `findRelevantProducts` actually orders/caps results) |
| `catalog-brand` | Category + brand combos | same |
| `catalog-price` | Cheapest / under-₹X questions | same |
| `product-price` / `product-stock` / `product-info` / `product-spec` | 2 phrasings each, per real product | real price/stock/category/spec from the DB |
| `product-general` | "Is this a good option?" / warranty questions, per product | not auto-gradable — manual skim |
| `build-oneshot` | Every combination of budget × phrasing × template, all 4 use cases × 9 budgets × 3 phrasings × 3 templates | quote math, part compatibility, budget/power flags |
| `build-needsinfo` | Missing budget, missing use case, or missing both | should NOT get a quote — should ask a follow-up instead |
| `build-multiturn` | Use case in turn 1, budget in turn 2 | same as build-oneshot |
| `policy` | Shipping, warranty, COD, returns, contact, etc. | not auto-gradable — manual skim in the report |
| `edge` | Empty input, gibberish, Hindi/Punjabi, prompt injection, off-topic, shouting, very long input, etc. | not auto-gradable — manual skim |
| `formatting` | Explicit attempts to get markdown/emoji out of it | auto-checked (this group's name overlaps with the `formatting` *issue type* below — different things, see report) |

Exact case count depends on how big the catalog is — the generator prints a
per-group breakdown when it runs. With a catalog of a couple hundred products
this comfortably lands in the low thousands (product-level questions alone
are ~9 per product); a small catalog will land lower — if the printed total
looks too low, raise `--sample` or add more phrasing templates to the
generator script, same pattern as what's already there.

## Troubleshooting: "N/N done" finished suspiciously fast

`run-tests.mjs` now sends one real question before starting the batch
(skip with `--skip-preflight`) specifically to catch this: if the whole run
finishes in seconds instead of the minutes/hours a 9B local model actually
takes, it's almost never "the model is just fast" — it means every case hit
the same server-side failure. `website-stream.ts` catches Ollama/LLM errors
and returns a normal 200 response with a canned sentence like *"Sorry, I
couldn't reach the local test model..."* — which looks like a fast, valid
answer to the runner unless you actually read it.

If the preflight check didn't catch it (e.g. you used `--skip-preflight`, or
Ollama was working at the start but died partway through), `analyze-results.mjs`
now also flags every reply that exactly matches one of these canned
fallbacks as `pipelineFallback`, and prints a loud warning if more than 20%
of the run hit it. Check `ollama serve` is running and `ollama pull ornith:9b`
actually completed, confirm with `curl http://localhost:11434/api/tags`, then
re-run.

## What "LLM errors will be ignored" means in this report

This harness does **not** grade writing quality, tone, or word choice — there's
no ground truth for "is this a good sentence." It only flags things that are
actually checkable:

- **formatting** — reply contains markdown syntax or emoji (the system
  prompt has a hard rule against both).
- **errors** — the request failed, or came back empty. Note: the two empty
  string / whitespace-only edge cases are *expected* to show up here (the API
  correctly rejects them with a 400) — that's not a bug, ignore those two.
- **pipelineFallback** — got one of the canned "something went wrong" sentences
  instead of a real answer (see Troubleshooting above). This means the
  pipeline was broken for that case, not that the model answered badly —
  fix the pipeline and re-run rather than treating these as content bugs.
- **slow** — took longer than the threshold to respond.
- **catalogMismatch** — a returned product card doesn't match the real DB
  (wrong category/brand, stale price/stock, an id that doesn't exist at all),
  or the set of cards returned for a listing/brand question doesn't match
  what should've come back.
- **buildMismatch** — quote total doesn't add up, the power-sufficiency or
  within-budget flags are wrong given the numbers, a quoted part doesn't
  match the real DB, or two quoted parts aren't actually compatible (CPU/mobo
  socket, mobo/RAM memory type, GPU length vs. cabinet clearance).
- **brokenProductLink** — a product id shown on a card (or a build-quote line
  item — both are clickable to `/product/{id}` in the real widget) doesn't
  resolve to a real page. Checked with a plain HTTP request to
  `--base` + `/product/{id}` (default `http://localhost:3000`), deduped
  across the whole run so the same id isn't re-fetched every time it shows
  up. This is the closest thing to "is the card clickable and working" this
  harness can check without driving an actual browser — it confirms the
  destination is real, not that the click handler/CSS/z-index etc. work
  correctly in the widget itself. Skip with `--skip-links`.
- **brokenImage** — same idea, for each card's image URL.

Everything under `manualReview` in the report (policy/edge/formatting-stress
cases) has no ground truth to check — that's meant for a human to skim, not
something this script judges pass/fail on.

## Heads up: this creates real data

Every test case is a real conversation through the real pipeline — it
persists to Supabase (`users`/`conversations`/`messages`) exactly like a real
visitor chatting on the site, and shows up in `/admin/chatbot`. Every
synthetic visitor id is prefixed `eval-<timestamp>-...` specifically so
you can find and bulk-delete this test data afterward if you want it out of
the admin inbox — e.g. in Supabase:

```sql
-- chatbot_users has no plain "external id" column — the visitor id lives
-- inside the channel_identities JSONB blob (e.g. {"website": "eval-..."}),
-- so this matches on that as text. Double-check with a SELECT first.
delete from chatbot_messages where conversation_id in (
  select c.id from chatbot_conversations c
  join chatbot_users u on u.id = c.user_id
  where c.channel = 'website' and u.channel_identities::text like '%eval-%'
);
delete from chatbot_conversations where channel = 'website' and user_id in (
  select id from chatbot_users where channel_identities::text like '%eval-%'
);
delete from chatbot_users where channel_identities::text like '%eval-%';
```

(Table/column names above — `chatbot_users`, `chatbot_conversations`,
`chatbot_messages`, `channel_identities` — match `lib/chatbot/conversation-store.ts`
as of this writing; double-check with a `select` before running any `delete`.)

## After you run it

Share `scripts/chatbot-eval/report.md` back (or paste the summary tables and
a few flagged issues) and I'll go through the flagged items and fix the
underlying bugs — same as the fixes already made this session for card
completeness, category-spec leakage, formatting leakage, etc. If a whole
category of issue shows up a lot (e.g. every build quote for `workstation`
flags a socket mismatch), that's usually one root cause, not N separate bugs.
