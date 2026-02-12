# ServiceVerified

**Compliance credentials. Verifiable. Portable. DID-anchored.**

ServiceVerified is the third pillar of the Contruil ecosystem — the credential layer that transforms compliance from checkboxes into independently verifiable, portable credentials.

---

## Vision

| Pillar | Domain | Purpose |
|--------|--------|---------|
| **Virgil OS** | Identity, Navigation, Sovereignty | Decision framework and cognitive architecture |
| **CYW OS** | Infrastructure, Governance, Schemas | Control Your World operating system |
| **ServiceVerified** | Compliance, Verification, Certificates | Credential issuance and verification |

---

## DID Format

```
did:tw:serviceverified:<uuid>
```

- `tw` — Contruil namespace
- `serviceverified` — method
- `<uuid>` — credential ID (v4 UUID)

See [docs/DID-SPECIFICATION.md](docs/DID-SPECIFICATION.md) for the full specification.

---

## Quick Start

```bash
npm install
npm run build
```

```typescript
import { serviceVerifiedDid, type ServiceVerifiedCredential } from "@contruil/service-verified";

const did = serviceVerifiedDid("550e8400-e29b-41d4-a716-446655440000");
// => "did:tw:serviceverified:550e8400-e29b-41d4-a716-446655440000"
```

---

## Schema

Credentials follow the [ServiceVerified v1.0 schema](schemas/service-verified-v1.0.schema.json). Each credential includes:

- `did` — DID identifier
- `status` — pending | approved | rejected | expired | revoked
- `source` — workflow that produced the credential
- `evidence` — structured payload (ISO 27001, SOC 2, HIPAA, etc.)
- `created_at` / `updated_at` — ISO 8601 timestamps

---

## Integration

ServiceVerified is produced by **ServicePath** (contruil.com). Workflows collect evidence, move through a state machine, and emit credentials anchored to DIDs.

```
ServicePath (workflow engine)
    │
    ├── collects evidence
    ├── state machine
    ├── DID anchoring
    │
    └── produces ──▶ ServiceVerified Credential
```

See [docs/INTEGRATION-ROADMAP.md](docs/INTEGRATION-ROADMAP.md) for the 6-phase integration plan.

---

## License

Proprietary — Contruil LLC. U.S. Patent Pending (63/980,310).
