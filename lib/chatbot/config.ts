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

export function getTogetherConfig(): ProviderConfig | null {
  const apiKey = raw("TOGETHER_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    model: optional("TOGETHER_MODEL", "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"),
  };
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
