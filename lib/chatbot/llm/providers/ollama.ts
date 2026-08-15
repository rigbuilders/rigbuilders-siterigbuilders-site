import type { OllamaConfig } from "../../config";
import type { ChatMessage } from "../../types";
import { LLMProviderError } from "../types";

/**
 * TEMPORARY, local-testing-only provider — see the comment on
 * getOllamaConfig() in config.ts. Mirrors streamTogetherReply()'s exact
 * signature so website-stream.ts can swap between the two with one `if`.
 *
 * Ollama's native /api/chat endpoint streams newline-delimited JSON objects
 * (not SSE) — each line is a full `{ message: { content }, done }` object,
 * with the final line carrying `done: true`. Requires `ollama serve` (or the
 * Ollama app) running on the same machine as `npm run dev` — a Vercel-deployed
 * instance of this app has no way to reach your machine's localhost, so this
 * only works when you're running the site locally too.
 */
export async function streamOllamaReply(
  config: OllamaConfig,
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
    response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        // Qwen3(.5) is a "thinking" model — Ollama has it emit a reasoning
        // trace under a separate `message.thinking` field, ON BY DEFAULT,
        // before it ever produces `message.content`. We were only reading
        // `.content`, so the widget sat on the typing indicator for however
        // long the model spent reasoning (which can be minutes on CPU for a
        // quantized model) with nothing visibly happening. Disabling it
        // entirely is the right call for a support-chat widget — it just
        // needs a fast direct answer, not a visible chain of thought.
        think: false,
      }),
    });
  } catch (err) {
    throw new LLMProviderError(
      "ollama",
      true,
      `Network error calling local Ollama at ${config.baseUrl} — is \`ollama serve\` running? (${(err as Error).message})`
    );
  }

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => "");
    throw new LLMProviderError("ollama", true, `Ollama error (${response.status}): ${errorBody}`);
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
          console.error(`[chatbot:ollama-stream] onComplete failed: ${(err as Error).message}`);
        }
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep any partial line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed) as {
            message?: { content?: string };
            done?: boolean;
            error?: string;
          };
          if (json.error) {
            console.error(`[chatbot:ollama-stream] ${json.error}`);
            continue;
          }
          const delta = json.message?.content;
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(delta));
          }
        } catch {
          // A line split across chunk boundaries — buffer concat on the next
          // pull recovers it, same as the Together SSE parser.
        }
      }
    },
    async cancel() {
      await upstreamReader.cancel().catch(() => {});
    },
  });
}
