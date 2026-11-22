import { whatsappAdapter } from "./adapters/whatsapp";
import { internalRoleFor } from "./internal-contacts";
import {
  brandRequestMessage,
  findOpenRequest,
  itemsMissingBrand,
  parseApproval,
  parseDistributorReply,
  requestApproval,
  updateRequest,
} from "./sourcing";

/**
 * Handles messages from people who aren't customers — the distributor and
 * the approver.
 *
 * Runs BEFORE the customer pipeline. Without it the first distributor reply
 * ("rx 550 available, 8500") gets greeted, product-searched and sold a
 * gaming PC, because every inbound WhatsApp message otherwise goes through
 * the same path.
 *
 * Returns true when the message was handled here and must not continue into
 * the customer flow.
 */

export async function handleInternalMessage(params: {
  externalUserId: string;
  text: string;
}): Promise<boolean> {
  const role = internalRoleFor(params.externalUserId);
  if (!role) return false;

  if (role === "distributor") {
    await handleDistributorReply(params.externalUserId, params.text);
    return true;
  }

  // The approver's decisions normally arrive via Telegram, where replying to
  // the alert is one tap. Accepting them on WhatsApp too means a decision is
  // never lost just because it was sent from the wrong app.
  await handleApproverReply(params.text);
  return true;
}

async function handleDistributorReply(from: string, text: string): Promise<void> {
  const request = await findOpenRequest();
  if (!request) {
    console.log(`[chatbot:internal] distributor message with no open request: ${text.slice(0, 120)}`);
    return;
  }

  const items = await parseDistributorReply(request.requestedParts, text);

  if (!items || items.length === 0) {
    // Couldn't read it. Say so rather than guessing at prices — a
    // misparsed quote becomes a wrong customer quote.
    await whatsappAdapter
      .sendReply(from, "Thanks — I couldn't read that clearly. Could you send the parts with brand and price, one per line?")
      .catch(() => {});
    await updateRequest(request.id, { distributorReply: text });
    return;
  }

  const unbranded = itemsMissingBrand(items);
  if (unbranded.length > 0) {
    // "DDR4 RAM 16GB" can't be priced or quoted — ask before going further.
    await whatsappAdapter.sendReply(from, brandRequestMessage(unbranded)).catch(() => {});
    await updateRequest(request.id, {
      distributorReply: text,
      parsedItems: items,
      status: "needs_brand",
    });
    return;
  }

  await updateRequest(request.id, { distributorReply: text, parsedItems: items });
  await requestApproval(request, items);

  await whatsappAdapter
    .sendReply(from, "Got it, thank you — checking internally and I'll confirm shortly.")
    .catch(() => {});
}

async function handleApproverReply(text: string): Promise<void> {
  const decision = parseApproval(text);
  if (!decision) return;

  const request = await findOpenRequest();
  if (!request) return;

  await updateRequest(request.id, {
    status: decision === "approve" ? "approved" : "revision_requested",
  });
}
