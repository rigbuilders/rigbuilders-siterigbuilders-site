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

  // Fires regardless of bot/exclusion/handoff status below — if a watched
  // number messages at all, the admin wants to know, independent of whether
  // the bot goes on to reply normally.
  const watched = await getWatched(msg.channel, msg.externalUserId);
  if (watched) {
    await notifyWatchedNumberMessage({
      channel: msg.channel,
      externalUserId: msg.externalUserId,
      label: watched.label,
      message: msg.text,
    });
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
  const quotation = await tryHandleQuotationRequest(msg, conversation.id);
  if (quotation) {
    return quotation;
  }

  const history = await getRecentHistory(conversation.id);

  // Look up matching products and fold them into the system prompt for this
  // one call only — keeps the base prompt small and the data always fresh.
  // Kept as structured rows (not just the formatted string) so the reply can
  // be checked afterward for which specific product it ended up discussing —
  // see findMentionedProduct's own comment for why that's a separate step
  // from "which products matched the question."
  const candidateProducts = await findRelevantProducts(msg.text);
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
