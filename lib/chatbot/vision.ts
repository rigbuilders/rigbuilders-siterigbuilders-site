import { getVisionConfig } from "./config";

/**
 * Describes an inbound customer image so the main assistant can answer about
 * it.
 *
 * Deliberately a two-stage design: this model does PERCEPTION ONLY and never
 * writes to the customer. Its description is handed to the main model as
 * context, which then replies under the usual rules. The alternative —
 * letting a vision model answer directly — would mean duplicating every rule
 * about never inventing prices, never promising callbacks, and when to
 * escalate into a second prompt, and the two would drift.
 *
 * Images are already re-hosted to a public Supabase URL when they arrive (see
 * inbound-media.ts), so the URL goes straight into the request — no base64,
 * no extra upload step.
 *
 * Never throws. A failed description means the assistant answers without it,
 * which is what it did before this existed.
 */

const DESCRIBE_PROMPT = `You are describing an image a customer sent to a custom PC builder in India. Produce a short, factual description for a colleague who cannot see it.

Cover, where applicable:
- What the image shows overall.
- Any PC hardware visible, named as specifically as you can (make, model, connectors, form factor, visible damage).
- Any text, labels, serial numbers, error messages or on-screen writing, transcribed VERBATIM. This matters more than style — transcribe exactly what is written, including numbers.
- Whether it looks like a screenshot, a photo of hardware, a document, or a payment or transaction screen.

Rules:
- Describe only what is actually visible. Never guess a model number, a price, or a specification that isn't legible. If something is blurred or cut off, say so.
- If it appears to be a payment, receipt or transaction screenshot, describe what is shown but state clearly that you cannot verify whether any payment actually succeeded.
- No preamble, no advice to the customer, no questions. Just the description, under 120 words.`;

interface VisionResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

export async function describeImage(imageUrl: string): Promise<string | null> {
  const config = getVisionConfig();
  if (!config) return null;

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        // Low temperature on purpose: this is transcription and
        // identification, not writing. Creativity here shows up as invented
        // model numbers downstream.
        temperature: 0.2,
        messages: [
          { role: "system", content: DESCRIBE_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      // A customer is watching a "please wait" message, so this can't hang —
      // better to answer without the description than not at all.
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[chatbot:vision] ${config.model} error ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data = (await res.json()) as VisionResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error(`[chatbot:vision] empty description: ${data.error?.message ?? "no content"}`);
      return null;
    }
    return text;
  } catch (err) {
    console.error(`[chatbot:vision] describe failed: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Wraps a description as context for the main model.
 *
 * The provenance line matters: the main model must know this came from
 * another model looking at a picture, not from the customer's own words, so
 * it hedges appropriately instead of asserting a part number as fact.
 */
export function buildImageContext(description: string): string {
  return (
    "The customer sent an image. You cannot see it yourself — the following description was " +
    "produced by an image-analysis model, so treat it as a careful but fallible account rather " +
    "than certainty. Answer the customer based on it, and if it doesn't contain what you'd need, " +
    "say what you can see and ask one specific question, or use NEEDS_HUMAN.\n\n" +
    "Never treat a payment or transaction screenshot as proof that a payment succeeded — you " +
    "cannot verify that, and confirming it wrongly would be costly. Those always go to a person " +
    "via NEEDS_HUMAN.\n\n" +
    `Image description:\n${description}`
  );
}

/** Sent to the customer the moment an image arrives, before analysis starts. */
export const IMAGE_ACK_MESSAGE = "Got your image — just taking a look, one moment.";
