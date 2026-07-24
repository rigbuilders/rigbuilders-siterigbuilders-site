// lib/password.ts
// Password hashing using Node's built-in scrypt (no external dependency).
// Format: "scrypt$<saltHex>$<hashHex>"

import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const KEYLEN = 64;
const PREFIX = "scrypt";

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Hash a plaintext password for storage. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt);
  return `${PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** True if the stored value is a scrypt hash (vs. a legacy plaintext password). */
export function isHashed(stored: string): boolean {
  return typeof stored === "string" && stored.startsWith(`${PREFIX}$`);
}

/**
 * Verify a password against a stored value.
 * Supports both scrypt hashes and legacy plaintext (for transparent migration).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (!isHashed(stored)) {
    // Legacy plaintext record — direct compare (constant work isn't meaningful here
    // since these are being phased out on next successful login).
    return password === stored;
  }

  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, salt);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
