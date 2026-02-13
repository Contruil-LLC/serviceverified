/**
 * ServiceVerified — DID parsing utilities
 *
 * Parse and validate did:tw:serviceverified:<uuid> format.
 * @see docs/DID-SPECIFICATION.md
 */

const PREFIX = "did:tw:serviceverified:";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Parsed DID components */
export interface ParsedDid {
  scheme: "did";
  method: string;
  namespace: string;
  uuid: string;
  raw: string;
}

/**
 * Parse a ServiceVerified DID into components.
 * @throws Error if format is invalid
 */
export function parseDid(did: string): ParsedDid {
  if (typeof did !== "string" || !did.trim()) {
    throw new Error("parseDid: input must be a non-empty string");
  }
  const trimmed = did.trim();
  if (!trimmed.startsWith(PREFIX)) {
    throw new Error(
      `parseDid: invalid DID format. Expected "${PREFIX}<uuid>", got "${trimmed.slice(0, 40)}${trimmed.length > 40 ? "..." : ""}"`
    );
  }
  const uuid = trimmed.slice(PREFIX.length);
  if (!UUID_REGEX.test(uuid)) {
    throw new Error(
      `parseDid: invalid UUID in DID. Expected UUID v4 format, got "${uuid}"`
    );
  }
  return {
    scheme: "did",
    method: "tw",
    namespace: "serviceverified",
    uuid: uuid.toLowerCase(),
    raw: trimmed,
  };
}

/**
 * Check if a string is a valid ServiceVerified DID.
 */
export function isValidDid(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    parseDid(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract the UUID from a ServiceVerified DID.
 * @throws Error if format is invalid
 */
export function extractUuid(did: string): string {
  return parseDid(did).uuid;
}

/**
 * Format a DID for display (truncate UUID for readability).
 */
export function formatDidForDisplay(did: string, maxLength = 32): string {
  const parsed = parseDid(did);
  if (parsed.raw.length <= maxLength) return parsed.raw;
  return `${PREFIX}${parsed.uuid.slice(0, 8)}...${parsed.uuid.slice(-4)}`;
}
