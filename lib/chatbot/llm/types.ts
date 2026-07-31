import type { ChatMessage } from "../types";

export interface LLMProvider {
  name: string;
  generate(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string>;
}

/**
 * Thrown by providers on failure. `retryable` tells the router whether it's
 * worth falling through to the next provider (rate limit / transient server
 * error) vs. a hard failure (bad request, auth) that would fail identically
 * on every provider.
 */
export class LLMProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly retryable: boolean,
    message: string
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export interface LLMResult {
  text: string;
  provider: string;
}
