import { NextRequest, NextResponse } from "next/server";
import { getGeminiConfig, getLlmApiConfig, getOllamaConfig } from "@/lib/chatbot/config";

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

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "(not on Vercel)",
      deploymentEnv: process.env.VERCEL_ENV ?? "(unknown)",
      env,
      resolved,
      providersConfigured,
      liveCall,
    },
    { status: 200 }
  );
}
