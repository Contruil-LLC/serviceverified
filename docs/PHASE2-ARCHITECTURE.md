# Phase 2 Architecture — Locked Decisions

**Status:** Locked as of February 2026

---

## 1. Evidence Contract

| Item | Decision |
|------|----------|
| `.withEvidence()` | **Last-write-wins** — each call overwrites the previous. Intentional. |
| Multiple items | Consolidate into single payload: `{ type, payload: { items: [...] } }` |
| Future extension | `.appendEvidence()` for additive behavior (does not change `.withEvidence()`) |

---

## 2. Verification Model (Multi-Axis)

Verification is **6 independent checks**. Valid signature ≠ valid credential.

| Axis | Description |
|------|-------------|
| Signature | Ed25519 verification |
| DID format | Valid `did:tw:serviceverified:<uuid>` |
| DID resolution | Credential found in resolution store |
| Status | `approved` (not pending/rejected/expired/revoked) |
| Time | Not expired (`expires_at` if present) |
| Evidence | Schema-valid, present |

**Error reporting:** Per-axis results; detailed feedback on failure.

---

## 3. DID Resolution

| Phase | Strategy |
|-------|----------|
| Phase 2 | File-backed NDJSON — append-only audit log, deterministic, Git-friendly |
| Phase 3+ | PostgreSQL migration for scale |

---

## 4. Phase 2 Build Order

| Week | Tasks |
|------|-------|
| 1 | Canonicalization (RFC 8785), signature envelope (versioned) |
| 2 | Sign/Verify with Ed25519, multi-axis verification API |

---

## 5. Cryptography

| Item | Decision |
|------|----------|
| Algorithm | **Ed25519** (Ed25519Signature2020, W3C) |
| Library | `@noble/ed25519` |
| Envelope | Versioned signature envelope for evolution |

**Not used:** secp256k1 (blockchain-specific), HMAC (requires shared secret, not third-party verifiable).

---

## References

- [API Quick Reference](./API-QUICK-REFERENCE.md)
- [Integration Roadmap](./INTEGRATION-ROADMAP.md)
- [DID Specification](./DID-SPECIFICATION.md)
- [DID Resolution Strategy](./DID-RESOLUTION-STRATEGY.md) — Options 1–3, implementation code
- [Phase 2 Build Order](./PHASE2-BUILD-ORDER.md) — Canonicalization, envelope, sign/verify, multi-axis
