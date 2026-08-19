import { getGeminiConfig, getTogetherConfig, getOllamaConfig } from "../config";
import type { ChatMessage } from "../types";
import { createGeminiProvider } from "./providers/gemini";
import { createTogetherProvider } from "./providers/together";
import { createOllamaProvider } from "./providers/ollama";
import { LLMProviderError, type LLMProvider, type LLMResult } from "./types";

interface ProviderFactory {
  name: string;
  build: () => LLMProvider | null;
}

/**
 * Priority order: local Ollama first WHEN configured (OLLAMA_BASE_URL set in
 * .env.local — see config.ts's getOllamaConfig), same "local override" intent
 * as website-stream.ts already uses. Otherwise Gemini (primary), then
 * Together (fallback). Adding a new provider later = one new config getter
 * in config.ts, one new provider file implementing LLMProvider, and one line
 * here.
 */
const PROVIDER_FACTORIES: ProviderFactory[] = [
  {
    name: "ollama",
    build: () => {
      const config = getOllamaConfig();
      return config ? createOllamaProvider(config) : null;
    },
  },
  {
    name: "gemini",
    build: () => {
      const config = getGeminiConfig();
      return config ? createGeminiProvider(config) : null;
    },
  },
  {
    name: "together",
    build: () => {
      const config = getTogetherConfig();
      return config ? createTogetherProvider(config) : null;
    },
  },
];

/**
 * Not module-level cached like the standalone backend's version: serverless
 * functions can be reused across invocations OR cold-started fresh, and env
 * vars can't change mid-invocation anyway, so resolving fresh each call is
 * cheap and avoids any stale-cache surprises across warm/cold starts.
 */
function getActiveProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];
  for (const factory of PROVIDER_FACTORIES) {
    const provider = factory.build();
    if (provider) {
      providers.push(provider);
    } else {
      console.warn(`[chatbot:llm-router] "${factory.name}" is not configured — skipping.`);
    }
  }
  return providers;
}

export function listConfiguredProviders(): string[] {
  return getActiveProviders().map((p) => p.name);
}

export async function generateReply(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<LLMResult> {
  const providers = getActiveProviders();

  if (providers.length === 0) {
    throw new Error(
      "No LLM providers are configured. Set GEMINI_API_KEY and/or TOGETHER_API_KEY."
    );
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const text = await provider.generate(systemPrompt, history, userMessage);
      return { text, provider: provider.name };
    } catch (err) {
      const message =
        err instanceof LLMProviderError
          ? `${err.provider} (${err.retryable ? "retryable" : "fatal"}): ${err.message}`
          : `${provider.name}: ${(err as Error).message}`;

      console.error(`[chatbot:llm-router] ${message}`);
      errors.push(message);
      continue;
    }
  }

  throw new Error(`All configured LLM providers failed. Details:\n${errors.join("\n")}`);
}
