# Phase 2 Build Order

**Goal:** Implement signatures without breaking architecture or creating technical debt.

## Critical Principle

> **Canonicalization BEFORE Signatures**
>
> You cannot verify a signature if you don't know exactly what bytes were signed.

---

## Step 1: Canonicalization (Week 1)

**Priority:** P0 - Everything else depends on this

### Requirements

1. **Deterministic serialization**: Same credential → Same bytes, always
2. **Whitespace insensitive**: Formatting doesn't change signature
3. **Key order independent**: `{a: 1, b: 2}` === `{b: 2, a: 1}`
4. **Version-tagged**: So we can change it later

### Implementation

```typescript
// lib/crypto/canonicalize.ts

/**
 * Canonicalize a credential for signing
 *
 * Uses JSON Canonicalization Scheme (JCS) RFC 8785
 * https://datatracker.ietf.org/doc/html/rfc8785
 */
export function canonicalizeCredential(credential: ServiceVerifiedCredential): string {
  // 1. Remove signature field if present
  const { verification, ...credentialWithoutSig } = credential;

  // 2. Sort keys alphabetically at all levels
  const sorted = sortKeysDeep(credentialWithoutSig);

  // 3. Serialize with no whitespace
  return JSON.stringify(sorted);
}

function sortKeysDeep(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortKeysDeep(obj[key]);
      return acc;
    }, {} as any);
}
```

### Test Cases

```typescript
describe('canonicalization', () => {
  it('produces same output for different key orders', () => {
    const cred1 = { did: "...", status: "approved", created_at: "..." };
    const cred2 = { status: "approved", created_at: "...", did: "..." };

    expect(canonicalizeCredential(cred1)).toBe(canonicalizeCredential(cred2));
  });

  it('removes whitespace', () => {
    const canonical = canonicalizeCredential(credential);
    expect(canonical).not.toContain(' ');
    expect(canonical).not.toContain('\n');
  });

  it('is deterministic', () => {
    const canonical1 = canonicalizeCredential(credential);
    const canonical2 = canonicalizeCredential(credential);
    expect(canonical1).toBe(canonical2);
  });
});
```

---

## Step 2: Signature Envelope (Week 1)

**Priority:** P0 - Enables evolution

### Design

```typescript
// lib/types/signature.ts

/**
 * Signature envelope - versioned for evolution
 */
export interface SignatureEnvelope {
  /** Version of signature format */
  version: '1.0';

  /** Signature algorithm */
  algorithm: 'Ed25519';

  /** Base64-encoded signature */
  signature: string;

  /** DID of the signer's public key */
  verificationMethod: string;

  /** Hash of the canonicalized credential (for debugging) */
  credentialHash: string;

  /** When the signature was created */
  created: string;  // ISO 8601
}

/**
 * Credential with signature
 */
export interface SignedCredential extends ServiceVerifiedCredential {
  /** Signature envelope */
  verification: SignatureEnvelope;
}
```

**Note:** Phase 2 uses Ed25519 only; secp256k1 deferred per [PHASE2-ARCHITECTURE.md](./PHASE2-ARCHITECTURE.md).

---

## Step 3: Sign + Verify (Week 2)

**Priority:** P0 - Core functionality

### Sign Implementation

```typescript
// lib/crypto/sign.ts
import * as ed from '@noble/ed25519';
import { createHash } from 'crypto';

export async function signCredential(
  credential: ServiceVerifiedCredential,
  privateKey: Uint8Array
): Promise<SignedCredential> {
  // 1. Canonicalize
  const canonical = canonicalizeCredential(credential);

  // 2. Hash (for integrity check)
  const hash = createHash('sha256').update(canonical).digest('hex');

  // 3. Sign the canonical bytes
  const signature = await ed.sign(
    Buffer.from(canonical, 'utf-8'),
    privateKey
  );

  // 4. Create signature envelope
  const envelope: SignatureEnvelope = {
    version: '1.0',
    algorithm: 'Ed25519',
    signature: Buffer.from(signature).toString('base64'),
    verificationMethod: `${credential.did}#key-1`,
    credentialHash: hash,
    created: new Date().toISOString()
  };

  // 5. Return signed credential
  return {
    ...credential,
    verification: envelope
  };
}
```

### Verify Implementation

```typescript
// lib/crypto/verify.ts

export async function verifySignature(
  credential: SignedCredential,
  publicKey: Uint8Array
): Promise<boolean> {
  // 1. Extract signature
  const { verification, ...credentialWithoutSig } = credential;

  // 2. Canonicalize (same as signing)
  const canonical = canonicalizeCredential(credentialWithoutSig);

  // 3. Verify hash (optional integrity check)
  const hash = createHash('sha256').update(canonical).digest('hex');
  if (hash !== verification.credentialHash) {
    console.warn('Hash mismatch - credential may be corrupted');
  }

  // 4. Verify signature
  const signatureBytes = Buffer.from(verification.signature, 'base64');

  return await ed.verify(
    signatureBytes,
    Buffer.from(canonical, 'utf-8'),
    publicKey
  );
}
```

---

## Step 4: Multi-Axis Verification (Week 2)

**Priority:** P1 - User-facing API

### Implementation

```typescript
// lib/verification/verify.ts

export async function verifyCredential(
  credential: SignedCredential
): Promise<VerificationResult> {
  const checks = {
    signatureValid: false,
    didFormatValid: false,
    didResolvable: false,
    statusValid: false,
    timeValid: false,
    evidenceValid: false
  };

  const errors: VerificationResult['errors'] = [];

  // Check 1: DID format
  checks.didFormatValid = isValidDid(credential.did);
  if (!checks.didFormatValid) {
    errors.push({ check: 'didFormatValid', code: 'INVALID_DID_FORMAT', message: `Invalid DID: ${credential.did}` });
  }

  // Check 2: DID resolution
  try {
    const didDoc = await resolveDID(credential.did);
    checks.didResolvable = !!didDoc;
  } catch (e) {
    errors.push({ check: 'didResolvable', code: 'DID_NOT_FOUND', message: `Could not resolve DID: ${credential.did}` });
  }

  // Check 3: Signature (if DID resolved)
  if (checks.didResolvable) {
    try {
      const didDoc = await resolveDID(credential.did);
      const publicKey = extractPublicKey(didDoc);
      checks.signatureValid = await verifySignature(credential, publicKey);
    } catch (e) {
      errors.push({ check: 'signatureValid', code: 'SIGNATURE_VERIFICATION_FAILED', message: 'Could not verify signature' });
    }
  }

  // Check 4: Status
  checks.statusValid = !['revoked', 'rejected'].includes(credential.status);
  if (!checks.statusValid) {
    errors.push({ check: 'statusValid', code: 'CREDENTIAL_INVALID_STATUS', message: `Status is ${credential.status}` });
  }

  // Check 5: Time validity (uses expires_at per credential schema)
  if (credential.expires_at) {
    checks.timeValid = new Date() <= new Date(credential.expires_at);
    if (!checks.timeValid) {
      errors.push({ check: 'timeValid', code: 'CREDENTIAL_EXPIRED', message: `Expired at ${credential.expires_at}` });
    }
  } else {
    checks.timeValid = true;
  }

  // Check 6: Evidence structure
  checks.evidenceValid = !!(
    credential.evidence?.type &&
    credential.evidence?.payload &&
    typeof credential.evidence.payload === 'object'
  );
  if (!checks.evidenceValid) {
    errors.push({ check: 'evidenceValid', code: 'INVALID_EVIDENCE', message: 'Evidence missing or malformed' });
  }

  const valid = Object.values(checks).every(v => v === true);

  return {
    valid,
    checks,
    credential: {
      did: credential.did,
      status: credential.status,
      issuedAt: credential.created_at,
      source: credential.source
    },
    errors: errors.length > 0 ? errors : undefined
  };
}
```

---

## Build Order Summary

### Week 1

- [ ] **Day 1-2**: Canonicalization implementation + tests
- [ ] **Day 3**: Signature envelope schema
- [ ] **Day 4-5**: DID resolution (file-backed NDJSON) per [DID-RESOLUTION-STRATEGY.md](./DID-RESOLUTION-STRATEGY.md)

### Week 2

- [ ] **Day 1-2**: Sign implementation
- [ ] **Day 3**: Verify signature implementation
- [ ] **Day 4-5**: Multi-axis verification + tests

### Success Criteria

- [ ] Canonicalization is deterministic (100% test coverage)
- [ ] Signature envelope is versioned
- [ ] Can sign and verify credentials
- [ ] Multi-axis verification returns detailed results
- [ ] All checks independent (signature ≠ validity)

---

## Testing Strategy

```typescript
describe('Phase 2: Signatures', () => {
  describe('Canonicalization', () => {
    test('deterministic', ...);
    test('key order independent', ...);
    test('whitespace insensitive', ...);
  });

  describe('Signing', () => {
    test('produces valid signature', ...);
    test('signature verifies', ...);
    test('modified credential fails verification', ...);
  });

  describe('Verification', () => {
    test('valid credential passes all checks', ...);
    test('revoked credential fails statusValid', ...);
    test('expired credential fails timeValid', ...);
    test('tampered credential fails signatureValid', ...);
    test('all checks are independent', ...);
  });
});
```
