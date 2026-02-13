# DID Resolution Strategy - Phase 2 Decision

## Problem Statement

`publishDIDDocument(did, document)` needs concrete implementation. Three options exist, each with different tradeoffs for determinism, audit chains, and development velocity.

## Options

### Option 1: In-Memory Registry (Development Only)

**Implementation:**
```typescript
// lib/did/resolve.ts
const didRegistry = new Map<string, DIDDocument>();

export function publishDIDDocument(did: string, document: DIDDocument): void {
  didRegistry.set(did, document);
}

export async function resolveDID(did: string): Promise<DIDDocument> {
  const doc = didRegistry.get(did);
  if (!doc) throw new Error(`DID not found: ${did}`);
  return doc;
}
```

**Pros:**
- ✅ Fastest implementation (1 hour)
- ✅ No external dependencies
- ✅ Deterministic within process
- ✅ Perfect for unit tests

**Cons:**
- ❌ Ephemeral (lost on restart)
- ❌ Not suitable for production
- ❌ No audit trail
- ❌ No multi-instance support

**Use Case:** Phase 2 development, unit testing

---

### Option 2: File-Backed Registry (NDJSON + Git)

**Implementation:**
```typescript
// lib/did/resolve.ts
import { appendFile, readFile } from 'fs/promises';

const DID_REGISTRY_PATH = './data/did-registry.ndjson';

export async function publishDIDDocument(did: string, document: DIDDocument): Promise<void> {
  const record = {
    did,
    document,
    publishedAt: new Date().toISOString(),
    operation: 'create'
  };

  await appendFile(DID_REGISTRY_PATH, JSON.stringify(record) + '\n');
}

export async function resolveDID(did: string): Promise<DIDDocument> {
  const content = await readFile(DID_REGISTRY_PATH, 'utf-8');
  const lines = content.trim().split('\n');

  // Last write wins
  for (let i = lines.length - 1; i >= 0; i--) {
    const record = JSON.parse(lines[i]);
    if (record.did === did) {
      return record.document;
    }
  }

  throw new Error(`DID not found: ${did}`);
}
```

**Pros:**
- ✅ Persistent across restarts
- ✅ Audit trail (append-only log)
- ✅ Version control (Git)
- ✅ Deterministic ordering
- ✅ Easy backup/restore
- ✅ Human-readable

**Cons:**
- ⚠️ File I/O overhead
- ⚠️ Linear search (slow for many DIDs)
- ⚠️ Locking required for concurrent writes
- ❌ Not suitable for multi-server deployment

**Use Case:** Phase 2 staging, small-scale production (<10k credentials)

---

### Option 3: Network-Backed Registry (PostgreSQL)

**Implementation:**
```typescript
// lib/did/resolve.ts
import { pool } from './db';

export async function publishDIDDocument(did: string, document: DIDDocument): Promise<void> {
  await pool.query(
    `INSERT INTO did_documents (did, document, published_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (did) DO UPDATE
     SET document = $2, updated_at = NOW()`,
    [did, JSON.stringify(document)]
  );
}

export async function resolveDID(did: string): Promise<DIDDocument> {
  const result = await pool.query(
    `SELECT document FROM did_documents WHERE did = $1`,
    [did]
  );

  if (result.rows.length === 0) {
    throw new Error(`DID not found: ${did}`);
  }

  return JSON.parse(result.rows[0].document);
}
```

**Database Schema:**
```sql
CREATE TABLE did_documents (
  did TEXT PRIMARY KEY,
  document JSONB NOT NULL,
  published_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_did_published ON did_documents(published_at);

-- Audit trail table
CREATE TABLE did_history (
  id SERIAL PRIMARY KEY,
  did TEXT NOT NULL,
  document JSONB NOT NULL,
  operation TEXT NOT NULL,  -- 'create', 'update', 'deactivate'
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Pros:**
- ✅ Fast lookups (indexed)
- ✅ Multi-instance support
- ✅ ACID guarantees
- ✅ Concurrent writes handled
- ✅ Scalable to millions of DIDs
- ✅ Audit trail (history table)

**Cons:**
- ⚠️ External dependency (PostgreSQL)
- ⚠️ Requires database setup
- ⚠️ More complex deployment
- ⚠️ Not deterministic across databases

**Use Case:** Production at scale

---

## Recommendation for Phase 2

**Start with Option 2 (File-Backed), Plan for Option 3**

### Rationale

1. **Audit Chain**: NDJSON provides immutable append-only log
2. **Git Integration**: Natural version control and backup
3. **Determinism**: Replay-able for testing
4. **Migration Path**: Easy to migrate to PostgreSQL later
5. **Development Velocity**: Simple to implement (2-3 hours)

### Implementation Plan

```typescript
// Phase 2.1: File-backed (Week 1)
export const DIDRegistry = {
  publish: publishDIDDocument,   // NDJSON append
  resolve: resolveDID,            // NDJSON scan
  list: listDIDs                  // All DIDs
};

// Phase 2.2: Add caching (Week 2)
const didCache = new LRU<string, DIDDocument>(1000);

export async function resolveDID(did: string): Promise<DIDDocument> {
  // Check cache first
  const cached = didCache.get(did);
  if (cached) return cached;

  // Fall back to file
  const doc = await resolveDIDFromFile(did);
  didCache.set(did, doc);
  return doc;
}

// Phase 3: Migrate to PostgreSQL (Week 6-8)
// Export NDJSON → Import to PostgreSQL
// Swap implementation, keep interface
```

### File Structure

```
data/
├── did-registry.ndjson          # All DID operations
├── did-registry.ndjson.backup   # Daily backup
└── credentials/
    ├── a1b2c3d4.json           # Individual credential files
    └── b2c3d4e5.json
```

---

## Decision

**Phase 2:** Option 2 (File-backed NDJSON) — locked per [PHASE2-ARCHITECTURE.md](./PHASE2-ARCHITECTURE.md)

---

## Example NDJSON Format

```ndjson
{"did":"did:tw:serviceverified:a1b2c3d4-...","document":{...},"operation":"create","timestamp":"2025-02-13T10:00:00Z"}
{"did":"did:tw:serviceverified:b2c3d4e5-...","document":{...},"operation":"create","timestamp":"2025-02-13T10:01:00Z"}
{"did":"did:tw:serviceverified:a1b2c3d4-...","document":{...},"operation":"update","timestamp":"2025-02-13T11:00:00Z"}
{"did":"did:tw:serviceverified:c3d4e5f6-...","document":{...},"operation":"create","timestamp":"2025-02-13T12:00:00Z"}
```

Each line is:
- **Append-only**: Never modify existing lines
- **Last-write-wins**: Most recent operation for a DID is current
- **Audit trail**: Full history preserved
- **Git-friendly**: Easy to diff and merge
