/**
 * ServiceVerified — Compliance credentials
 *
 * @see https://github.com/Contruil-LLC/ServiceVerified
 */

export type {
  ServiceVerifiedCredential,
  ServiceVerifiedStatus,
  ServiceVerifiedSource,
  ServiceVerifiedEvidence,
  ISO27001EvidencePayload,
  SOC2EvidencePayload,
} from "./types/credential";

export {
  serviceVerifiedDid,
  isServiceVerifiedCredential,
} from "./types/credential";

export { generateDid, generateCredentialId } from "./did/generate";
export {
  parseDid,
  isValidDid,
  extractUuid,
  formatDidForDisplay,
  type ParsedDid,
} from "./did/parse";
export {
  CredentialBuilder,
  createCredential,
} from "./credential/builder";
