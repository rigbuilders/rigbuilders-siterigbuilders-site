import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
} from "./conversation-store";
import { getOllamaConfig, getTogetherConfig } from "./config";
import { isExcluded } from "./exclusions";
import { streamOllamaReply } from "./llm/providers/ollama";
import { streamTogetherReply } from "./llm/providers/together";
import { buildProductContext, findRelevantProducts, toProductCards, type ProductCard } from "./product-knowledge";
import { detectBuildIntent, buildQuoteContext, type BuildQuote } from "./build-recommender";
import { SYSTEM_PROMPT } from "./system-prompt";

const HANDED_OFF_NOTICE =
  "Thanks for the message — a member of the Rig Builders team will reply to you right here shortly.";

/**
 * Every response starts with one JSON line — {"type":"products","items":[...],
 * "build":null|BuildQuote} — followed by the plain-text reply. The widget
 * always reads that first line to get product cards (and, when present, a
 * full build quotation) for this turn, then streams the rest as text.
 * Keeping this as a fixed protocol (even when items is empty and build is
 * null) means the client never has to guess which shape a given response is.
 */
function withProductsHeader(
  cards: ProductCard[],
  build: BuildQuote | null,
  inner: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const headerBytes = new TextEncoder().encode(
    JSON.stringify({ type: "products", items: cards, build }) + "\n"
  );
  const innerReader = inner.getReader();
  let headerSent = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!headerSent) {
        headerSent = true;
        controller.enqueue(headerBytes);
        return;
      }
      const { done, value } = await innerReader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    async cancel() {
      await innerReader.cancel().catch(() => {});
    },
  });
}

/**
 * Wraps a single static string as a one-chunk ReadableStream, so the API
 * route can always return a stream regardless of which path this function
 * takes (real Together stream, hand-off notice, or an error fallback) — the
 * widget's fetch-and-read client code stays identical either way.
 */
function staticStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

/**
 * Website-channel counterpart to orchestrator.ts's handleMessage. Kept as a
 * separate function rather than reusing the orchestrator because the two
 * have genuinely different shapes: the orchestrator returns a finished
 * string (or null to stay silent) for channels where a webhook pushes the
 * reply out; the website widget needs a live token-by-token stream instead,
 * since "stay silent" isn't an option when a visitor is looking at a chat
 * window waiting for a response.
 *
 * Same underlying rules as every other channel though: message is always
 * persisted first, a handed_off conversation or an excluded visitor doesn't
 * get an LLM reply, and everything shows up in the same /admin/chatbot inbox.
 *
 * Never throws — always resolves to a stream, so the API route can just pipe
 * it straight through.
 */
export async function handleWebsiteMessage(
  visitorId: string,
  text: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    const user = await findOrCreateUser("website", visitorId);
    const conversation = await findOrCreateActiveConversation(user.id, "website");

    await appendMessage(conversation.id, "user", text);

    if (conversation.status === "handed_off") {
      return withProductsHeader([], null, staticStream(HANDED_OFF_NOTICE));
    }
    if (await isExcluded("website", visitorId)) {
      return withProductsHeader([], null, staticStream(HANDED_OFF_NOTICE));
    }

    // ⚠️ TEMPORARY: prefer a local Ollama model over Together while Together
    // billing is being sorted out. Purely env-var driven — set OLLAMA_BASE_URL
    // in .env.local to test locally, delete it to go straight back to
    // Together. No code changes needed either way; this whole block can stay
    // in place permanently as a "local dev override" if that's ever useful.
    const ollamaConfig = getOllamaConfig();
    const togetherConfig = getTogetherConfig();

    if (!ollamaConfig && !togetherConfig) {
      const fallback =
        "Sorry, live chat isn't configured right now. Please reach us on WhatsApp and we'll help you out.";
      await appendMessage(conversation.id, "assistant", fallback, "none");
      return withProductsHeader([], null, staticStream(fallback));
    }

    const [history, products] = await Promise.all([
      getRecentHistory(conversation.id),
      findRelevantProducts(text),
    ]);
    const productContext = buildProductContext(products);
    let systemPrompt = productContext ? `${SYSTEM_PROMPT}\n\n${productContext}` : SYSTEM_PROMPT;
    const cards = toProductCards(products);

    // Full-build quotations reuse the configurator's own compatibility engine
    // (see build-recommender.ts) — the LLM never picks parts or prices
    // itself, it only explains a finished quote or asks for what's missing.
    const buildIntent = await detectBuildIntent(text, history);
    let buildQuote: BuildQuote | null = null;
    if (buildIntent.kind === "quote") {
      buildQuote = buildIntent.quote;
      systemPrompt = `${systemPrompt}\n\n${buildQuoteContext(buildIntent.quote)}`;
    } else if (buildIntent.kind === "needs_info") {
      const missing: string[] = [];
      if (!buildIntent.have.useCase) {
        missing.push("what they'll mainly use it for (gaming, video editing/streaming, workstation/CAD, or everyday use)");
      }
      if (!buildIntent.have.budget) {
        missing.push("their budget");
      }
      systemPrompt =
        `${systemPrompt}\n\nThe customer is asking for a custom PC build/quotation. Before recommending ` +
        `any parts, ask them conversationally for: ${missing.join(" and ")}. Keep it to one short friendly ` +
        `question. Do not propose specific parts, brands, or prices until you have both pieces of information.`;
    }

    const persist = (provider: string) => async (fullText: string) => {
      const finalText =
        fullText || "Sorry, I couldn't put a reply together — a team member will follow up shortly.";
      await appendMessage(conversation.id, "assistant", finalText, provider);
    };

    try {
      if (ollamaConfig) {
        const stream = await streamOllamaReply(ollamaConfig, systemPrompt, history, text, persist("ollama"));
        return withProductsHeader(cards, buildQuote, stream);
      }
      const stream = await streamTogetherReply(togetherConfig!, systemPrompt, history, text, persist("together"));
      return withProductsHeader(cards, buildQuote, stream);
    } catch (err) {
      const fallback = ollamaConfig
        ? "Sorry, I couldn't reach the local test model. Make sure `ollama serve` is running, then try again."
        : "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.";
      await appendMessage(conversation.id, "assistant", fallback, "none");
      console.error(`[chatbot:website] stream failed: ${(err as Error).message}`);
      // Still show the cards/build we already found even if the LLM call itself failed.
      return withProductsHeader(cards, buildQuote, staticStream(fallback));
    }
  } catch (err) {
    // Something failed before we even got to the LLM call (e.g. Supabase
    // hiccup) — don't leave the widget hanging, and don't throw across the
    // API route boundary.
    console.error(`[chatbot:website] handleWebsiteMessage failed: ${(err as Error).message}`);
    return withProductsHeader(
      [],
      null,
      staticStream("Sorry, something went wrong on our end. Please try again in a moment, or reach us on WhatsApp.")
    );
  }
}
