# Data-Driven Migration Testing

## Problem

Saved object migrations transform JSON attributes between OSD versions (e.g., fixing `visState`, `panelsJSON`, `searchSourceJSON`). Today, migration tests are scattered across individual plugins with no unified framework. When a migration is added or modified, there's no systematic way to verify it works across all storage backends.

## Proposal

A data-driven test framework using JSON fixtures that define input/output pairs for each migration:

```
tests/migrations/fixtures/
├── dashboard/
│   ├── v1.0.0.json    # { input: {...}, expected: {...} }
│   ├── v2.0.0.json
│   └── v7.3.0.json
├── visualization/
│   ├── v1.0.0.json
│   └── v7.10.0.json
├── index-pattern/
│   └── v1.0.0.json
└── search/
    └── v1.0.0.json
```

### Fixture format

```json
{
  "description": "Migrate dashboard searchSource index pattern from string to reference",
  "type": "dashboard",
  "migrationVersion": "7.0.0",
  "input": {
    "id": "test-dash",
    "type": "dashboard",
    "attributes": {
      "title": "My Dashboard",
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"logstash-*\"}"
      }
    },
    "references": []
  },
  "expected": {
    "references_length": 1,
    "references_contain": [
      { "type": "index-pattern", "id": "logstash-*" }
    ],
    "attributes_has": ["kibanaSavedObjectMeta"]
  }
}
```

### Test runner

Each plugin has a `migration_fixtures.test.ts` that loads fixtures and runs them through the plugin's migration functions:

```typescript
import { dashboardSavedObjectTypeMigrations } from './dashboard_migrations';

const fixtures = loadFixtures(path.join(__dirname, 'test_fixtures'));
const migrations = dashboardSavedObjectTypeMigrations;
const contextMock = savedObjectsServiceMock.createMigrationContext();

describe('dashboard data-driven migration tests', () => {
  fixtures.forEach((fixture) => {
    const migration = migrations[fixture.migrationVersion];
    it(fixture.description, () => {
      const result = migration(fixture.input, contextMock);
      // Asserts on references_length, references_contain,
      // attributes_has, attributes_equals
    });
  });
});
```

## Current coverage

Existing migration tests by plugin (as of this writing):

| Plugin | Migration test file | Versions covered |
|--------|-------------------|-----------------|
| dashboard | `dashboard_migrations.test.ts`, `migrations_730.test.ts` | 7.0.0, 7.3.0 |
| visualization | `visualization_migrations.test.ts` | 7.0.0, 7.2.0, 7.4.2, 7.10.0 |
| search | `search_migrations.test.ts` | 7.0.0, 7.4.0, 7.9.3 |

These tests exist but are not data-driven — they're hand-written per migration function.

## When to use

### Add a fixture when:
- Adding a new migration to a saved object type
- Modifying an existing migration function
- Fixing a bug in migration logic
- Adding a new saved object type with migrations

### Update fixtures when:
- Changing the saved object schema (attributes structure)
- Adding new fields that need migration defaults
- Changing reference handling

## Benefits

- **Backend-agnostic** — same fixtures test OpenSearch, SQLite, DynamoDB, or any future backend
- **Regression safety** — fixtures catch unintended changes to migration output
- **Documentation** — fixtures serve as concrete examples of what each migration does
- **AI-friendly** — structured JSON fixtures are easy for AI tools to generate, validate, and extend
- **CI integration** — a check can detect when `migrations` map changes and remind authors to add/update fixtures

## Future: CI reminder

A GitHub Action or pre-commit hook that:
1. Detects changes to files matching `**/migrations*.ts` or `migrations:` in saved object type definitions
2. Checks if corresponding fixtures were added/updated
3. Posts a reminder comment if not

```yaml
# .github/workflows/migration-check.yml
- name: Check migration fixtures
  run: |
    CHANGED=$(git diff --name-only origin/main | grep -E "migration" || true)
    FIXTURES=$(git diff --name-only origin/main | grep "fixtures/" || true)
    if [ -n "$CHANGED" ] && [ -z "$FIXTURES" ]; then
      echo "⚠️ Migration files changed but no test fixtures updated"
    fi
```
