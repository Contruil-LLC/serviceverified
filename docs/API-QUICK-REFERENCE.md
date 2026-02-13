# ServiceVerified — API Quick Reference

## Installation

```bash
npm install @contruil/service-verified
```

```typescript
import {
  createCredential,
  generateDid,
  parseDid,
  extractUuid,
  isValidDid,
  formatDidForDisplay,
  serviceVerifiedDid,
  isServiceVerifiedCredential,
} from "@contruil/service-verified";
```

---

## Quick Start

```typescript
// Generate DID
const did = generateDid();
const { uuid } = parseDid(did);

// Create credential linked to that DID
const credential = createCredential(uuid)
  .withStatus("approved")
  .withSource("servicepath.compliance.iso27001")
  .withEvidence({
    type: "iso27001_attestation",
    payload: { scope: "ISMS", control_ids: ["A.5.1"] },
  })
  .build();
```

---

## DID Helpers

| Function | Description |
|----------|-------------|
| `generateDid()` | Returns `did:tw:serviceverified:<uuid>` |
| `parseDid(did)` | Parses DID, returns `{ scheme, method, namespace, uuid, raw }`. Throws on invalid. |
| `extractUuid(did)` | Shortcut for `parseDid(did).uuid` |
| `isValidDid(value)` | Type guard — returns `true` if valid ServiceVerified DID |
| `formatDidForDisplay(did, maxLength?)` | Truncates UUID for display |
| `serviceVerifiedDid(id)` | Builds DID from a raw UUID |

### UUID extraction

```typescript
const { uuid } = parseDid(did);
// or
const uuid = extractUuid(did);
```

---

## Credential Builder

| Method | Description |
|--------|-------------|
| `createCredential(id?)` | Start builder. Pass UUID to link to a DID. |
| `.withStatus(status)` | `"pending" \| "approved" \| "rejected" \| "expired" \| "revoked"` |
| `.withSource(source)` | e.g. `"servicepath.compliance.iso27001"` |
| `.withEvidence(evidence)` | `{ type: string, payload: Record<string, unknown> }`. **Overwrites** previous call. |
| `.withExpiration(iso8601)` | Optional expiration |
| `.build()` | Returns `ServiceVerifiedCredential` |

### Required

- `source` and `evidence` are required; `build()` throws if missing.

### Evidence Contract

`.withEvidence()` uses **last-write-wins** semantics. Each call replaces the previous evidence object. This is intentional.

For multiple evidence items, consolidate into a single structured payload:

```typescript
// ✅ Correct — consolidate into one payload
createCredential()
  .withEvidence({
    type: "compliance_package",
    payload: {
      policies: [{ name: "..." }, { name: "..." }],
      controls: [{ control: "..." }, { control: "..." }],
      audits: [{ result: "..." }],
    },
  })
  .build();
```

**Future:** If additive evidence is needed, a new `.appendEvidence()` method will be added without changing `.withEvidence()` semantics.

---

## Credential Structure

```typescript
{
  schema_version: "1.0",
  did: "did:tw:serviceverified:c9b14cd9-...",
  id: "c9b14cd9-...",
  status: "approved",
  source: "servicepath.compliance.iso27001",
  created_at: "2026-02-13T10:31:31.000Z",
  updated_at: "2026-02-13T10:31:31.000Z",
  evidence: {                    // Single object, not array
    type: "iso27001_attestation",
    payload: { scope: "AI" }
  }
}
```

---

## Patterns

### Linked DID (recommended)

```typescript
const did = generateDid();
const cred = createCredential(extractUuid(did))
  .withStatus("approved")
  .withSource("servicepath.compliance.iso27001")
  .withEvidence({ type: "iso27001_attestation", payload: { scope: "AI" } })
  .build();
// cred.did === did
```

### Auto-generated

```typescript
const cred = createCredential()
  .withStatus("approved")
  .withSource("servicepath.education.service-hours")
  .withEvidence({ type: "service_hours", payload: { hours: 40 } })
  .build();
```

### Multiple evidence items (consolidate)

```typescript
const did = generateDid();
const cred = createCredential(extractUuid(did))
  .withStatus("approved")
  .withSource("servicepath.compliance.hipaa")
  .withEvidence({
    type: "compliance_package",
    payload: {
      policies: [
        { name: "HIPAA Privacy Policy v2.1", approvedDate: "2025-01-15" },
      ],
      controls: [
        { control: "Encryption at Rest", implementation: "AES-256" },
      ],
      audits: [{ event: "Access Control Review", findings: "No issues" }],
    },
  })
  .build();
```

### ServicePath Gate 4 (consolidate evidence)

```typescript
function issueComplianceCredential(organizationId: string, evidencePackets: Array<{ type: string; data: Record<string, unknown> }>) {
  const did = generateDid();
  const consolidated = {
    type: "gate4_evidence",
    payload: {
      packets: evidencePackets.map((p) => ({ type: p.type, ...p.data })),
    },
  };
  const cred = createCredential(extractUuid(did))
    .withStatus("approved")
    .withSource(`servicepath.gate4.${organizationId}`)
    .withEvidence(consolidated)
    .build();
  return { did, cred };
}
```

---

## Validation

```typescript
import { isServiceVerifiedCredential } from "@contruil/service-verified";

if (isServiceVerifiedCredential(unknownPayload)) {
  // TypeScript narrows to ServiceVerifiedCredential
  console.log(unknownPayload.did);
}
```

---

## Sources

| Source | Use case |
|--------|----------|
| `servicepath.compliance.iso27001` | ISO 27001 attestation |
| `servicepath.compliance.soc2` | SOC 2 report |
| `servicepath.compliance.hipaa` | HIPAA compliance |
| `servicepath.education.service-hours` | Community service hours |
| `servicepath.leadership-training.negotiation` | Negotiation training |

---

## Common Mistakes

```typescript
// ❌ Wrong: split(":")[2] returns "serviceverified", not UUID
const uuid = did.split(":")[2];

// ✅ Correct
const { uuid } = parseDid(did);
const uuid = extractUuid(did);
```

```typescript
// ❌ Wrong: generateDid but don't link
const did = generateDid();
const cred = createCredential().build();  // cred.did !== did

// ✅ Correct
const did = generateDid();
const cred = createCredential(extractUuid(did)).build();  // cred.did === did
```

```typescript
// ❌ Wrong: invalid status ("verified", "active" not valid)
.withStatus("verified")

// ✅ Correct: use "approved"
.withStatus("approved")
```

---

## Debugging

```typescript
if (!isValidDid(did)) throw new Error("Invalid DID");
console.log(formatDidForDisplay(cred.did));  // did:tw:serviceverified:a1b2c3d4...5678
```

---

## Next Steps

- [DID Specification](./DID-SPECIFICATION.md)
- [Integration Roadmap](./INTEGRATION-ROADMAP.md)
- Run: `npm run demo` or `npm run demo:full`
