import { NextRequest, NextResponse } from "next/server";
import { getGeminiConfig, getLlmApiConfig, getOllamaConfig } from "@/lib/chatbot/config";
import { handleWebsiteMessage } from "@/lib/chatbot/website-stream";
import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
} from "@/lib/chatbot/conversation-store";
import { isExcluded } from "@/lib/chatbot/exclusions";
import { getWatched } from "@/lib/chatbot/watchlist";
import { notifyAdminOfNewMessage } from "@/lib/chatbot/push-notify";
import { findRelevantProducts } from "@/lib/chatbot/product-knowledge";
import { detectBuildIntent } from "@/lib/chatbot/build-recommender";
import { tryHandleQuotationRequest } from "@/lib/chatbot/quotation-flow";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Runs one pipeline stage with its own hard timeout, so a single hanging
 * dependency can't take the whole diagnostic down with it (which is exactly
 * what happened the first time: the endpoint itself hit the 60s function
 * limit and returned a 504 that said nothing about *which* step was stuck).
 * Every stage reports, whatever happens.
 */
async function stage<T>(
  name: string,
  fn: () => Promise<T>,
  summarize: (value: T) => unknown,
  timeoutMs = 8000
): Promise<Record<string, unknown>> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TIMED OUT after ${timeoutMs}ms — this is the blocking step`)), timeoutMs);
      }),
    ]);
    return { stage: name, ms: Date.now() - started, ok: true, result: summarize(value) };
  } catch (err) {
    return { stage: name, ms: Date.now() - started, ok: false, error: (err as Error).message };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnostic endpoint for "the bot isn't replying and I can't tell why".
 *
 * Answers, in one request, the three questions that otherwise take three
 * rounds of guessing:
 *   1. Did the env vars actually reach this deployment's runtime?
 *   2. What URL/model did they resolve to?
 *   3. What does the LLM endpoint itself say when we call it for real?
 *
 * Open in a browser:
 *   https://www.rigbuilders.in/api/admin/chatbot/llm-health?token=<META_VERIFY_TOKEN>
 *
 * Gated on META_VERIFY_TOKEN purely because that's a secret that already
 * exists and can be pasted into a URL bar — this reports configuration
 * *presence* and upstream error text, never a key's value.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.META_VERIFY_TOKEN;
  const supplied = req.nextUrl.searchParams.get("token");
  if (!expected || supplied !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Raw presence check, independent of the config getters — this is what
  // distinguishes "the variable isn't there" from "the getter rejected it".
  const present = (name: string) => {
    const v = process.env[name];
    return v && v.trim() !== "" ? `set (${v.trim().length} chars)` : "MISSING";
  };

  const env = {
    LLM_API_KEY: present("LLM_API_KEY"),
    LLM_BASE_URL: present("LLM_BASE_URL"),
    LLM_MODEL: present("LLM_MODEL"),
    LLM_MAX_TOKENS: present("LLM_MAX_TOKENS"),
    LLM_REASONING_EFFORT: present("LLM_REASONING_EFFORT"),
    TOGETHER_API_KEY: present("TOGETHER_API_KEY"),
    GEMINI_API_KEY: present("GEMINI_API_KEY"),
    OLLAMA_BASE_URL: present("OLLAMA_BASE_URL"),
  };

  const llmConfig = getLlmApiConfig();

  const resolved = llmConfig
    ? {
        // Values here are non-secret by construction: URL, model id, label,
        // limits. The API key is reported only as a length.
        baseUrl: llmConfig.baseUrl,
        model: llmConfig.model,
        label: llmConfig.label,
        maxTokens: llmConfig.maxTokens,
        reasoningEffort: llmConfig.reasoningEffort ?? "(not sent)",
        apiKeyLength: llmConfig.apiKey.length,
        apiKeyPrefix: llmConfig.apiKey.slice(0, 3),
      }
    : null;

  const providersConfigured = {
    llmApi: Boolean(llmConfig),
    gemini: Boolean(getGeminiConfig()),
    ollama: Boolean(getOllamaConfig()),
  };

  // The actual round trip. Deliberately a real call to the real endpoint with
  // the real key — a config dump alone can look perfect while the upstream
  // rejects every request for a reason only its response body explains
  // (wrong model id, insufficient balance, unsupported parameter).
  let liveCall: Record<string, unknown> = { skipped: "no LLM provider configured" };

  if (llmConfig) {
    const started = Date.now();
    try {
      const res = await fetch(llmConfig.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
          max_tokens: llmConfig.maxTokens,
        }),
      });

      const bodyText = await res.text().catch(() => "");
      let parsed: {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
        usage?: Record<string, unknown>;
      } | null = null;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // Non-JSON response (HTML error page, gateway timeout) — the raw
        // snippet below is then the only useful signal.
      }

      liveCall = {
        httpStatus: res.status,
        ok: res.ok,
        elapsedMs: Date.now() - started,
        replyContent: parsed?.choices?.[0]?.message?.content ?? null,
        finishReason: parsed?.choices?.[0]?.finish_reason ?? null,
        usage: parsed?.usage ?? null,
        // Truncated so a long error page doesn't bury the useful part.
        rawBodySnippet: bodyText.slice(0, 600),
      };
    } catch (err) {
      liveCall = {
        networkError: (err as Error).message,
        elapsedMs: Date.now() - started,
        hint: "The request never got a response — check LLM_BASE_URL is reachable and correctly spelled.",
      };
    }
  }

  // Optional second stage: run the REAL website pipeline end to end, exactly
  // as a visitor's message would, and report what came back. A clean
  // liveCall above proves the LLM endpoint works; this proves (or disproves)
  // everything between the request arriving and the reply being produced —
  // Supabase reads/writes, exclusions, handoff detection, the quotation flow,
  // product lookup, build intent, then the provider chain.
  //
  //   ...&pipeline=1&message=do%20you%20have%20ryzen%207
  let pipeline: Record<string, unknown> = { skipped: "add &pipeline=1 to run it" };

  // Stage-by-stage mode (&stages=1). Walks the same sequence
  // handleWebsiteMessage does, but one step at a time with a per-step
  // timeout, so the output names the exact call that blocks instead of the
  // whole thing dying at the function limit.
  const stages: Record<string, unknown>[] = [];

  if (req.nextUrl.searchParams.get("stages")) {
    const message = req.nextUrl.searchParams.get("message") || "do you have ryzen 7";
    const visitorId = "health-check-visitor";

    // Held on an object rather than in `let`s so TypeScript keeps the types
    // straight across the summarise callbacks that assign them.
    const ctx: { userId?: string; conversationId?: string } = {};

    stages.push(
      await stage(
        "findOrCreateUser",
        () => findOrCreateUser("website", visitorId),
        (u) => {
          ctx.userId = u.id;
          return { id: u.id };
        }
      )
    );

    if (ctx.userId) {
      const uid = ctx.userId;
      stages.push(
        await stage(
          "findOrCreateActiveConversation",
          () => findOrCreateActiveConversation(uid, "website"),
          (c) => {
            ctx.conversationId = c.id;
            return { id: c.id, status: c.status };
          }
        )
      );
    }

    if (ctx.conversationId) {
      const convId = ctx.conversationId;

      stages.push(
        await stage("appendMessage(user)", () => appendMessage(convId, "user", message), () => "written")
      );
      stages.push(
        await stage(
          "notifyAdminOfNewMessage (web-push)",
          () =>
            notifyAdminOfNewMessage({
              channel: "website",
              externalUserId: visitorId,
              text: message,
              conversationId: convId,
            }),
          () => "returned"
        )
      );
      stages.push(
        await stage("getWatched", () => getWatched("website", visitorId), (w) => (w ? "watched" : "not watched"))
      );
      stages.push(await stage("isExcluded", () => isExcluded("website", visitorId), (e) => e));
      stages.push(
        await stage(
          "tryHandleQuotationRequest",
          () => tryHandleQuotationRequest({ channel: "website", externalUserId: visitorId, text: message, timestamp: Date.now() }, convId),
          (q) => (q ? { handled: true, text: q.text.slice(0, 120) } : "not a quotation request")
        )
      );
      stages.push(
        await stage("getRecentHistory", () => getRecentHistory(convId), (h) => ({ messages: h.length }))
      );

      // Empty history is fine here — we're testing whether the call returns
      // at all, not reproducing a specific conversation.
      const historyForIntent: Awaited<ReturnType<typeof getRecentHistory>> = [];
      stages.push(
        await stage(
          "findRelevantProducts",
          () => findRelevantProducts(message),
          (p) => ({ matched: p.length, names: p.slice(0, 5).map((x) => x.breadcrumb_name?.trim() || x.name) })
        )
      );
      stages.push(
        await stage(
          "detectBuildIntent",
          () => detectBuildIntent(message, historyForIntent),
          (b) => ({ kind: b.kind })
        )
      );
    }
  }

  // Product-lookup probe (&products=1&term=ryzen). findRelevantProducts
  // coming back empty has exactly two possible causes and they need opposite
  // fixes: the rows don't exist with that text, or they exist but aren't
  // listing_status='published' (which the lookup filters on strictly, making
  // a draft product invisible to the bot as though it weren't in the catalog
  // at all). This queries both ways and prints the difference.
  let products: Record<string, unknown> = { skipped: "add &products=1 to run it" };

  if (req.nextUrl.searchParams.get("products")) {
    const term = req.nextUrl.searchParams.get("term") || "ryzen";
    const fields = ["name", "breadcrumb_name", "configurator_name", "nickname", "brand"];
    const orFilter = fields.map((f) => `${f}.ilike.%${term}%`).join(",");

    try {
      const [total, published, matchAny, matchPublished, statuses] = await Promise.all([
        supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("listing_status", "published"),
        supabaseAdmin.from("products").select("id, name, breadcrumb_name, brand, listing_status").or(orFilter).limit(10),
        supabaseAdmin
          .from("products")
          .select("id, name, listing_status")
          .eq("listing_status", "published")
          .or(orFilter)
          .limit(10),
        supabaseAdmin.from("products").select("listing_status").limit(1000),
      ]);

      // Distinct listing_status values actually present, with counts — the
      // fastest way to spot a casing/naming mismatch ("Published" vs
      // "published", "active" vs "published").
      const statusCounts: Record<string, number> = {};
      for (const row of (statuses.data ?? []) as { listing_status: string | null }[]) {
        const key = row.listing_status === null ? "(null)" : `"${row.listing_status}"`;
        statusCounts[key] = (statusCounts[key] ?? 0) + 1;
      }

      products = {
        searchTerm: term,
        totalProducts: total.count ?? `error: ${total.error?.message}`,
        publishedProducts: published.count ?? `error: ${published.error?.message}`,
        listingStatusValues: statusCounts,
        matchesIgnoringStatus: matchAny.error
          ? `error: ${matchAny.error.message}`
          : (matchAny.data ?? []).map((p) => ({
              name: (p as { breadcrumb_name?: string; name: string }).breadcrumb_name?.trim() || (p as { name: string }).name,
              brand: (p as { brand?: string }).brand,
              listing_status: (p as { listing_status?: string }).listing_status,
            })),
        matchesPublishedOnly: matchPublished.error
          ? `error: ${matchPublished.error.message}`
          : (matchPublished.data ?? []).length,
      };
    } catch (err) {
      products = { searchTerm: term, threw: (err as Error).message };
    }
  }

  if (req.nextUrl.searchParams.get("pipeline")) {
    const message = req.nextUrl.searchParams.get("message") || "do you have ryzen 7";
    // Fixed visitor id so repeated runs land in one conversation instead of
    // littering the admin inbox with a new thread per check.
    const visitorId = req.nextUrl.searchParams.get("visitorId") || "health-check-visitor";
    const started = Date.now();

    try {
      // Hard-capped: without this the whole request hits Vercel's function
      // limit and returns a 504 that tells you nothing. 30s leaves room to
      // still serialise and return the report.
      const stream = await Promise.race([
        handleWebsiteMessage(visitorId, message),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("handleWebsiteMessage did not return a stream within 30s")), 30000)
        ),
      ]);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let full = "";
      const readDeadline = Date.now() + 30000;
      while (true) {
        if (Date.now() > readDeadline) {
          full += "\n[diagnostic: stream never closed within 30s — it is hanging mid-reply]";
          break;
        }
        const { done, value } = await Promise.race([
          reader.read(),
          new Promise<{ done: true; value: undefined }>((resolve) =>
            setTimeout(() => resolve({ done: true, value: undefined }), 15000)
          ),
        ]);
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }

      // The widget protocol is one JSON header line, then the reply text —
      // split them so the product cards are visible separately from the prose
      // (an empty items array here is the "no product cards" symptom).
      const newlineIndex = full.indexOf("\n");
      const headerLine = newlineIndex >= 0 ? full.slice(0, newlineIndex) : "";
      const replyText = newlineIndex >= 0 ? full.slice(newlineIndex + 1) : full;

      let header: { items?: unknown[]; build?: unknown } | null = null;
      try {
        header = JSON.parse(headerLine);
      } catch {
        // Header missing or malformed — reported as-is below.
      }

      pipeline = {
        sentMessage: message,
        elapsedMs: Date.now() - started,
        productCardCount: Array.isArray(header?.items) ? header.items.length : "(no valid header)",
        hasBuildQuote: Boolean(header?.build),
        replyText,
        replyLength: replyText.length,
      };
    } catch (err) {
      pipeline = {
        sentMessage: message,
        elapsedMs: Date.now() - started,
        threw: (err as Error).message,
        stack: (err as Error).stack?.split("\n").slice(0, 6).join("\n"),
      };
    }
  }

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "(not on Vercel)",
      deploymentEnv: process.env.VERCEL_ENV ?? "(unknown)",
      env,
      resolved,
      providersConfigured,
      liveCall,
      stages: stages.length > 0 ? stages : "add &stages=1 to run the pipeline step by step",
      products,
      pipeline,
    },
    { status: 200 }
  );
}
