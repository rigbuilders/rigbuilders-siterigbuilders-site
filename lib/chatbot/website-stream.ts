import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
  updateConversationStatus,
} from "./conversation-store";
import { getGeminiConfig, getTogetherConfig } from "./config";
import { isExcluded } from "./exclusions";
import { isHandoffRequest, HANDOFF_ACK_MESSAGE } from "./handoff";
import { notifyAdminOfHandoff, notifyWatchedNumberMessage } from "./admin-alerts";
import { getWatched } from "./watchlist";
import { createGeminiProvider } from "./llm/providers/gemini";
import { streamTogetherReply } from "./llm/providers/together";
import { buildProductContext, findRelevantProducts, toProductCards, type ProductCard } from "./product-knowledge";
import { detectBuildIntent, buildQuoteContext, type BuildQuote } from "./build-recommender";
import { tryHandleQuotationRequest } from "./quotation-flow";
import { SYSTEM_PROMPT } from "./system-prompt";
import { stripFormatting, createSanitizingTransform } from "./text-sanitizer";
import type { NormalizedMessage } from "./types";

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
 * takes (real Together stream, a one-shot Gemini reply, hand-off notice, or
 * an error fallback) — the widget's fetch-and-read client code stays
 * identical either way.
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
 * get an LLM reply, a watched visitor triggers an admin alert regardless of
 * anything else, a customer-triggered handoff request pauses the bot the
 * same way it does on WhatsApp/Messenger/Instagram, and a multi-product
 * quotation request gets the same PDF flow. Everything shows up in the same
 * /admin/chatbot inbox either way.
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

    // Fires regardless of bot/exclusion/handoff status below — same as
    // orchestrator.ts's equivalent check for the other channels.
    const watched = await getWatched("website", visitorId);
    if (watched) {
      await notifyWatchedNumberMessage({
        channel: "website",
        externalUserId: visitorId,
        label: watched.label,
        message: text,
      });
    }

    if (conversation.status === "handed_off") {
      return withProductsHeader([], null, staticStream(HANDED_OFF_NOTICE));
    }
    if (await isExcluded("website", visitorId)) {
      return withProductsHeader([], null, staticStream(HANDED_OFF_NOTICE));
    }

    // Customer explicitly asked for a human — same trigger and wording as
    // the WhatsApp/Messenger/Instagram path (handoff.ts), before spending an
    // LLM call on it.
    if (isHandoffRequest(text)) {
      await updateConversationStatus(conversation.id, "handed_off");
      await appendMessage(conversation.id, "assistant", HANDOFF_ACK_MESSAGE, "handoff");
      await notifyAdminOfHandoff({ channel: "website", externalUserId: visitorId, message: text });
      return withProductsHeader([], null, staticStream(HANDOFF_ACK_MESSAGE));
    }

    // Multi-product quotation request ("quote me a 7800X3D, an RTX 5060, and
    // 32GB of RAM") — same detection/PDF-generation flow as WhatsApp
    // (quotation-flow.ts), just delivered differently: the website channel
    // has no document-attachment mechanism, so the PDF's public URL is
    // appended to the visible reply text instead of sent as separate media.
    // The DB-persisted copy of the reply (written inside tryHandleQuotationRequest
    // itself) intentionally stays link-free, so future LLM calls don't see —
    // and potentially repeat — a stale download URL.
    const quotationMsg: NormalizedMessage = { channel: "website", externalUserId: visitorId, text, timestamp: Date.now() };
    const quotation = await tryHandleQuotationRequest(quotationMsg, conversation.id);
    if (quotation) {
      const displayText = quotation.media ? `${quotation.text}\n\n${quotation.media.url}` : quotation.text;
      return withProductsHeader([], null, staticStream(displayText));
    }

    // API providers only — Gemini (primary, same as WhatsApp) then Together
    // (fallback). No Ollama on this channel, unlike the WhatsApp/Messenger/
    // Instagram path's local-dev override in llm/router.ts.
    const geminiConfig = getGeminiConfig();
    const togetherConfig = getTogetherConfig();

    if (!geminiConfig && !togetherConfig) {
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

    // Sanitized here (not just on the live stream below) so the copy that
    // lands in conversation history — and gets fed back to the model as
    // context on the customer's next message — never reinforces markdown/emoji
    // it was told not to use. See text-sanitizer.ts for why this backstop
    // exists at all.
    const persist = (provider: string) => async (fullText: string) => {
      const finalText = fullText
        ? stripFormatting(fullText)
        : "Sorry, I couldn't put a reply together — a team member will follow up shortly.";
      await appendMessage(conversation.id, "assistant", finalText, provider);
    };

    // Gemini has no streaming provider wired up (see llm/providers/gemini.ts —
    // a single generateContent call), so a Gemini reply arrives as one
    // finished string and gets wrapped as a one-chunk stream rather than
    // typed out token-by-token. Together's provider streams natively and is
    // used as-is when it's the one answering.
    if (geminiConfig) {
      try {
        const fullText = await createGeminiProvider(geminiConfig).generate(systemPrompt, history, text);
        await persist("gemini")(fullText);
        return withProductsHeader(cards, buildQuote, staticStream(stripFormatting(fullText)));
      } catch (err) {
        console.error(`[chatbot:website] gemini failed, falling back to together: ${(err as Error).message}`);
        // Falls through to Together below.
      }
    }

    try {
      if (!togetherConfig) {
        throw new Error("Together not configured and Gemini failed or was unavailable.");
      }
      const stream = await streamTogetherReply(togetherConfig, systemPrompt, history, text, persist("together"));
      return withProductsHeader(cards, buildQuote, stream.pipeThrough(createSanitizingTransform()));
    } catch (err) {
      const fallback =
        "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.";
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
