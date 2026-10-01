/**
 * Env config for the chatbot feature living inside this Next.js app. Next.js
 * already loads .env.local in dev and Vercel injects env vars in prod — no
 * dotenv import needed here (matches the rest of this repo's convention).
 *
 * Same design as the standalone chatbot backend this was ported from: each
 * LLM provider and each Meta channel is its own independent getter that
 * returns a typed config or `null` if unset, so a missing key disables just
 * that one piece instead of breaking the whole route.
 */

function raw(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

function optional(name: string, fallback: string): string {
  return raw(name) ?? fallback;
}

// ---- LLM providers (each optional and independent) ----
export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export function getGeminiConfig(): ProviderConfig | null {
  const apiKey = raw("GEMINI_API_KEY");
  if (!apiKey) return null;
  return { apiKey, model: optional("GEMINI_MODEL", "gemini-3.5-flash-lite") };
}

/**
 * Config for the generic OpenAI-compatible chat-completions provider (see
 * llm/providers/openai-compatible.ts). Together, DeepInfra, Fireworks, Groq,
 * OpenRouter, aicredits.in and OpenAI itself all speak the same protocol, so
 * the vendor is just a base URL — swapping providers or models is an env var
 * change, no code deploy.
 */
export interface LlmApiConfig {
  apiKey: string;
  model: string;
  /** Fully-resolved chat-completions endpoint. */
  baseUrl: string;
  /** Short name stored in chatbot_messages.provider and shown in the admin inbox. */
  label: string;
  maxTokens: number;
  /** Only sent when set — gpt-oss and other reasoning models accept it. */
  reasoningEffort: string | null;
}

/**
 * Accepts either a full chat-completions URL or just the API base, so it
 * doesn't matter which form a provider's docs happen to show:
 *   https://api.example.com/v1              -> .../v1/chat/completions
 *   https://api.example.com/v1/             -> .../v1/chat/completions
 *   https://api.example.com/v1/chat/completions -> used as-is
 */
function resolveChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

export function getLlmApiConfig(): LlmApiConfig | null {
  // TOGETHER_* are the historical names this started with and are still read
  // as fallbacks, so an existing deployment keeps working untouched after
  // this refactor. New setups should use the LLM_* names.
  const apiKey = raw("LLM_API_KEY") ?? raw("TOGETHER_API_KEY");
  if (!apiKey) return null;

  const model = raw("LLM_MODEL") ?? raw("TOGETHER_MODEL") ?? "openai/gpt-oss-120b";
  const baseUrl = resolveChatCompletionsUrl(
    raw("LLM_BASE_URL") ?? raw("TOGETHER_BASE_URL") ?? "https://api.together.xyz/v1"
  );

  // Label the admin inbox by model rather than vendor — "which model wrote
  // this reply" is the useful question when comparing two of them, and the
  // vendor is just whoever is reselling it this month.
  const label = raw("LLM_LABEL") ?? model.split("/").pop() ?? model;

  const maxTokensRaw = Number(raw("LLM_MAX_TOKENS"));
  // Deliberately well under WhatsApp's 4096-character body cap: a reasoning
  // model that rambles would otherwise turn into a failed send rather than a
  // long one.
  const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw > 0 ? maxTokensRaw : 700;

  // "none" explicitly disables the parameter for endpoints that reject it.
  const effort = optional("LLM_REASONING_EFFORT", "low");
  const reasoningEffort = effort.toLowerCase() === "none" ? null : effort;

  return { apiKey, model, baseUrl, label, maxTokens, reasoningEffort };
}

/**
 * TEMPORARY, local-testing-only provider: a locally-running Ollama server
 * (e.g. `ollama run qwen3.5:2b-q4_K_M`). Only used by the WhatsApp/Messenger/
 * Instagram path (llm/router.ts) as a local-dev override — the website chat
 * widget deliberately never uses this (API providers only, see
 * website-stream.ts). To use it for local testing, set OLLAMA_BASE_URL in
 * .env.local; unset it to go straight back to Gemini/Together.
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export function getOllamaConfig(): OllamaConfig | null {
  const baseUrl = raw("OLLAMA_BASE_URL");
  if (!baseUrl) return null;
  return { baseUrl, model: optional("OLLAMA_MODEL", "qwen3.5:2b-q4_K_M") };
}

// ---- Meta channels (each optional and independent) ----
export interface WhatsAppConfig {
  verifyToken: string;
  phoneId: string;
  accessToken: string;
}

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const verifyToken = raw("META_VERIFY_TOKEN");
  const phoneId = raw("WA_PHONE_ID");
  const accessToken = raw("WHATSAPP_ACCESS_TOKEN");
  if (!verifyToken || !phoneId || !accessToken) return null;
  return { verifyToken, phoneId, accessToken };
}

export interface MetaChannelConfig {
  verifyToken: string;
  accessToken: string;
}

export interface InstagramConfig extends MetaChannelConfig {
  // Optional: Instagram's own Graph API endpoint is /<IG_BUSINESS_ID>/messages.
  // If unset, the adapter falls back to the shared /me/messages endpoint.
  businessId: string | null;
}

export function getInstagramConfig(): InstagramConfig | null {
  const verifyToken = raw("META_VERIFY_TOKEN");
  const accessToken = raw("INSTAGRAM_ACCESS_TOKEN");
  if (!verifyToken || !accessToken) return null;
  return { verifyToken, accessToken, businessId: raw("INSTAGRAM_BUSINESS_ID") ?? null };
}

export function getMessengerConfig(): MetaChannelConfig | null {
  const verifyToken = raw("META_VERIFY_TOKEN");
  const accessToken = raw("MESSENGER_ACCESS_TOKEN");
  if (!verifyToken || !accessToken) return null;
  return { verifyToken, accessToken };
}
