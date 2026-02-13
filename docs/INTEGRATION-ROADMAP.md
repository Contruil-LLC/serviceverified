# ServiceVerified Integration Roadmap

**Last updated:** February 2026

---

## Phase 1: Foundation ✅

- [x] Schema definition (v1.0)
- [x] TypeScript types
- [x] DID specification
- [x] Example credentials
- [x] Documentation

---

## Phase 2: Core Implementation

See [Phase 2 Architecture](./PHASE2-ARCHITECTURE.md) for locked decisions.

| Task | Description |
|------|--------------|
| 2.1 | DID generation — `lib/did/generate.ts` ✅ |
| 2.2 | Credential builder — `lib/credential/builder.ts` ✅ |
| 2.3 | Validation — JSON Schema + type guards |
| 2.4 | Canonicalization (RFC 8785) + signature envelope |
| 2.5 | Sign/Verify with Ed25519 |
| 2.6 | Multi-axis verification API |
| 2.7 | NDJSON serialization |
| 2.8 | Credential issuance — `lib/issuance/issue.ts` |

---

## Phase 3: ServicePath Integration

| Task | Description |
|------|--------------|
| 3.1 | Wire credential emission from negotiation trainer |
| 3.2 | Wire from compliance workflow |
| 3.3 | Notion → ServiceVerified bridge (optional) |
| 3.4 | Session aggregation (multi-turn → single credential) |

---

## Phase 4: Verification & Portability

| Task | Description |
|------|--------------|
| 4.1 | Verification API / endpoint |
| 4.2 | Portable certificate format (SCA-compliant) |
| 4.3 | Public verification URL |
| 4.4 | Status check by DID |

---

## Phase 5: Ecosystem

| Task | Description |
|------|--------------|
| 5.1 | ServiceVerified landing page |
| 5.2 | Virgil OS / CYW OS cross-links |
| 5.3 | Contruil site integration |
| 5.4 | npm package publication |

---

## Phase 6: Scale

| Task | Description |
|------|--------------|
| 6.1 | DID resolution service |
| 6.2 | Revocation registry |
| 6.3 | Analytics (anonymous) |
| 6.4 | Enterprise tier features |
