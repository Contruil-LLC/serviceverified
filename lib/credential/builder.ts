/**
 * ServiceVerified — Credential builder
 *
 * Fluent API to construct ServiceVerifiedCredential with validation.
 * @see docs/INTEGRATION-ROADMAP.md
 */

import { generateCredentialId } from "../did/generate";
import { serviceVerifiedDid } from "../types/credential";
import type {
  ServiceVerifiedCredential,
  ServiceVerifiedEvidence,
  ServiceVerifiedSource,
  ServiceVerifiedStatus,
} from "../types/credential";

const SCHEMA_VERSION = "1.0";

export class CredentialBuilder {
  private id: string;
  private status: ServiceVerifiedStatus = "pending";
  private source!: ServiceVerifiedSource;
  private evidence!: ServiceVerifiedEvidence;
  private expiresAt?: string;

  constructor(id?: string) {
    this.id = id ?? generateCredentialId();
  }

  withStatus(status: ServiceVerifiedStatus): this {
    this.status = status;
    return this;
  }

  withSource(source: ServiceVerifiedSource): this {
    this.source = source;
    return this;
  }

  withEvidence(evidence: ServiceVerifiedEvidence): this {
    this.evidence = evidence;
    return this;
  }

  withExpiration(iso8601: string): this {
    this.expiresAt = iso8601;
    return this;
  }

  build(): ServiceVerifiedCredential {
    if (!this.source || !this.evidence) {
      throw new Error("CredentialBuilder: source and evidence are required");
    }
    const now = new Date().toISOString();
    const cred: ServiceVerifiedCredential = {
      schema_version: SCHEMA_VERSION,
      did: serviceVerifiedDid(this.id),
      id: this.id,
      status: this.status,
      source: this.source,
      created_at: now,
      updated_at: now,
      evidence: this.evidence,
    };
    if (this.expiresAt) {
      cred.expires_at = this.expiresAt;
    }
    return cred;
  }
}

/**
 * Create a new credential builder.
 */
export function createCredential(id?: string): CredentialBuilder {
  return new CredentialBuilder(id);
}
