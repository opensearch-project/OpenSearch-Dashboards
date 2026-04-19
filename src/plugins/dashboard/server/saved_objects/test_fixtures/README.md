# Data-Driven Migration Test Fixtures

Drop a JSON file here to add a migration test. No code changes needed.

## Fixture format

```json
{
  "description": "Human-readable description of what this migration does",
  "type": "dashboard",
  "migrationVersion": "7.0.0",
  "input": {
    "id": "test-id",
    "type": "dashboard",
    "attributes": { ... },
    "references": []
  },
  "expected": {
    "references_length": 2,
    "references_contain": [{ "type": "index-pattern", "id": "logs-*" }],
    "attributes_has": ["panelsJSON"],
    "attributes_equals": { "key": "expected-value" }
  }
}
```

## Expected fields (all optional)

| Field | What it checks |
|-------|---------------|
| `references_length` | Exact count of references after migration |
| `references_contain` | References array includes these objects |
| `attributes_has` | These attribute keys exist |
| `attributes_equals` | These attribute key/values match exactly |

## Adding a test

1. Create a JSON file: `<version>_<description>.json`
2. Set `migrationVersion` to the migration version to test
3. Define `input` (the saved object before migration)
4. Define `expected` (what to assert after migration)
5. Run: `yarn test:jest <path>/migration_fixtures.test.ts`

## Current fixtures

See JSON files in this directory.
