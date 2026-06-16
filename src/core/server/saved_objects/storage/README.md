# Saved Objects Storage Backend

SQLite implementation of `ISavedObjectsRepository` for OpenSearch Dashboards. Allows running OSD without an OpenSearch cluster for development, testing, and edge deployments.

**RFC:** [#11772](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/11772)

## Architecture

```
SavedObjectsClient (unchanged)
  └─ ISavedObjectsRepository              ← THE abstraction boundary
       ├─ SavedObjectsRepository           ← OpenSearch (default)
       └─ SqliteSavedObjectsRepository     ← SQLite (this module)
```

No adapter layer — `SqliteSavedObjectsRepository` implements `ISavedObjectsRepository` directly with access to `_migrator`, `_registry`, `_serializer`, and `_allowedTypes`.

## Files

| File | Purpose |
|------|---------|
| `sqlite_repository.ts` | `SqliteSavedObjectsRepository` — direct `ISavedObjectsRepository` implementation |
| `sqlite_repository.test.ts` | 24 tests covering CRUD, bulk ops, find, migrations, namespaces, workspaces |
| `index.ts` | Public exports |

## Key design decisions

- **Implements `ISavedObjectsRepository` directly** — no intermediate `StorageBackend` interface or adapter layer
- **Calls `_migrator.migrateDocument()`** on every read/write path (create, get, update, find, bulkGet, bulkCreate)
- **Wired via `setRepositoryFactoryProvider`** — receives migrator, typeRegistry, includedHiddenTypes at call time
- **Uses `_allowedTypes` and `_registry`** for type validation and namespace-aware deletes

## Usage

```bash
yarn start --savedObjects.storage.backend=sqlite
```

## Tests

```bash
# All storage tests (24 tests)
yarn test:jest src/core/server/saved_objects/storage/

# Service tests (21 tests)
yarn test:jest src/core/server/saved_objects/saved_objects_service.test.ts
```

## Adding a new backend

1. Implement `ISavedObjectsRepository` directly (see `sqlite_repository.ts`)
2. Accept `migrator`, `typeRegistry`, `serializer` via constructor
3. Call `_migrator.migrateDocument()` on all read/write paths
4. Wire via `setRepositoryFactoryProvider` in a plugin or core

## Known limitations (Phase 1)

### Functional gaps vs OpenSearch backend

| Feature | OpenSearch | SQLite | Impact |
|---------|-----------|--------|--------|
| KQL/Lucene filter in `find()` | ✅ Full DSL | ❌ `LIKE` substring only | Complex saved object queries won't work |
| `searchFields` / `rootSearchFields` | ✅ Per-field search | ❌ Searches entire JSON blob | May match unintended fields |
| Multi-namespace types (`namespaceType: 'multiple'`) | ✅ Object in multiple namespaces | ❌ Single namespace per row | `addToNamespaces`/`deleteFromNamespaces` are no-ops |
| Namespace-agnostic types (`namespaceType: 'agnostic'`) | ✅ Visible across all namespaces | ❌ Always filters by namespace | Global config objects may not be found cross-namespace |
| `typeToNamespacesMap` | ✅ Cross-namespace type queries | ❌ Not supported | Security plugin multi-tenant visibility won't work |
| Hidden type enforcement | ✅ `_allowedTypes` filtering | ⚠️ Partial (constructor-level) | Not enforced per-method |
| `fields` option (partial response) | ✅ Returns only requested fields | ❌ Always returns all fields | Slightly more data over the wire |
| `preference` (read routing) | ✅ Routing preference | ❌ N/A (single file) | No impact for single-node |

### Operational limitations

- SQLite is single-writer — not suitable for multi-node OSD clusters
- No migration tooling between backends yet
- `find()` sort only supports `type`, `id`, `updated_at`, `version` columns
