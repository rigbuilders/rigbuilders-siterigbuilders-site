import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// lib/ -> chatbot-eval/ -> scripts/ -> project root
export const ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * Minimal .env.local / .env parser so these scripts run standalone with
 * plain `node`, no extra dependency (dotenv isn't installed in this
 * project, and we don't want the eval harness to require an npm install
 * before it can even run). Only sets a key if it isn't already present in
 * process.env, so a real shell-exported env var always wins.
 */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(ROOT, file);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

/**
 * Read-only Supabase client using the PUBLIC anon key (same one shipped to
 * every browser via lib/supabaseClient.ts) — deliberately not the service
 * role key, since this only ever needs to read the same published catalog
 * an anonymous visitor can already see.
 */
export function getAnonClient() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Run this from the project root " +
        "(rigbuilders-site) so .env.local is found."
    );
  }
  return createClient(url, key);
}

export function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    const m = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) args[m[1]] = m[2] ?? true;
  }
  return args;
}

/**
 * Deliberately phrased to contain the SAME substring lib/chatbot/product-
 * knowledge.ts's CATEGORY_ALIASES looks for (e.g. "power supply" not "power
 * supplies", "mouse" not "mice") so a generated listing/brand question
 * actually routes through the app's structured category query the way it's
 * meant to — a plural-friendlier label would silently fall through to fuzzy
 * search instead, making the "expected product ids" ground truth wrong.
 * Slightly awkward English is an acceptable trade for that here.
 */
export const CATEGORY_LABELS = {
  cpu: "processor",
  gpu: "graphics card",
  motherboard: "motherboard",
  ram: "RAM",
  storage: "storage",
  psu: "power supply",
  cabinet: "cabinet",
  cooler: "cooler",
  os: "Windows license",
  monitor: "monitor",
  keyboard: "keyboard",
  mouse: "mouse",
  combo: "keyboard-mouse combo",
  mousepad: "mousepad",
  usb: "USB drive",
  prebuilt: "prebuilt PC",
};

// product-knowledge.ts's CATEGORY_ALIASES has no entry that maps to "combo"
// at all, so a natural-language listing/brand question for it can't
// reliably route through the structured category query (it'll either miss,
// or — since "combo" questions tend to mention "mouse"/"keyboard" — get
// misrouted to those categories instead). generate-test-cases.mjs skips
// listing/brand generation for anything in this set; per-product questions
// (which key off the product's actual name, not category detection) are
// unaffected and still generated normally.
export const NO_ALIAS_CATEGORIES = new Set(["combo"]);

export function labelFor(category) {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * The exact canned strings lib/chatbot/website-stream.ts falls back to when
 * something upstream failed (Ollama unreachable, model missing, no provider
 * configured, an unhandled exception, etc). These come back as a normal
 * ok:true 200 response with real (non-empty) text — from run-tests.mjs's
 * point of view that looks like a successful, fast answer, which is exactly
 * what a broken Ollama connection looks like too: every case fails the same
 * way in well under a second. Keep this in sync with website-stream.ts if
 * the wording there ever changes.
 */
export const KNOWN_FALLBACK_REPLIES = [
  "Sorry, live chat isn't configured right now. Please reach us on WhatsApp and we'll help you out.",
  "Sorry, I couldn't reach the local test model. Make sure `ollama serve` is running, then try again.",
  "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.",
  "Sorry, something went wrong on our end. Please try again in a moment, or reach us on WhatsApp.",
  "Sorry, I couldn't put a reply together — a team member will follow up shortly.",
  "Thanks for the message — a member of the Rig Builders team will reply to you right here shortly.",
];

export function isKnownFallbackReply(text) {
  const trimmed = (text ?? "").trim();
  return KNOWN_FALLBACK_REPLIES.includes(trimmed);
}
