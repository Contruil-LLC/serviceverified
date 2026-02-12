# ServiceVerified DID Specification

**Method:** `did:tw:serviceverified`  
**Version:** 1.0  
**Status:** Draft

---

## Method Format

```
did:tw:serviceverified:<uuid>
```

| Component | Value | Description |
|-----------|-------|-------------|
| Scheme | `did` | Decentralized Identifier scheme |
| Namespace | `tw` | Contruil (Timothy Wheels) namespace |
| Method | `serviceverified` | ServiceVerified credential method |
| Method-specific ID | `<uuid>` | UUID v4 credential identifier |

---

## UUID Requirements

- **Format:** RFC 4122 UUID v4
- **Example:** `550e8400-e29b-41d4-a716-446655440000`
- **Uniqueness:** One DID per credential; no reuse
- **Case:** Lowercase hex preferred for canonical form

---

## DID Resolution (Planned)

Phase 2+ will define resolution semantics:

1. **Local resolution** — Credential lookup by ID
2. **Status check** — pending | approved | rejected | expired | revoked
3. **Evidence retrieval** — Structured evidence payload

---

## Examples

```
did:tw:serviceverified:550e8400-e29b-41d4-a716-446655440000
did:tw:serviceverified:a1b2c3d4-e5f6-4789-a012-3456789abcde
```

---

## Security Considerations

- DIDs are identifiers, not secrets
- Credential verification requires separate proof/signature (Phase 2)
- Revocation is signaled via `status: "revoked"`
