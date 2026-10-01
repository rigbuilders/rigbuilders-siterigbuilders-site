import {
  appendMessage,
  findOrCreateActiveConversation,
  findOrCreateUser,
  getRecentHistory,
  updateConversationStatus,
} from "./conversation-store";
import { isExcluded } from "./exclusions";
import { findRelevantProducts, buildProductContext, findMentionedProduct } from "./product-knowledge";
import { SYSTEM_PROMPT } from "./system-prompt";
import { generateReply } from "./llm/router";
import { stripFormatting } from "./text-sanitizer";
import { isHandoffRequest, HANDOFF_ACK_MESSAGE } from "./handoff";
import { notifyAdminOfHandoff, notifyWatchedNumberMessage } from "./admin-alerts";
import { notifyAdminOfNewMessage } from "./push-notify";
import { getWatched } from "./watchlist";
import { tryHandleQuotationRequest } from "./quotation-flow";
import type { MediaType, NormalizedMessage, ReplyMeta } from "./types";

const SITE_URL = "https://www.rigbuilders.in";

// products.image_url is stored as a site-relative path (e.g.
// "/products/images/dark/xyz.jpg") — see the admin product form's "Main
// Website Image Path" field. That resolves fine in a browser (relative to
// the current page), but Meta's WhatsApp/Messenger/Instagram servers need a
// real fetchable URL for image.link / image_url — handed the raw relative
// path, they'd fail to fetch it, and for WhatsApp specifically that failure
// can happen *asynchronously* after a 200 response, so it looks like nothing
// went wrong on our end while the image just never arrives.
function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Conversation history is context, not a requirement — if the read fails,
 * answering the customer's current message with no memory of the thread is
 * far better than throwing and answering nothing at all.
 */
async function safeHistory(conversationId: string) {
  try {
    return await getRecentHistory(conversationId);
  } catch (err) {
    console.error(`[chatbot:orchestrator] history load failed, continuing without it: ${(err as Error).message}`);
    return [];
  }
}

export interface HandledReply {
  text: string;
  meta?: ReplyMeta;
  // Set when the reply is (or includes) a document to send — currently only
  // the multi-product quotation flow (quotation-flow.ts) uses this, to
  // deliver the generated PDF via the same sendMedia() path admin-sent
  // media already uses.
  media?: { url: string; type: "document"; caption?: string };
}

/**
 * Channel-agnostic core loop. Every adapter (WhatsApp, Instagram, Messenger,
 * and eventually the website widget) funnels into this single function with
 * nothing but a NormalizedMessage — it never sees a raw platform payload.
 *
 * Returns the reply to send back, or `null` if the bot should stay silent —
 * either because this number is on the exclusions list, or because a human
 * has taken over this specific conversation (status: handed_off). In both
 * cases the inbound message is still recorded, so it shows up in the admin
 * inbox for a human to answer.
 */
export async function handleMessage(msg: NormalizedMessage): Promise<HandledReply | null> {
  const user = await findOrCreateUser(msg.channel, msg.externalUserId);
  const conversation = await findOrCreateActiveConversation(user.id, msg.channel);

  // Persist the inbound message before deciding anything else, so it's
  // never lost and always visible in the admin inbox. When the adapter
  // re-hosted an inbound image (see inbound-media.ts), attach it the same
  // way admin-sent/quotation media already is — ChannelChatDashboard.tsx
  // renders media_url as an <img> regardless of which role sent it.
  const firstAttachment = msg.attachments?.[0];
  const inboundMedia =
    firstAttachment && (firstAttachment.type === "image" || firstAttachment.type === "document")
      ? { url: firstAttachment.url, type: firstAttachment.type as MediaType }
      : undefined;
  await appendMessage(conversation.id, "user", msg.text, undefined, inboundMedia);

  // Push a notification to any admin phone/laptop that's enabled them — same
  // "fires no matter what happens next" placement as the watchlist check
  // below, since the point is just "let the admin know a customer wrote in,"
  // independent of whether the bot ends up replying, staying silent, or the
  // conversation is already handed off. Never throws, never awaited-and-
  // blocking beyond its own completion (still awaited so a slow push send
  // doesn't race the function returning, but a failure inside it can't
  // surface here — see push-notify.ts).
  await notifyAdminOfNewMessage({
    channel: msg.channel,
    externalUserId: msg.externalUserId,
    text: msg.text,
    conversationId: conversation.id,
  });

  // Fires regardless of bot/exclusion/handoff status below — if a watched
  // number messages at all, the admin wants to know, independent of whether
  // the bot goes on to reply normally.
  //
  // Wrapped because this is a *notification*, not part of answering the
  // customer: a watchlist table hiccup must never be the reason a customer
  // gets silence. Same reasoning applies to every other non-essential await
  // in this function — see the ones below.
  try {
    const watched = await getWatched(msg.channel, msg.externalUserId);
    if (watched) {
      await notifyWatchedNumberMessage({
        channel: msg.channel,
        externalUserId: msg.externalUserId,
        label: watched.label,
        message: msg.text,
      });
    }
  } catch (err) {
    console.error(`[chatbot:orchestrator] watchlist check failed: ${(err as Error).message}`);
  }

  if (conversation.status === "handed_off") {
    return null; // a human is already handling this conversation
  }

  if (await isExcluded(msg.channel, msg.externalUserId)) {
    return null; // this number is permanently opted out of auto-replies
  }

  // Customer explicitly asked for a human — pause the bot on this
  // conversation right now, before spending an LLM call, and let them know
  // someone's coming rather than leaving them mid-bot-reply when a human
  // eventually does check the inbox. Distinct from the admin manually
  // pausing a conversation from /admin/chatbot (conversation-store.ts) —
  // this is the customer-triggered path.
  if (isHandoffRequest(msg.text)) {
    await updateConversationStatus(conversation.id, "handed_off");
    await appendMessage(conversation.id, "assistant", HANDOFF_ACK_MESSAGE, "handoff");
    await notifyAdminOfHandoff({
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      message: msg.text,
    });
    return { text: HANDOFF_ACK_MESSAGE };
  }

  // Multi-product quotation request ("quote me a 7800X3D, an RTX 5060, and
  // 32GB of RAM") — a different response shape entirely (a generated PDF,
  // prices resolved straight from the database rather than an LLM's guess)
  // from the normal conversational flow below, so it's checked and handled
  // completely separately. Returns null when this message isn't a
  // multi-product quote request, letting the normal flow run as usual.
  // Wrapped: the quotation path does LLM extraction, DB lookups, PDF
  // rendering and a storage upload. Any of those blowing up used to throw
  // straight out of handleMessage, which the webhook route catches and logs —
  // meaning the customer got complete silence for a message the bot could
  // otherwise have answered normally. Falling through to the normal reply
  // flow is always a better outcome than saying nothing.
  let quotation: HandledReply | null = null;
  try {
    quotation = await tryHandleQuotationRequest(msg, conversation.id);
  } catch (err) {
    console.error(`[chatbot:orchestrator] quotation flow failed, falling back to normal reply: ${(err as Error).message}`);
  }
  if (quotation) {
    return quotation;
  }

  // getRecentHistory already includes the inbound message appended above, and
  // generateReply() appends msg.text again as the final user turn — so
  // without this drop, every single request sent the customer's message
  // TWICE in a row (once as the last history entry, once as the live turn).
  // Besides wasting tokens, back-to-back identical user turns measurably
  // degrade reply quality and are what makes the model read a fresh question
  // as if the customer were repeating themselves.
  let history = await safeHistory(conversation.id);
  if (history.length > 0) {
    const last = history[history.length - 1];
    if (last.role === "user" && last.content === msg.text) {
      history = history.slice(0, -1);
    }
  }

  // Look up matching products and fold them into the system prompt for this
  // one call only — keeps the base prompt small and the data always fresh.
  // Kept as structured rows (not just the formatted string) so the reply can
  // be checked afterward for which specific product it ended up discussing —
  // see findMentionedProduct's own comment for why that's a separate step
  // from "which products matched the question."
  //
  // Wrapped for the same reason as the quotation flow: product context is an
  // enhancement to the reply, never a precondition for having one. Its own
  // doc comment claims it never throws, but it makes several DB round trips
  // (category detection, brand detection, then the search itself) and any of
  // those can fail — which must degrade to "answer without catalog data",
  // not to "don't answer at all".
  let candidateProducts: Awaited<ReturnType<typeof findRelevantProducts>> = [];
  try {
    candidateProducts = await findRelevantProducts(msg.text);
  } catch (err) {
    console.error(`[chatbot:orchestrator] product lookup failed: ${(err as Error).message}`);
  }
  const productContext = buildProductContext(candidateProducts);
  const systemPrompt = productContext ? `${SYSTEM_PROMPT}\n\n${productContext}` : SYSTEM_PROMPT;

  try {
    const { text: rawText, provider } = await generateReply(systemPrompt, history, msg.text);
    // Same backstop as the website widget (see text-sanitizer.ts): the model
    // ignores the system prompt's no-markdown/no-emoji rule often enough that
    // this needs to be enforced server-side, not just requested in the
    // prompt. WhatsApp only ever renders single-asterisk *bold*, so a
    // double-asterisk **bold** from the model would show up as literal
    // asterisks to the customer without this.
    const text = stripFormatting(rawText);
    await appendMessage(conversation.id, "assistant", text, provider);

    const mentioned = findMentionedProduct(text, candidateProducts);
    if (!mentioned) {
      // Diagnostic for exactly this failure mode: candidateProducts came
      // back non-empty (the reply clearly used real product data) but no
      // single product's name was found in the reply text — could be zero
      // matches (name genuinely didn't appear, or still doesn't normalize
      // the same) or more than one (ambiguous, e.g. near-duplicate catalog
      // rows). Logged instead of guessed, since that's the only way to tell
      // the two apart without direct DB access.
      console.error(
        `[chatbot:orchestrator] no single product match for CTA — candidates: ${candidateProducts
          .map((p) => p.breadcrumb_name?.trim() || p.name)
          .join(" | ")} — reply: ${text}`
      );
    }
    const meta: ReplyMeta | undefined = mentioned
      ? {
          product: {
            id: mentioned.id,
            name: mentioned.breadcrumb_name?.trim() || mentioned.name,
            price: mentioned.price,
            description: mentioned.description
              ? mentioned.description.length > 150
                ? `${mentioned.description.slice(0, 147)}...`
                : mentioned.description
              : null,
            features: mentioned.features?.length ? mentioned.features.slice(0, 3) : null,
            imageUrl: mentioned.image_url ? toAbsoluteUrl(mentioned.image_url) : null,
            productUrl: `${SITE_URL}/product/${mentioned.id}`,
            addToCartUrl: `${SITE_URL}/product-action?id=${mentioned.id}&action=cart`,
            buyNowUrl: `${SITE_URL}/product-action?id=${mentioned.id}&action=buy`,
          },
        }
      : undefined;

    return { text, meta };
  } catch (err) {
    // Both providers failed. Graceful degradation instead of going silent
    // (full retry/backoff + human-flagging is Phase 4; this is the seam for it).
    const fallback =
      "Sorry, I'm having trouble getting you an answer right now. A member of the Rig Builders team will follow up with you shortly.";
    await appendMessage(conversation.id, "assistant", fallback, "none");
    console.error(`[chatbot:orchestrator] LLM router failed entirely: ${(err as Error).message}`);
    return { text: fallback };
  }
}
