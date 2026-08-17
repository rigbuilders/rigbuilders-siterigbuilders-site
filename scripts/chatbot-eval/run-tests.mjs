#!/usr/bin/env node
/**
 * Runs every test case from generate-test-cases.mjs against a LIVE local
 * dev server (npm run dev) by POSTing straight to /api/chatbot/website —
 * the same endpoint the chat widget itself calls, so this exercises the
 * exact real pipeline (Ollama/Together provider, product lookup, build
 * recommender, formatting rules) with zero UI involved. Works whether or
 * not <ChatWidget> is currently mounted in app/layout.tsx.
 *
 * Prerequisites:
 *   - `npm run dev` running in another terminal (default http://localhost:3000)
 *   - `ollama serve` running, with the model in OLLAMA_MODEL (see .env.local)
 *     pulled — currently ornith:9b, i.e. `ollama pull ornith:9b`
 *
 * Usage:
 *   node scripts/chatbot-eval/run-tests.mjs [options]
 *
 *   --in=path          Input test cases file. Default: test-cases.json
 *   --out=path          Output JSONL results file. Default: results.jsonl
 *   --base=url          Server base URL. Default: http://localhost:3000
 *   --concurrency=N      How many test CASES to run in parallel (turns
 *                        within one case always run sequentially, since
 *                        later turns depend on conversation history).
 *                        Default: 3. A 9B local model is slow — don't set
 *                        this too high or you'll just queue requests up.
 *   --limit=N            Only run the first N cases (after --offset).
 *   --offset=N           Skip the first N cases.
 *   --group=name          Only run cases whose group starts with this
 *                          (e.g. --group=build, --group=catalog).
 *   --resume             Skip cases whose id already has a result line in
 *                        --out (so an interrupted run can continue).
 *   --skip-preflight     Skip the one-question sanity check that normally
 *                        runs before the batch (see preflightCheck below).
 *   --timeout-ms=N        Abort a single request if it hasn't responded in
 *                        this long (default 180000 = 3 min) — otherwise one
 *                        stuck request hangs a worker forever and the run
 *                        just looks frozen with no error and no explanation.
 *
 * NOTE on concurrency: Ollama serves ONE model, and by default processes
 * requests to it one at a time regardless of how many you fire concurrently
 * (unless you've set OLLAMA_NUM_PARALLEL) — so --concurrency mostly just
 * means "how many requests are queued waiting on Ollama" rather than actual
 * parallel inference. That's fine, but it means progress can look slower
 * than the concurrency number implies. This script now logs every request
 * as it starts and finishes (not just every 25 completions) specifically so
 * you can tell "slow but moving" apart from "actually stuck".
 *
 * Every synthetic conversation uses a visitorId prefixed "eval-" so it's
 * easy to find (and delete, if you want) in Supabase / the admin inbox
 * afterward — this WILL create real rows in users/conversations/messages,
 * same as any real visitor chatting on the site.
 */
import { readFileSync, appendFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ROOT, parseArgs, isKnownFallbackReply } from "./lib/shared.mjs";

const args = parseArgs(process.argv.slice(2));
const IN_PATH = args.in ? path.resolve(args.in) : path.join(ROOT, "scripts/chatbot-eval/test-cases.json");
const OUT_PATH = args.out ? path.resolve(args.out) : path.join(ROOT, "scripts/chatbot-eval/results.jsonl");
const BASE_URL = args.base || "http://localhost:3000";
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 3;
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;
const OFFSET = args.offset ? parseInt(args.offset, 10) : 0;
const GROUP_FILTER = args.group || null;
const RESUME = Boolean(args.resume);
const TIMEOUT_MS = args["timeout-ms"] ? parseInt(args["timeout-ms"], 10) : 180000;

if (!existsSync(IN_PATH)) {
  console.error(`No test cases file at ${IN_PATH}. Run generate-test-cases.mjs first.`);
  process.exit(1);
}
let cases = JSON.parse(readFileSync(IN_PATH, "utf8"));
if (GROUP_FILTER) cases = cases.filter((c) => c.group.startsWith(GROUP_FILTER));
cases = cases.slice(OFFSET, OFFSET + LIMIT);

const alreadyDone = new Set();
if (RESUME && existsSync(OUT_PATH)) {
  for (const line of readFileSync(OUT_PATH, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      alreadyDone.add(JSON.parse(line).id);
    } catch {
      /* ignore malformed line */
    }
  }
  cases = cases.filter((c) => !alreadyDone.has(c.id));
  console.log(`Resuming: ${alreadyDone.size} cases already done, ${cases.length} remaining.`);
} else if (!RESUME) {
  // Fresh run overwrites the output file rather than silently appending to stale data.
  writeFileSync(OUT_PATH, "");
}

console.log(`Running ${cases.length} test cases against ${BASE_URL} (concurrency=${CONCURRENCY})`);

/** Parses the {"type":"products","items":[...],"build":...}\n<text> protocol. */
function parseResponse(raw) {
  const nl = raw.indexOf("\n");
  if (nl === -1) return { header: null, text: raw };
  const headerLine = raw.slice(0, nl);
  const text = raw.slice(nl + 1);
  try {
    return { header: JSON.parse(headerLine), text };
  } catch {
    return { header: null, text: raw };
  }
}

async function runOneTurn(visitorId, message) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/api/chatbot/website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, message }),
      signal: controller.signal,
    });
    const raw = await res.text();
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { ok: false, status: res.status, error: raw, latencyMs };
    }
    const { header, text } = parseResponse(raw);
    return {
      ok: true,
      status: res.status,
      latencyMs,
      reply: text.trim(),
      products: header?.items ?? [],
      build: header?.build ?? null,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const timedOut = err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      error: timedOut ? `timed out after ${TIMEOUT_MS}ms` : String(err),
      latencyMs,
    };
  } finally {
    clearTimeout(timer);
  }
}

let inFlight = 0;
async function runCase(testCase, slot) {
  const visitorId = `eval-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const turnResults = [];
  for (const [i, message] of testCase.turns.entries()) {
    inFlight += 1;
    const preview = message.length > 70 ? message.slice(0, 70) + "…" : message;
    console.log(`  [slot ${slot}] -> ${testCase.id}${testCase.turns.length > 1 ? ` (turn ${i + 1})` : ""}: "${preview}" (${inFlight} in flight)`);
    const result = await runOneTurn(visitorId, message);
    inFlight -= 1;
    const tag = result.ok ? `${result.latencyMs}ms` : `FAILED (${result.error})`;
    console.log(`  [slot ${slot}] <- ${testCase.id} ${tag}`);
    turnResults.push({ message, ...result });
    if (!result.ok) break; // no point continuing a broken conversation
  }
  return {
    id: testCase.id,
    group: testCase.group,
    meta: testCase.meta,
    visitorId,
    turns: turnResults,
    completedAt: new Date().toISOString(),
  };
}

/**
 * One real request before committing to the full batch. A broken pipeline
 * (Ollama not running, model not pulled, no provider configured at all)
 * fails every single case identically and near-instantly — website-stream.ts
 * catches the error server-side and returns a normal 200 with a canned
 * fallback sentence, which otherwise looks indistinguishable from a fast,
 * successful run until you actually read the replies. This catches that
 * before spending the time on the other N-1 cases that would fail the same
 * way. Skip with --skip-preflight if you've already confirmed the pipeline
 * works (e.g. re-running a --group slice right after a good run).
 */
async function preflightCheck() {
  console.log("Preflight: sending one real question to check the pipeline is actually answering...");
  const probe = await runOneTurn(`eval-preflight-${Date.now()}`, "Do you have any graphics cards?");

  if (!probe.ok) {
    console.error(`\nPreflight FAILED — the server returned an error (status ${probe.status}): ${probe.error}`);
    console.error(`Check that \`npm run dev\` is actually running and reachable at ${BASE_URL}.\n`);
    process.exit(1);
  }
  if (isKnownFallbackReply(probe.reply)) {
    console.error(`\nPreflight FAILED — got a canned fallback reply instead of a real answer:\n  "${probe.reply}"`);
    console.error(
      `\nThis is website-stream.ts's own error handling kicking in — the LLM call itself is failing ` +
        `server-side. Most likely: \`ollama serve\` isn't running, or \`ollama pull ornith:9b\` hasn't been ` +
        `done. Every one of the ${cases.length} queued cases would hit this same fallback in well under a ` +
        `second each, which is almost certainly what happened if a previous run finished suspiciously fast.\n`
    );
    console.error(`Check with: curl http://localhost:11434/api/tags   (should list ornith:9b in the response)`);
    console.error(`Then re-run this script.\n`);
    process.exit(1);
  }
  if (probe.latencyMs < 500) {
    console.warn(
      `\nWarning: preflight answered in ${probe.latencyMs}ms — fast for a 9B local model. Reply was:\n` +
        `  "${probe.reply.slice(0, 200)}"\nProceeding anyway, but skim the first few results.jsonl entries ` +
        `once this starts to make sure they look like real answers.\n`
    );
  } else {
    console.log(
      `Preflight OK (${probe.latencyMs}ms). Reply: "${probe.reply.slice(0, 150)}${probe.reply.length > 150 ? "..." : ""}"\n`
    );
  }
}

if (!args["skip-preflight"] && cases.length > 0) {
  await preflightCheck();
}

// Simple bounded-concurrency pool — no dependency needed for this.
const runStart = Date.now();
let cursor = 0;
let completed = 0;
async function worker(slot) {
  while (cursor < cases.length) {
    const testCase = cases[cursor++];
    const result = await runCase(testCase, slot);
    appendFileSync(OUT_PATH, JSON.stringify(result) + "\n");
    completed += 1;
    const elapsedMin = (Date.now() - runStart) / 60000;
    const rate = elapsedMin > 0 ? (completed / elapsedMin).toFixed(1) : "?";
    const etaMin = rate > 0 ? Math.round((cases.length - completed) / rate) : "?";
    console.log(`>>> ${completed}/${cases.length} done (${rate}/min, ~${etaMin} min left)`);
  }
}

const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, (_, i) => worker(i + 1));
await Promise.all(workers);

console.log(`\nDone. Results appended to ${OUT_PATH}`);
console.log(`Next: node scripts/chatbot-eval/analyze-results.mjs`);
