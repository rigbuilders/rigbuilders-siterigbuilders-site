#!/usr/bin/env node
/**
 * Automated grading pass over run-tests.mjs's output. Per the brief this was
 * built for — "LLM errors will be ignored" — this deliberately does NOT try
 * to judge writing quality, tone, or phrasing. It only flags things that are
 * checkable against ground truth or a hard rule:
 *
 *   - formatting   reply breaks the system prompt's no-markdown/no-emoji rule
 *   - errors       HTTP/network failure, or an empty reply
 *   - slow         turn took longer than --slow-ms (default 20s)
 *   - catalog      returned product cards vs. the real DB: hallucinated ids,
 *                  wrong category/brand, stale price, missing expected items
 *   - build        quote math (total, power-sufficiency, budget check) and
 *                  part compatibility (socket / memory type / GPU clearance)
 *                  vs. the real DB; needs_info cases that got a quote anyway
 *                  (or vice versa)
 *   - links/images  every product id a card or build-quote line item would
 *                  link to (ChatProductCard / ChatBuildQuoteCard both do
 *                  router.push(`/product/${id}`) on click) actually resolves
 *                  to a real page, and every card image URL actually loads.
 *                  This is the closest thing to "is the card clickable and
 *                  working" this harness can check without a real browser —
 *                  it confirms the destination is valid, not that the click
 *                  handler/CSS/z-index etc. work in the actual widget.
 *
 * Everything else (policy/edge/general prose) isn't auto-gradable — those
 * just get a per-case one-line dump in the report for a human skim.
 *
 * Usage:
 *   node scripts/chatbot-eval/analyze-results.mjs [--in=results.jsonl] [--slow-ms=20000] [--base=http://localhost:3000] [--skip-links]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, getAnonClient, parseArgs, isKnownFallbackReply } from "./lib/shared.mjs";

const args = parseArgs(process.argv.slice(2));
const IN_PATH = args.in ? path.resolve(args.in) : path.join(ROOT, "scripts/chatbot-eval/results.jsonl");
const SLOW_MS = args["slow-ms"] ? parseInt(args["slow-ms"], 10) : 20000;
const BASE_URL = args.base || "http://localhost:3000";
const SKIP_LINKS = Boolean(args["skip-links"]);
const REPORT_JSON = path.join(ROOT, "scripts/chatbot-eval/report.json");
const REPORT_MD = path.join(ROOT, "scripts/chatbot-eval/report.md");

// A run that was interrupted (Ctrl+C, crash, killed terminal) can leave one
// truncated/partial trailing line in the JSONL file — appendFileSync isn't
// atomic against a hard interruption mid-write. Skip anything that doesn't
// parse instead of failing the whole analysis over one bad line; every
// earlier line is still a complete, independent result.
const rawLines = readFileSync(IN_PATH, "utf8").split("\n").filter((l) => l.trim());
const results = [];
let skipped = 0;
for (const line of rawLines) {
  try {
    results.push(JSON.parse(line));
  } catch {
    skipped += 1;
  }
}
console.log(`Loaded ${results.length} results from ${IN_PATH}${skipped > 0 ? ` (skipped ${skipped} unparseable/truncated line(s))` : ""}`);

// Fresh catalog snapshot for ground-truth cross-checks.
const supabase = getAnonClient();
const { data: products, error } = await supabase
  .from("products")
  .select("id, name, breadcrumb_name, brand, category, price, mrp, in_stock, specs")
  .eq("listing_status", "published");
if (error) {
  console.error("Failed to fetch catalog:", error.message);
  process.exit(1);
}
const byId = new Map(products.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
const issues = {
  errors: [],
  pipelineFallback: [],
  slow: [],
  formatting: [],
  catalogMismatch: [],
  buildMismatch: [],
  brokenProductLink: [],
  brokenImage: [],
};
const manualReview = []; // policy/edge/formatting-stress: not auto-gradable, dumped for a human skim

const MD_BOLD = /\*\*[^*]+\*\*/;
const MD_HEADING = /^#{1,6}\s/m;
const MD_BULLET = /^[ \t]*[-*•][ \t]/m;
const MD_NUMBERED = /^[ \t]*\d+\.[ \t]/m;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

function checkFormatting(testId, turnIndex, text) {
  const hits = [];
  if (MD_BOLD.test(text)) hits.push("markdown-bold");
  if (MD_HEADING.test(text)) hits.push("markdown-heading");
  if (MD_BULLET.test(text)) hits.push("markdown-bullet");
  if (MD_NUMBERED.test(text)) hits.push("markdown-numbered");
  if (EMOJI.test(text)) hits.push("emoji");
  if (hits.length > 0) {
    issues.formatting.push({ id: testId, turn: turnIndex, hits, snippet: text.slice(0, 200) });
  }
}

function checkCatalogCards(testId, meta, products_) {
  const returnedIds = products_.map((p) => p.id);

  for (const p of products_) {
    const real = byId.get(p.id);
    if (!real) {
      issues.catalogMismatch.push({ id: testId, type: "hallucinated-id", detail: p });
      continue;
    }
    if (meta.category && real.category !== meta.category) {
      issues.catalogMismatch.push({
        id: testId,
        type: "category-mismatch",
        detail: { cardId: p.id, expectedCategory: meta.category, actualCategory: real.category },
      });
    }
    if (meta.brand && real.brand !== meta.brand) {
      issues.catalogMismatch.push({
        id: testId,
        type: "brand-mismatch",
        detail: { cardId: p.id, expectedBrand: meta.brand, actualBrand: real.brand },
      });
    }
    if (typeof p.price === "number" && Math.round(p.price) !== Math.round(real.price)) {
      issues.catalogMismatch.push({
        id: testId,
        type: "stale-price",
        detail: { cardId: p.id, cardPrice: p.price, realPrice: real.price },
      });
    }
    if (typeof p.inStock === "boolean" && p.inStock !== (real.in_stock !== false)) {
      issues.catalogMismatch.push({
        id: testId,
        type: "stale-stock",
        detail: { cardId: p.id, cardInStock: p.inStock, realInStock: real.in_stock },
      });
    }
  }

  if (Array.isArray(meta.expectedProductIds)) {
    const expected = new Set(meta.expectedProductIds);
    const got = new Set(returnedIds);
    const missing = [...expected].filter((id) => !got.has(id));
    const extra = [...got].filter((id) => !expected.has(id));
    if (missing.length > 0 || extra.length > 0) {
      issues.catalogMismatch.push({
        id: testId,
        type: "listing-set-mismatch",
        detail: { missingCount: missing.length, missing: missing.slice(0, 10), extraCount: extra.length, extra: extra.slice(0, 10) },
      });
    }
  }
  if (meta.expectedCheapestId && !returnedIds.includes(meta.expectedCheapestId)) {
    issues.catalogMismatch.push({
      id: testId,
      type: "cheapest-not-returned",
      detail: { expectedCheapestId: meta.expectedCheapestId, returnedIds },
    });
  }
}

function checkBuildQuote(testId, meta, build) {
  if (meta.expectQuote && !build) {
    issues.buildMismatch.push({ id: testId, type: "expected-quote-got-none" });
    return;
  }
  if (!meta.expectQuote && build) {
    issues.buildMismatch.push({ id: testId, type: "unexpected-quote-for-needs-info", detail: { budget: build.budget, useCase: build.useCase } });
  }
  if (!build) return;

  const sumItems = build.items.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
  if (Math.abs(sumItems - build.totalPrice) > 1) {
    issues.buildMismatch.push({ id: testId, type: "total-price-mismatch", detail: { sumItems, totalPrice: build.totalPrice } });
  }
  const expectedPowerSufficient = build.psuWattage >= build.estimatedTDP;
  if (build.isPowerSufficient !== expectedPowerSufficient) {
    issues.buildMismatch.push({
      id: testId,
      type: "power-sufficiency-flag-wrong",
      detail: { psuWattage: build.psuWattage, estimatedTDP: build.estimatedTDP, flagged: build.isPowerSufficient },
    });
  }
  const expectedWithinBudget = build.totalPrice <= build.budget * 1.05;
  if (build.withinBudget !== expectedWithinBudget) {
    issues.buildMismatch.push({
      id: testId,
      type: "within-budget-flag-wrong",
      detail: { totalPrice: build.totalPrice, budget: build.budget, flagged: build.withinBudget },
    });
  }

  const byCategory = {};
  for (const item of build.items) {
    const real = byId.get(item.id);
    if (!real) {
      issues.buildMismatch.push({ id: testId, type: "hallucinated-part", detail: item });
      continue;
    }
    if (Math.round(item.price) !== Math.round(real.price)) {
      issues.buildMismatch.push({ id: testId, type: "stale-part-price", detail: { itemId: item.id, quotedPrice: item.price, realPrice: real.price } });
    }
    byCategory[item.category] = real;
  }

  const cpu = byCategory.cpu?.specs;
  const mobo = byCategory.motherboard?.specs;
  if (cpu?.socket && mobo?.socket && cpu.socket !== mobo.socket) {
    issues.buildMismatch.push({ id: testId, type: "socket-mismatch", detail: { cpuSocket: cpu.socket, moboSocket: mobo.socket } });
  }
  const ram = byCategory.ram?.specs;
  if (mobo?.memory_type && ram?.memory_type && mobo.memory_type !== ram.memory_type) {
    issues.buildMismatch.push({ id: testId, type: "memory-type-mismatch", detail: { moboType: mobo.memory_type, ramType: ram.memory_type } });
  }
  const gpu = byCategory.gpu?.specs;
  const cabinet = byCategory.cabinet?.specs;
  if (gpu?.length_mm && cabinet?.max_gpu_length_mm && gpu.length_mm > cabinet.max_gpu_length_mm) {
    issues.buildMismatch.push({
      id: testId,
      type: "gpu-clearance-mismatch",
      detail: { gpuLength: gpu.length_mm, cabinetMaxLength: cabinet.max_gpu_length_mm },
    });
  }
}

// Every product id / image url any card or build-quote line item in this
// run would link to (ChatProductCard.tsx and ChatBuildQuoteCard.tsx both
// do router.push(`/product/${id}`) on click) — deduped so we don't re-fetch
// the same page/image hundreds of times across cases that surfaced it.
const linkTargets = new Map(); // id -> { seenInCase }
const imageTargets = new Map(); // url -> { seenInCase }

// ---------------------------------------------------------------------------
const groupCounts = {};
for (const r of results) {
  groupCounts[r.group] = groupCounts[r.group] ?? { total: 0, errors: 0, totalLatencyMs: 0, latencyCount: 0 };
  groupCounts[r.group].total += 1;

  r.turns.forEach((turn, i) => {
    if (!turn.ok) {
      issues.errors.push({ id: r.id, turn: i, status: turn.status, error: turn.error });
      groupCounts[r.group].errors += 1;
      return;
    }
    groupCounts[r.group].totalLatencyMs += turn.latencyMs;
    groupCounts[r.group].latencyCount += 1;
    if (turn.latencyMs > SLOW_MS) {
      issues.slow.push({ id: r.id, turn: i, latencyMs: turn.latencyMs });
    }
    if (!turn.reply || !turn.reply.trim()) {
      issues.errors.push({ id: r.id, turn: i, error: "empty reply" });
    } else {
      checkFormatting(r.id, i, turn.reply);
    }
    // A fallback reply is a normal ok:true 200 with real text, so nothing
    // above catches it — but it means the LLM call itself failed
    // server-side (Ollama unreachable/model missing/etc), not that the
    // model gave a bad answer. Surfaced separately since it needs a
    // different fix (check ollama serve / the pulled model) than anything
    // else in this report.
    if (turn.ok && isKnownFallbackReply(turn.reply)) {
      issues.pipelineFallback.push({ id: r.id, turn: i, reply: turn.reply });
    }
  });

  const lastOkTurn = [...r.turns].reverse().find((t) => t.ok);
  if (!lastOkTurn) continue;

  if (r.group.startsWith("catalog")) {
    checkCatalogCards(r.id, r.meta, lastOkTurn.products ?? []);
  }
  if (r.group.startsWith("build")) {
    checkBuildQuote(r.id, r.meta, lastOkTurn.build);
  }
  if (["policy", "edge", "formatting", "product-general"].includes(r.group)) {
    manualReview.push({ id: r.id, group: r.group, turns: r.turns.map((t) => t.message), reply: lastOkTurn.reply });
  }

  for (const p of lastOkTurn.products ?? []) {
    if (p.id && !linkTargets.has(p.id)) linkTargets.set(p.id, r.id);
    if (p.imageUrl && !imageTargets.has(p.imageUrl)) imageTargets.set(p.imageUrl, r.id);
  }
  for (const item of lastOkTurn.build?.items ?? []) {
    if (item.id && !linkTargets.has(item.id)) linkTargets.set(item.id, r.id);
    if (item.imageUrl && !imageTargets.has(item.imageUrl)) imageTargets.set(item.imageUrl, r.id);
  }
}

// ---------------------------------------------------------------------------
// Verify every card/build-item's click target and image actually resolve —
// the closest check to "is this card accurate and clickable" possible
// without driving a real browser. A bounded-concurrency pool, same pattern
// as run-tests.mjs, since this can be a few hundred/thousand unique URLs.
if (!SKIP_LINKS && (linkTargets.size > 0 || imageTargets.size > 0)) {
  console.log(`Checking ${linkTargets.size} product page links and ${imageTargets.size} card images resolve...`);

  async function checkUrl(url) {
    try {
      let res = await fetch(url, { method: "HEAD" });
      if (res.status === 405) res = await fetch(url, { method: "GET" }); // some routes don't support HEAD
      return { ok: res.ok, status: res.status };
    } catch (err) {
      return { ok: false, status: 0, error: String(err) };
    }
  }

  async function runPool(entries, onResult) {
    let cursor = 0;
    async function worker() {
      while (cursor < entries.length) {
        const [key, caseId] = entries[cursor++];
        onResult(key, caseId, await checkUrl(key));
      }
    }
    await Promise.all(Array.from({ length: 8 }, () => worker()));
  }

  await runPool([...linkTargets.entries()].map(([id, caseId]) => [`${BASE_URL}/product/${id}`, caseId]), (url, caseId, result) => {
    if (!result.ok) {
      issues.brokenProductLink.push({ id: caseId, productId: url.split("/product/")[1], url, status: result.status, error: result.error });
    }
  });

  // imageUrl may be a relative path (served by this same app) or a full
  // CDN/storage URL — normalize the relative case so fetch() has something
  // absolute to work with.
  const imageEntries = [...imageTargets.entries()].map(([url, caseId]) => [
    url.startsWith("/") ? `${BASE_URL}${url}` : url,
    caseId,
  ]);
  await runPool(imageEntries, (url, caseId, result) => {
    if (!result.ok) {
      issues.brokenImage.push({ id: caseId, url, status: result.status, error: result.error });
    }
  });
}

// ---------------------------------------------------------------------------
const summary = {
  totalCases: results.length,
  byGroup: groupCounts,
  issueCounts: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])),
};

writeFileSync(REPORT_JSON, JSON.stringify({ summary, issues, manualReview }, null, 2));

const fallbackRate = results.length ? issues.pipelineFallback.length / results.length : 0;
const md = [];
md.push(`# Chatbot eval report`, "", `Generated ${new Date().toISOString()}`, "");
if (fallbackRate > 0.2) {
  md.push(
    `> ⚠️ **${Math.round(fallbackRate * 100)}% of cases got a canned fallback reply, not a real answer** — the ` +
      `pipeline itself was failing during this run (Ollama unreachable, model not pulled, etc), not the model ` +
      `giving bad answers. Fix that and re-run before trusting anything else below. See the \`pipelineFallback\` ` +
      `section.`,
    ""
  );
}
md.push(`## Summary`, "");
md.push(`Total cases: **${summary.totalCases}**`, "");
md.push("| Group | Cases | Errors | Avg latency (ms) |", "|---|---|---|---|");
for (const [group, c] of Object.entries(groupCounts)) {
  const avg = c.latencyCount ? Math.round(c.totalLatencyMs / c.latencyCount) : 0;
  md.push(`| ${group} | ${c.total} | ${c.errors} | ${avg} |`);
}
md.push("");
md.push("| Issue type | Count |", "|---|---|");
for (const [type, count] of Object.entries(summary.issueCounts)) md.push(`| ${type} | ${count} |`);
md.push("");

for (const [key, list] of Object.entries(issues)) {
  if (list.length === 0) continue;
  md.push(`## ${key} (${list.length})`, "");
  for (const item of list.slice(0, 50)) {
    md.push("```json", JSON.stringify(item), "```");
  }
  if (list.length > 50) md.push(`_...and ${list.length - 50} more — see report.json for the full list._`);
  md.push("");
}

md.push(`## Manual review (${manualReview.length}) — policy / edge / formatting-stress cases`, "");
md.push("These aren't auto-gradable (no ground truth to check against); skim for anything obviously wrong.", "");
for (const item of manualReview.slice(0, 100)) {
  md.push(`- **[${item.group}]** ${item.turns.join(" → ")}`);
  md.push(`  > ${(item.reply || "").replace(/\n/g, " ").slice(0, 300)}`);
}
if (manualReview.length > 100) md.push(`\n_...and ${manualReview.length - 100} more — see report.json._`);

writeFileSync(REPORT_MD, md.join("\n"));

console.log(`\nDone.`);
console.log(`  ${REPORT_JSON}`);
console.log(`  ${REPORT_MD}`);
console.log("\nIssue counts:", summary.issueCounts);
if (fallbackRate > 0.2) {
  console.log(
    `\n⚠️  ${Math.round(fallbackRate * 100)}% of cases got a canned fallback reply instead of a real answer — ` +
      `the pipeline (Ollama/model) was failing during this run, not the model itself. Fix that and re-run.`
  );
}
