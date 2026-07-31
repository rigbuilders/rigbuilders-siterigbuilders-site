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
