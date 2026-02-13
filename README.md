# ServiceVerified

**Compliance credentials. Verifiable. Portable. DID-anchored.**

ServiceVerified is the third pillar of the Contruil ecosystem — the credential layer that transforms compliance from checkboxes into independently verifiable, portable credentials.

---

## Two Parts

### 1. Python CLI — Compliance Audit Tool

Court compliance tracking made auditable. Log service hours with immutable SQLite, calculate burn rates, export professional timesheets.

```bash
# Log hours: agency_id|hours|description|date(optional)
python cli/service_finder.py --log "1|4.0|Community Center volunteer|2026-01-15"

# Show burn rate status
python cli/service_finder.py --status

# Generate compliance report
python cli/service_finder.py --report
```

- **For:** Individuals managing court-ordered community service
- **Features:** Tamper-proof logging, burn rate analysis, court-ready timesheets
- **Tech:** Python 3.x, SQLite, append-only audit trail

### 2. TypeScript Foundation — Credential Layer

DID-anchored credentials for enterprise compliance (ISO 27001, SOC 2, HIPAA).

```bash
npm install
npm run build
```

```typescript
import { createCredential, generateDid, extractUuid } from "@contruil/service-verified";

const did = generateDid();
const credential = createCredential(extractUuid(did))
  .withStatus("approved")
  .withSource("servicepath.compliance.iso27001")
  .withEvidence({ type: "iso27001_attestation", payload: { scope: "ISMS" } })
  .build();
```

See [API Quick Reference](docs/API-QUICK-REFERENCE.md) for complete documentation.

- **For:** ServicePath, Contruil workflows, enterprise credential issuance
- **Features:** Schema, types, DID spec, parse utilities, NDJSON export
- **Tech:** TypeScript, JSON Schema

---

## DID Format

```
did:tw:serviceverified:<uuid>
```

See [docs/DID-SPECIFICATION.md](docs/DID-SPECIFICATION.md).

---

## Repository Structure

```
ServiceVerified/
├── README.md
├── package.json
├── tsconfig.json
├── cli/
│   └── service_finder.py        # Python compliance CLI
├── schemas/
│   └── service-verified-v1.0.schema.json
├── lib/
│   ├── index.ts
│   ├── did/
│   │   ├── generate.ts
│   │   └── parse.ts
│   ├── credential/
│   │   └── builder.ts
│   └── types/
│       └── credential.ts
├── docs/
│   ├── DID-SPECIFICATION.md
│   ├── INTEGRATION-ROADMAP.md
│   └── API-QUICK-REFERENCE.md
└── examples/
    ├── usage-demo.js
    ├── usage-demo-improved.js
    ├── iso27001-full.json
    ├── credential.ndjson
    └── sample_report.txt
```

---

## License

Proprietary — Contruil LLC. U.S. Patent Pending (63/980,310).
