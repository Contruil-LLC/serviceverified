/**
 * ServiceVerified — Credential types
 *
 * Compliance credentials. Verifiable. Portable. DID-anchored.
 * DID format: did:tw:serviceverified:<uuid>
 *
 * @see https://github.com/Contruil-LLC/ServiceVerified
 */

/** State machine status for a ServiceVerified credential */
export type ServiceVerifiedStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "revoked";

/** Source workflow that produced the credential */
export type ServiceVerifiedSource =
  | "servicepath.leadership-training.negotiation"
  | "servicepath.compliance.iso27001"
  | "servicepath.compliance.soc2"
  | "servicepath.compliance.hipaa"
  | "servicepath.education.service-hours"
  | string;

/**
 * ServiceVerified Credential — full record shape
 */
export interface ServiceVerifiedCredential {
  schema_version: string;
  did: string;
  id: string;
  status: ServiceVerifiedStatus;
  source: ServiceVerifiedSource;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  evidence: ServiceVerifiedEvidence;
}

/**
 * Evidence payload — extensible by source type
 */
export interface ServiceVerifiedEvidence {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * ISO 27001 attestation payload
 */
export interface ISO27001EvidencePayload {
  type: "iso27001_attestation";
  control_ids?: string[];
  scope?: string;
  auditor?: string;
  report_date?: string;
}

/**
 * SOC 2 report evidence payload
 */
export interface SOC2EvidencePayload {
  type: "soc2_report";
  report_type?: "Type I" | "Type II";
  criteria?: string[];
  period_end?: string;
}

/**
 * Generate DID for a credential ID
 */
export function serviceVerifiedDid(id: string): string {
  return `did:tw:serviceverified:${id.toLowerCase()}`;
}

/**
 * Type guard — is this a valid ServiceVerified credential?
 */
export function isServiceVerifiedCredential(
  value: unknown
): value is ServiceVerifiedCredential {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const statusOk = ["pending", "approved", "rejected", "expired", "revoked"].includes(
    String(v.status)
  );
  const evidence = v.evidence as Record<string, unknown> | undefined;
  return (
    typeof v.schema_version === "string" &&
    typeof v.did === "string" &&
    v.did.startsWith("did:tw:serviceverified:") &&
    typeof v.id === "string" &&
    statusOk &&
    typeof v.source === "string" &&
    typeof v.created_at === "string" &&
    typeof v.updated_at === "string" &&
    evidence != null &&
    typeof evidence === "object" &&
    typeof evidence.type === "string" &&
    typeof evidence.payload === "object"
  );
}
