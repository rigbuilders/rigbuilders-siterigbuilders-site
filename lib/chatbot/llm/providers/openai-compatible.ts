import type { LlmApiConfig } from "../../config";
import type { ChatMessage } from "../../types";
import { stripReasoning } from "../../text-sanitizer";
import { LLMProviderError, type LLMProvider } from "../types";

/**
 * Generic OpenAI-compatible chat-completions provider. Replaces the old
 * together.ts, which was the same code with api.together.xyz hardcoded —
 * Together, DeepInfra, Fireworks, Groq, OpenRouter, aicredits.in and OpenAI
 * itself all speak this exact protocol, so the only thing that actually
 * varied between them was the URL. Now that's config (see getLlmApiConfig in
 * config.ts), which means swapping models or vendors is an env var change
 * with no code deploy.
 *
 * Zero-dependency on purpose: plain fetch, manual SSE parsing, no vendor SDK,
 * matching the rest of this directory's style.
 */

interface ChatCompletionResponse {
  choices?: {
    message?: { content?: string; reasoning?: string; reasoning_content?: string };
    finish_reason?: string;
  }[];
  usage?: { completion_tokens?: number; prompt_tokens?: number };
  error?: { message?: string };
}

/**
 * Reasoning models (gpt-oss, Qwen3, DeepSeek-R1 and friends) are the reason
 * this isn't just `JSON.stringify({model, messages})`. Three things matter:
 *
 * 1. `reasoning_effort` — gpt-oss exposes this directly. Left low by default
 *    because this is a customer-service bot reading a product list, not a
 *    maths tutor: high effort buys nothing here and costs latency on a
 *    channel where the customer is watching a typing indicator.
 * 2. `max_tokens` — a reasoning model that decides to think out loud can
 *    otherwise blow straight past WhatsApp's 4096-character body limit and
 *    turn into a failed send. Capped well below that.
 * 3. The reply itself must never contain the model's chain of thought. Most
 *    endpoints return it on a separate `reasoning`/`reasoning_content` field
 *    (which this file simply never reads), but some leak it inline as
 *    <think>...</think> inside `content` — hence stripReasoning() on the way
 *    out. See text-sanitizer.ts.
 */
function buildBody(config: LlmApiConfig, messages: unknown[], stream: boolean) {
  return {
    model: config.model,
    messages,
    temperature: 0.7,
    max_tokens: config.maxTokens,
    ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
    ...(stream ? { stream: true } : {}),
  };
}

function toMessages(systemPrompt: string, history: ChatMessage[], userMessage: string) {
  return [
    { role: "system", content: systemPrompt },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
}

export function createOpenAICompatProvider(config: LlmApiConfig): LLMProvider {
  return {
    name: config.label,

    async generate(
      systemPrompt: string,
      history: ChatMessage[],
      userMessage: string
    ): Promise<string> {
      let response: Response;
      try {
        response = await fetch(config.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(buildBody(config, toMessages(systemPrompt, history, userMessage), false)),
          // Node's fetch has no default timeout — a gateway that accepts the
          // connection and then stalls would otherwise hold the whole
          // serverless invocation until Vercel kills it at maxDuration, with
          // no error logged and no fallback provider ever tried.
          signal: AbortSignal.timeout(30000),
        });
      } catch (err) {
        throw new LLMProviderError(
          config.label,
          true,
          `Network error calling ${config.label}: ${(err as Error).message}`
        );
      }

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const errorBody = await response.text().catch(() => "");
        throw new LLMProviderError(
          config.label,
          retryable,
          `${config.label} API error (${response.status}): ${errorBody}`
        );
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const choice = data.choices?.[0];
      const raw = choice?.message?.content;

      if (!raw) {
        // Empty content on an otherwise-successful (and billed) call is the
        // signature failure of a reasoning model whose max_tokens ran out
        // during the thinking phase. Spell that out rather than logging a
        // bare "no usable text", because the symptom — credits deducted,
        // customer sees nothing — otherwise looks like a billing or auth
        // problem and sends you looking in completely the wrong place.
        const reasoningLength =
          (choice?.message?.reasoning ?? choice?.message?.reasoning_content ?? "").length;
        console.error(
          `[chatbot:llm] ${config.label} returned empty content. ` +
            `finish_reason=${choice?.finish_reason ?? "?"}, ` +
            `completion_tokens=${data.usage?.completion_tokens ?? "?"}, ` +
            `max_tokens=${config.maxTokens}, reasoning_chars=${reasoningLength}` +
            (choice?.finish_reason === "length"
              ? " — the token budget was consumed before the reply was written; raise LLM_MAX_TOKENS."
              : "")
        );
        throw new LLMProviderError(
          config.label,
          true,
          `${config.label} returned no usable text: ${data.error?.message ?? `finish_reason=${choice?.finish_reason ?? "unknown"}`}`
        );
      }

      const text = stripReasoning(raw).trim();
      if (!text) {
        // The whole response was reasoning with no actual answer after it —
        // retryable, and far better caught here than sent to a customer as
        // an empty message (which Meta rejects outright anyway).
        throw new LLMProviderError(
          config.label,
          true,
          `${config.label} returned only reasoning content with no reply text.`
        );
      }
      return text;
    },
  };
}

/**
 * Streaming variant used by the website live-chat widget. OpenAI-compatible
 * chat completions return Server-Sent Events (`data: {json}\n\n`, terminated
 * by `data: [DONE]`) when `stream: true` is set.
 *
 * Only `delta.content` is ever forwarded. Endpoints that stream chain of
 * thought do it on `delta.reasoning` / `delta.reasoning_content`, so ignoring
 * those fields is what keeps a reasoning model's thinking off the customer's
 * screen — and the caller additionally pipes this through
 * createSanitizingTransform(), which strips any <think> that leaked inline.
 *
 * `onComplete` is awaited *before* the returned stream is closed. This
 * matters on Vercel: a serverless function can freeze the instant its
 * response is considered fully sent, so persisting the full reply to Supabase
 * has to happen before `controller.close()`, not after.
 */
export async function streamOpenAICompatReply(
  config: LlmApiConfig,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  onComplete: (fullText: string) => Promise<void>
): Promise<ReadableStream<Uint8Array>> {
  let response: Response;
  try {
    response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildBody(config, toMessages(systemPrompt, history, userMessage), true)),
    });
  } catch (err) {
    throw new LLMProviderError(
      config.label,
      true,
      `Network error calling ${config.label} (stream): ${(err as Error).message}`
    );
  }

  if (!response.ok || !response.body) {
    const retryable = response.status === 429 || response.status >= 500;
    const errorBody = await response.text().catch(() => "");
    throw new LLMProviderError(
      config.label,
      retryable,
      `${config.label} API stream error (${response.status}): ${errorBody}`
    );
  }

  const upstreamReader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let fullText = "";

  // `data: [DONE]` is the protocol's end-of-stream marker. Treating it as
  // just another line to skip — and waiting for the HTTP body to close
  // instead — is what hung the website widget for a full 60 seconds until
  // Vercel killed the function: some gateways (aicredits among them) send
  // [DONE] and then hold the connection open, so `read()` never resolves
  // `done` and the reply never arrives. [DONE] is terminal; act on it.
  let sawDone = false;

  async function finish(controller: ReadableStreamDefaultController<Uint8Array>) {
    const finalText = stripReasoning(fullText).trim();

    // Nothing usable came back — same reasoning-model-ran-out-of-tokens
    // failure described in generate() above, except here the HTTP response is
    // already streaming, so throwing can't fall through to the next provider.
    // Without this the visitor is left staring at an empty chat bubble
    // forever, which reads as the site being broken.
    if (!finalText) {
      console.error(
        `[chatbot:llm-stream] stream produced no content (raw chars: ${fullText.length}) — ` +
          "likely the token budget was spent on reasoning; raise LLM_MAX_TOKENS."
      );
      controller.enqueue(
        encoder.encode(
          "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly."
        )
      );
    }

    try {
      await onComplete(finalText);
    } catch (err) {
      console.error(`[chatbot:llm-stream] onComplete failed: ${(err as Error).message}`);
    }
    // Stop pulling from upstream explicitly: after [DONE] the connection may
    // still be open, and leaving it dangling keeps the serverless invocation
    // alive past the point where we've already answered.
    await upstreamReader.cancel().catch(() => {});
    controller.close();
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await upstreamReader.read();

      if (done) {
        await finish(controller);
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep any partial line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice("data:".length).trim();
        if (!payload) continue;
        if (payload === "[DONE]") {
          sawDone = true;
          break;
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(delta));
          }
        } catch {
          // Ignore a fragment that didn't parse — SSE lines can arrive split
          // across chunk boundaries; the next pull's buffer concat recovers it.
        }
      }

      if (sawDone) await finish(controller);
    },
    async cancel() {
      // Visitor closed the tab/widget mid-stream — stop pulling upstream.
      // Best-effort only; we don't persist a partial reply in this case.
      await upstreamReader.cancel().catch(() => {});
    },
  });
}
