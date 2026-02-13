/**
 * ServiceVerified — Improved usage demo
 *
 * Demonstrates correct patterns for compliance credentials.
 * Evidence is a single object; use consolidated payload for multiple items.
 *
 * Run: node examples/usage-demo-improved.js  (or npm run demo:full)
 */

const {
  createCredential,
  generateDid,
  parseDid,
  extractUuid,
  isValidDid,
} = require("../dist/lib");

console.log("=== Pattern 1: Linked DID (recommended for ServicePath) ===\n");

const did = generateDid();
const { uuid } = parseDid(did);
const cred = createCredential(uuid)
  .withStatus("approved")
  .withSource("servicepath.compliance.iso27001")
  .withEvidence({
    type: "iso27001_attestation",
    payload: { scope: "AI", control_ids: ["A.5.1", "A.5.2"] },
  })
  .build();

console.log("Generated DID:", did);
console.log("Credential DID:", cred.did);
console.log("DIDs match:", did === cred.did);
console.log("\nCredential:", JSON.stringify(cred, null, 2));

console.log("\n=== Pattern 2: Auto-generated (simple cases) ===\n");

const cred2 = createCredential()
  .withStatus("approved")
  .withSource("servicepath.education.service-hours")
  .withEvidence({
    type: "service_hours",
    payload: { hours: 40, agency_id: "1" },
  })
  .build();

console.log("Credential (auto ID):", cred2.did);

console.log("\n=== Pattern 3: Consolidated evidence (multiple items) ===\n");

const complexDid = generateDid();
const complexCred = createCredential(extractUuid(complexDid))
  .withStatus("approved")
  .withSource("servicepath.compliance.hipaa")
  .withEvidence({
    type: "compliance_package",
    payload: {
      policies: [
        { name: "HIPAA Privacy Policy v2.1", approvedDate: "2025-01-15", approvedBy: "CISO" },
      ],
      controls: [
        { control: "Encryption at Rest", implementation: "AES-256 via AWS KMS", testDate: "2025-02-01" },
      ],
      audits: [
        { event: "Access Control Review", findings: "No issues", reviewDate: "2025-02-10" },
      ],
    },
  })
  .build();

console.log("Credential with consolidated evidence:");
console.log(JSON.stringify(complexCred, null, 2));

console.log("\n=== Pattern 4: ServicePath Gate 4 (consolidate before build) ===\n");

function issueComplianceCredential(orgId, evidencePackets) {
  const orgDid = generateDid();
  const consolidated = {
    type: "gate4_evidence",
    payload: {
      packets: evidencePackets.map((p) => ({ type: p.type, ...p.data })),
    },
  };
  const cred = createCredential(extractUuid(orgDid))
    .withStatus("approved")
    .withSource(`servicepath.gate4.${orgId}`)
    .withEvidence(consolidated)
    .build();
  return { did: orgDid, cred };
}

const mockEvidence = [
  { type: "control_implementation", data: { controlId: "A.5.1", status: "implemented" } },
  { type: "control_implementation", data: { controlId: "A.5.2", status: "implemented" } },
  { type: "control_test", data: { controlId: "A.8.1", result: "passed" } },
  { type: "control_test", data: { controlId: "A.8.2", result: "passed" } },
];

const { did: gate4Did, cred: gate4Cred } = issueComplianceCredential("org_acme_001", mockEvidence);

console.log("ServicePath-issued credential:");
console.log("  DID:", gate4Cred.did);
console.log("  Status:", gate4Cred.status);
console.log("  Source:", gate4Cred.source);
console.log("  Evidence (single object):", typeof gate4Cred.evidence === "object" && !Array.isArray(gate4Cred.evidence) ? "✓" : "✗");
console.log("  Packets in payload:", gate4Cred.evidence?.payload?.packets?.length ?? 0);

console.log("\n=== Pattern 5: extractUuid and isValidDid ===\n");

const did5 = generateDid();
console.log("extractUuid:", extractUuid(did5));
console.log("isValidDid:", isValidDid(did5));
console.log("isValidDid (empty):", isValidDid(""));
console.log("isValidDid (bad):", isValidDid("did:wrong:format"));

console.log("\n=== Summary ===\n");
console.log("1. Use generateDid() + extractUuid() + createCredential(uuid) for linked DIDs");
console.log("2. Use createCredential() without args for auto-generated DIDs");
console.log("3. Consolidate multiple items into a single .withEvidence() payload");
console.log("4. Valid statuses: pending | approved | rejected | expired | revoked");
console.log("5. evidence is a single object, not an array");
