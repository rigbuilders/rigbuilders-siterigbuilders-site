/**
 * Numbers that are NOT customers.
 *
 * Without this, the first thing that happens when the distributor replies
 * "rx 550 available, 8500" is that the assistant greets him, searches the
 * catalogue and tries to sell him a gaming PC — because every inbound
 * WhatsApp message goes through the customer pipeline. These numbers have to
 * be recognised before any of that runs.
 *
 * Overridable by env so a number can be changed without a deploy, since
 * people and suppliers change more often than code does.
 */

export type InternalRole = "distributor" | "approver";

/** Digits only — Meta delivers `from` without "+" or spacing. */
function normalise(value: string): string {
  return value.replace(/\D/g, "");
}

function listFrom(envValue: string | undefined, fallback: string[]): string[] {
  const configured = envValue?.trim();
  if (!configured) return fallback;
  return configured.split(",").map(normalise).filter(Boolean);
}

/** Supplies parts and quotes distributor prices. */
function distributorNumbers(): string[] {
  return listFrom(process.env.DISTRIBUTOR_PHONES, ["917986553947"]);
}

/** Approves substitutions and decides what the customer is quoted. */
function approverNumbers(): string[] {
  return listFrom(process.env.APPROVER_PHONES, ["917814389247"]);
}

export function internalRoleFor(externalUserId: string): InternalRole | null {
  const number = normalise(externalUserId);
  if (!number) return null;
  if (distributorNumbers().includes(number)) return "distributor";
  if (approverNumbers().includes(number)) return "approver";
  return null;
}

export function isInternalContact(externalUserId: string): boolean {
  return internalRoleFor(externalUserId) !== null;
}

/** Human labels for alerts, so a Telegram message doesn't just show digits. */
export function labelFor(externalUserId: string): string {
  const role = internalRoleFor(externalUserId);
  if (role === "distributor") return `distributor (${externalUserId})`;
  if (role === "approver") return `approver (${externalUserId})`;
  return externalUserId;
}
