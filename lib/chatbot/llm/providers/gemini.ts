import type { ProviderConfig } from "../../config";
import type { ChatMessage } from "../../types";
import { LLMProviderError, type LLMProvider } from "../types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

function toGeminiHistory(history: ChatMessage[]): GeminiContent[] {
  return history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

/**
 * Builds a Gemini-backed LLMProvider from an explicit config object rather
 * than reading env itself — keeps this module independently testable, and
 * the router decides whether Gemini is enabled at all.
 */
export function createGeminiProvider(config: ProviderConfig): LLMProvider {
  return {
    name: "gemini",

    async generate(
      systemPrompt: string,
      history: ChatMessage[],
      userMessage: string
    ): Promise<string> {
      const url = `${API_BASE}/${config.model}:generateContent?key=${config.apiKey}`;

      const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...toGeminiHistory(history),
          { role: "user", parts: [{ text: userMessage }] },
        ],
      };

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err) {
        throw new LLMProviderError(
          "gemini",
          true,
          `Network error calling Gemini: ${(err as Error).message}`
        );
      }

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const errorBody = await response.text().catch(() => "");
        throw new LLMProviderError(
          "gemini",
          retryable,
          `Gemini API error (${response.status}): ${errorBody}`
        );
      }

      const data = (await response.json()) as GeminiResponse;

      if (data.promptFeedback?.blockReason) {
        throw new LLMProviderError(
          "gemini",
          false,
          `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`
        );
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new LLMProviderError(
          "gemini",
          true,
          "Gemini returned no usable text in its response."
        );
      }

      return text.trim();
    },
  };
}
