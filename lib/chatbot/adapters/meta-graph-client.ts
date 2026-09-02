/**
 * Tiny shared helper for calling Meta's Graph API. WhatsApp, Messenger, and
 * Instagram adapters all send replies through the same Graph API — this just
 * avoids duplicating the fetch/error-handling boilerplate three times. Each
 * adapter still owns its own payload shape and endpoint path independently.
 */

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export function graphApiUrl(path: string): string {
  return `${GRAPH_API_BASE}/${path}`;
}

/**
 * GET against the Graph API — currently only used by the WhatsApp adapter's
 * inbound-media lookup (GET /{media-id} to resolve a media id into its
 * short-lived download URL before the actual file can be fetched).
 */
export async function getFromGraphApi(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Graph API error (${response.status}) calling ${url}: ${errorBody}`);
  }

  return response.json();
}

export async function postToGraphApi(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Graph API error (${response.status}) calling ${url}: ${errorBody}`);
  }

  return response.json();
}
