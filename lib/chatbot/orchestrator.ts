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
import { advanceToRenderable, resolveMenuSelection, MENU_ROOT, type MenuRender } from "./whatsapp-menu";
import {
  MAX_CONSECUTIVE_MISSES,
  clearMenuState,
  getMenuState,
  setMenuState,
  type MenuState,
} from "./menu-state";
import { menuIntro, modelGaveUp, preLlmMenuTrigger, type MenuTriggerReason } from "./menu-trigger";
import { getProductDetail } from "./menu-data";
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
  /**
   * A guided-menu step to send as native interactive UI. When present, the
   * webhook route sends this via adapter.sendMenu() INSTEAD of `text` — the
   * menu body already contains the prompt, so sending both would duplicate it.
   * `text` stays populated as the fallback for any channel without sendMenu.
   */
  menu?: MenuRender;
  // Set when the reply is (or includes) a document to send — currently only
  // the multi-product quotation flow (quotation-flow.ts) uses this, to
  // deliver the generated PDF via the same sendMedia() path admin-sent
  // media already uses.
  media?: { url: string; type: "document"; caption?: string };
}

/**
 * Renders a menu step and persists the position, so the next webhook knows
 * where the customer is. Returns null when there's nothing renderable, which
 * the caller treats as "carry on to the assistant" rather than failing.
 */
async function openMenu(
  conversationId: string,
  nodeId: string,
  state: Pick<MenuState, "filters" | "trail" | "misses">,
  intro?: string
): Promise<HandledReply | null> {
  const built = await advanceToRenderable(nodeId, state.filters, intro);
  if (!built) return null;

  await setMenuState(conversationId, {
    nodeId: built.nodeId,
    filters: state.filters,
    trail: state.trail,
    misses: state.misses,
  });

  // `text` mirrors the menu body so a channel without interactive support
  // still sends something coherent instead of an empty message.
  const optionsAsText = (built.render.buttons ?? built.render.rows ?? [])
    .map((o) => `- ${o.title}`)
    .join("\n");

  await appendMessage(conversationId, "assistant", built.render.body, "menu");

  return {
    text: optionsAsText ? `${built.render.body}\n\n${optionsAsText}` : built.render.body,
    menu: built.render,
  };
}

/**
 * Handles a tap on a menu button or list row. Separate from the free-text
 * path entirely: a selection has an unambiguous meaning, so paying for a model
 * call to restate it would be waste.
 */
type MenuTapResult =
  /** Menu handled it — send this and stop. */
  | { kind: "reply"; reply: HandledReply }
  /** Hand to the assistant, using this text as the question. */
  | { kind: "ai"; question: string };

async function handleMenuTap(replyId: string, conversationId: string): Promise<MenuTapResult> {
  const state = await getMenuState(conversationId);

  // A tap with no stored position means the menu was cleared (they typed in
  // between) or the deployment restarted mid-flow — start over rather than
  // guess at which step the id belonged to.
  if (!state) {
    const reply = await openMenu(conversationId, MENU_ROOT, { filters: {}, trail: [], misses: 0 });
    return reply
      ? { kind: "reply", reply }
      : { kind: "ai", question: "I'd like some help choosing." };
  }

  const selection = await resolveMenuSelection(state, replyId);

  switch (selection.kind) {
    case "stale": {
      // WhatsApp lets you scroll up and tap an old menu. Re-showing the
      // current step is honest about what happened; silently applying the old
      // option would attach the wrong filter to the wrong question.
      const reply = await openMenu(
        conversationId,
        state.nodeId,
        state,
        "That option was from an earlier message. Here's where we got to:"
      );
      return reply ? { kind: "reply", reply } : { kind: "ai", question: "I'd like some help choosing." };
    }

    case "ai":
      await clearMenuState(conversationId);
      return { kind: "ai", question: selection.seed ?? selection.label };

    case "build":
      await clearMenuState(conversationId);
      return {
        kind: "ai",
        question: `I'd like a custom PC for ${selection.useCase.toLowerCase()}, budget ${selection.label}.`,
      };

    case "product": {
      await clearMenuState(conversationId);
      const detail = await getProductDetail(selection.productId);
      if (!detail) {
        return { kind: "ai", question: `Tell me about ${selection.label}.` };
      }
      const text = `${detail.name} — ₹${detail.price.toLocaleString("en-IN")}. Tap below for full specs, or add it straight to your cart.`;
      await appendMessage(conversationId, "assistant", text, "menu");
      return {
        kind: "reply",
        reply: {
          text,
          meta: {
            product: {
              id: detail.id,
              name: detail.name,
              price: detail.price,
              description: detail.description
                ? detail.description.length > 150
                  ? `${detail.description.slice(0, 147)}...`
                  : detail.description
                : null,
              features: detail.features?.length ? detail.features.slice(0, 3) : null,
              imageUrl: detail.imageUrl ? toAbsoluteUrl(detail.imageUrl) : null,
              productUrl: `${SITE_URL}/product/${detail.id}`,
              addToCartUrl: `${SITE_URL}/product-action?id=${detail.id}&action=cart`,
              buyNowUrl: `${SITE_URL}/product-action?id=${detail.id}&action=buy`,
            },
          },
        },
      };
    }

    case "advance": {
      const trail = [...state.trail, { nodeId: state.nodeId, label: selection.label, filters: state.filters }];
      const reply = await openMenu(conversationId, selection.nodeId, {
        filters: selection.filters,
        trail,
        misses: 0,
      });
      return reply
        ? { kind: "reply", reply }
        : { kind: "ai", question: `I'm looking for ${selection.label}.` };
    }
  }

  // Unreachable for a well-formed MenuSelection, but an explicit fallback
  // beats relying on exhaustiveness analysis surviving future edits to the
  // union — and "hand it to the assistant" is the right default anyway.
  return { kind: "ai", question: "I'd like some help." };
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

  // A tap on a menu button or list row. Handled entirely without the model:
  // a selection has one unambiguous meaning, so paying for a call to restate
  // it is waste. May still hand back to the assistant (the "not sure" rows and
  // the budget step both do), in which case `question` replaces msg.text for
  // the rest of this function.
  let effectiveText = msg.text;
  if (msg.replyId) {
    const tap = await handleMenuTap(msg.replyId, conversation.id);
    if (tap.kind === "reply") return tap.reply;
    effectiveText = tap.question;
  } else {
    // Typing is an explicit choice to leave the menu. Clearing here means a
    // half-finished drill-down never silently reattaches to an unrelated
    // question three messages later.
    await clearMenuState(conversation.id);
  }

  // Tiers 1 and 2 — both free, both before any model call. A greeting has
  // nothing to answer, and a sticker or reaction is something we already know
  // we couldn't read, so sending either to the model costs money and produces
  // a confused reply about inventory. See menu-trigger.ts.
  const preTrigger: MenuTriggerReason | null = msg.replyId ? null : preLlmMenuTrigger(effectiveText);
  if (preTrigger) {
    // "Brand new conversation" is good enough for choosing between a welcome
    // and a plain re-offer, and costs nothing — a message count would be an
    // extra round trip for a one-word difference in wording.
    const isFirstContact = Date.now() - new Date(conversation.createdAt).getTime() < 60_000;
    const menuReply = await openMenu(
      conversation.id,
      MENU_ROOT,
      { filters: {}, trail: [], misses: 0 },
      menuIntro(preTrigger, isFirstContact)
    );
    if (menuReply) return menuReply;
    // No renderable menu (misconfigured tree) — fall through to the assistant
    // rather than going silent.
  }

  // Customer explicitly asked for a human — pause the bot on this
  // conversation right now, before spending an LLM call, and let them know
  // someone's coming rather than leaving them mid-bot-reply when a human
  // eventually does check the inbox. Distinct from the admin manually
  // pausing a conversation from /admin/chatbot (conversation-store.ts) —
  // this is the customer-triggered path.
  if (isHandoffRequest(effectiveText)) {
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
    quotation = await tryHandleQuotationRequest({ ...msg, text: effectiveText }, conversation.id);
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

  // Loop guard: if the menu has already failed this person twice in a row,
  // a third one won't help either. Pulled before the model call so the
  // handoff is immediate rather than arriving after another vague answer.
  const priorState = await getMenuState(conversation.id);
  const menuExhausted = (priorState?.misses ?? 0) >= MAX_CONSECUTIVE_MISSES;

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
    candidateProducts = await findRelevantProducts(effectiveText);
  } catch (err) {
    console.error(`[chatbot:orchestrator] product lookup failed: ${(err as Error).message}`);
  }
  const productContext = buildProductContext(candidateProducts);
  const systemPrompt = productContext ? `${SYSTEM_PROMPT}\n\n${productContext}` : SYSTEM_PROMPT;

  try {
    const { text: rawText, provider } = await generateReply(systemPrompt, history, effectiveText);

    // Tier 3 — the model signalled it couldn't help (see system-prompt.ts and
    // menu-trigger.ts). Checking for an exact token beats pattern-matching its
    // hedging phrases, which would mean chasing wording forever.
    if (modelGaveUp(rawText)) {
      if (menuExhausted) {
        // Twice already. A third menu is not the answer — get a person.
        await updateConversationStatus(conversation.id, "handed_off");
        await clearMenuState(conversation.id);
        await appendMessage(conversation.id, "assistant", HANDOFF_ACK_MESSAGE, "handoff");
        await notifyAdminOfHandoff({
          channel: msg.channel,
          externalUserId: msg.externalUserId,
          message: effectiveText,
        });
        return { text: HANDOFF_ACK_MESSAGE };
      }

      const menuReply = await openMenu(
        conversation.id,
        MENU_ROOT,
        { filters: {}, trail: [], misses: (priorState?.misses ?? 0) + 1 },
        menuIntro("model-gave-up", false)
      );
      if (menuReply) return menuReply;
      // Nothing renderable — fall through and let the apology below stand
      // rather than sending the raw sentinel to a customer.
    }

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
