import type { ProviderConfig } from "../../config";
import type { ChatMessage } from "../../types";
import { LLMProviderError, type LLMProvider } from "../types";

const API_URL = "https://api.together.xyz/v1/chat/completions";

interface TogetherResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

/**
 * Builds a Together-backed LLMProvider from an explicit config object.
 * Same pattern as createGeminiProvider.
 */
export function createTogetherProvider(config: ProviderConfig): LLMProvider {
  return {
    name: "together",

    async generate(
      systemPrompt: string,
      history: ChatMessage[],
      userMessage: string
    ): Promise<string> {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];

      let response: Response;
      try {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            temperature: 0.7,
          }),
        });
      } catch (err) {
        throw new LLMProviderError(
          "together",
          true,
          `Network error calling Together: ${(err as Error).message}`
        );
      }

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const errorBody = await response.text().catch(() => "");
        throw new LLMProviderError(
          "together",
          retryable,
          `Together API error (${response.status}): ${errorBody}`
        );
      }

      const data = (await response.json()) as TogetherResponse;
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new LLMProviderError(
          "together",
          true,
          `Together returned no usable text: ${data.error?.message ?? "unknown"}`
        );
      }

      return text.trim();
    },
  };
}

/**
 * Streaming variant used by the website live-chat widget. Together's chat
 * completions endpoint returns an OpenAI-style Server-Sent Events stream
 * (`data: {json}\n\n`, terminated by `data: [DONE]`) when `stream: true` is
 * set — this parses that manually with plain `fetch` rather than pulling in
 * the `together-ai` SDK, matching the rest of this file's zero-dependency style.
 *
 * `onComplete` is awaited *before* the returned stream is closed. This
 * matters on Vercel: a serverless function can freeze the instant its
 * response is considered fully sent, so persisting the full reply to Supabase
 * has to happen before `controller.close()`, not after (same reasoning as the
 * webhook route fully awaiting `processInbound` before responding).
 */
export async function streamTogetherReply(
  config: ProviderConfig,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  onComplete: (fullText: string) => Promise<void>
): Promise<ReadableStream<Uint8Array>> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });
  } catch (err) {
    throw new LLMProviderError(
      "together",
      true,
      `Network error calling Together (stream): ${(err as Error).message}`
    );
  }

  if (!response.ok || !response.body) {
    const retryable = response.status === 429 || response.status >= 500;
    const errorBody = await response.text().catch(() => "");
    throw new LLMProviderError(
      "together",
      retryable,
      `Together API stream error (${response.status}): ${errorBody}`
    );
  }

  const upstreamReader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let fullText = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await upstreamReader.read();

      if (done) {
        try {
          await onComplete(fullText.trim());
        } catch (err) {
          console.error(`[chatbot:together-stream] onComplete failed: ${(err as Error).message}`);
        }
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep any partial line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice("data:".length).trim();
        if (!payload || payload === "[DONE]") continue;

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
    },
    async cancel() {
      // Visitor closed the tab/widget mid-stream — stop pulling from Together.
      // Best-effort only; we don't persist a partial reply in this case.
      await upstreamReader.cancel().catch(() => {});
    },
  });
}
