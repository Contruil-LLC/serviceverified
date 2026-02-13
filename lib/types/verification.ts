/**
 * ServiceVerified — Verification types
 *
 * Multi-axis verification model. Valid signature ≠ valid credential.
 * Six independent checks per PHASE2-ARCHITECTURE.md.
 *
 * @see https://github.com/Contruil-LLC/ServiceVerified
 */

/** Per-axis check results for verification */
export interface VerificationChecks {
  /** Ed25519 signature verification */
  signatureValid: boolean;
  /** Valid did:tw:serviceverified:<uuid> format */
  didFormatValid: boolean;
  /** Credential found in resolution store */
  didResolvable: boolean;
  /** approved (not pending/rejected/expired/revoked) */
  statusValid: boolean;
  /** Not expired (expires_at if present) */
  timeValid: boolean;
  /** Schema-valid, present */
  evidenceValid: boolean;
}

/** Error for a single failed check */
export interface VerificationError {
  check: keyof VerificationChecks;
  code: string;
  message: string;
}

/** Summary credential info returned in verification result */
export interface VerificationCredentialSummary {
  did: string;
  status: string;
  issuedAt: string;
  source: string;
}

/** Result of multi-axis verification */
export interface VerificationResult {
  /** True only if all checks pass */
  valid: boolean;
  /** Per-axis results */
  checks: VerificationChecks;
  /** Credential summary for display */
  credential: VerificationCredentialSummary;
  /** Populated on failure; detailed feedback */
  errors?: VerificationError[];
}
