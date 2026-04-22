# Pluggable Storage Backend for Saved Objects

- **RFC:** [opensearch-project/OpenSearch-Dashboards#11772](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/11772)
- **Status:** Draft / Proof of Concept
- **PR:** [opensearch-project/OpenSearch-Dashboards#11771](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/11771)

## Overview

SQLite implementation of `ISavedObjectsRepository` that allows running OSD without an OpenSearch cluster. Uses the existing repository factory provider hook — zero changes to the saved objects client or routes.

## Architecture

```
┌─────────────────────────────────────────┐
│         SavedObjectsClient              │  ← No changes
├─────────────────────────────────────────┤
│    SavedObjectsClientProvider           │  ← No changes
├─────────────────────────────────────────┤
│      ISavedObjectsRepository            │  ← THE abstraction boundary
├──────────┬──────────┬───────────────────┤
│OpenSearch│  SQLite  │  Community        │  ← Direct implementations
│Repository│Repository│  Repositories     │
│(default) │(built-in)│  (via plugins)    │
└──────────┴──────────┴───────────────────┘
```

## Key Components

| File | Description |
|------|-------------|
| `src/core/server/saved_objects/storage/sqlite_repository.ts` | `SqliteSavedObjectsRepository implements ISavedObjectsRepository` |
| `src/core/server/saved_objects/storage/sqlite_repository.test.ts` | 29 tests |
| `src/core/server/saved_objects/saved_objects_config.ts` | Configuration schema for backend selection |
| `src/core/server/saved_objects/saved_objects_service.ts` | Service integration (factory provider wiring) |

## Configuration

```yaml
# opensearch_dashboards.yml
savedObjects.storage.backend: "sqlite"
savedObjects.storage.sqlite.path: "data/osd-metadata.db"
```

## How it's wired

In `saved_objects_service.ts` `setup()`, the factory provider is set. It receives `migrator` and `typeRegistry` when called during `start()`:

```typescript
this.respositoryFactoryProvider = ({ migrator, includedHiddenTypes }) => {
  return new SqliteSavedObjectsRepository({
    dbPath, migrator, typeRegistry, serializer, includedHiddenTypes,
  });
};
```

## Document migrations

`SqliteSavedObjectsRepository` calls `_migrator.migrateDocument()` on all read/write paths:
- `create()`, `bulkCreate()` — migrate before writing
- `get()`, `bulkGet()`, `find()` — migrate on read
- `update()`, `incrementCounter()` — migrate merged attributes before writing

This ensures saved objects are always at the current migration version regardless of storage backend.
