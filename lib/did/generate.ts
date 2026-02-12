/**
 * ServiceVerified — DID generation
 *
 * Generates UUID v4 and returns did:tw:serviceverified:<uuid>
 * @see docs/DID-SPECIFICATION.md
 */

function randomUUID(): string {
  const c = typeof globalThis !== "undefined" ? (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto : undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a new DID for a ServiceVerified credential.
 * Uses UUID v4.
 */
export function generateDid(): string {
  const id = randomUUID().toLowerCase();
  return `did:tw:serviceverified:${id}`;
}

/**
 * Generate a new credential ID (UUID v4, lowercase).
 */
export function generateCredentialId(): string {
  return randomUUID().toLowerCase();
}
