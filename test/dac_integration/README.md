# Dashboards-as-Code (DaC) Integration Tests

Integration tests for the Dashboards-as-Code feature in OpenSearch Dashboards. These tests exercise the DaC API endpoints (`_validate`, `_diff`, `_bulk_apply`, `_export_clean`, `_schemas`) against a real running OSD instance using the Functional Test Runner (FTR).

## Prerequisites

- Node.js (version matching the project's `.node-version`)
- A running OpenSearch cluster
- A running OpenSearch Dashboards instance connected to that cluster

## Starting OSD for Testing

### Option A: Using the FTR's built-in server management

The FTR can start OpenSearch and OSD automatically:

```bash
node scripts/functional_tests_server --config test/dac_integration/config.ts
```

Wait until you see "server running" in the output, then run the tests in a separate terminal.

### Option B: Using an existing dev server

Start OSD in development mode:

```bash
yarn start --no-base-path
```

Ensure `server.xsrf.disableProtection=true` is set in `opensearch_dashboards.yml` or passed as a CLI flag, since the tests send requests without browser XSRF tokens (they use the `osd-xsrf` header instead).

### Option C: Docker Compose

If the project provides a `docker-compose.yml` for test infrastructure, use it:

```bash
docker-compose up -d opensearch opensearch-dashboards
```

## Running the Tests

Run the full DaC integration test suite:

```bash
node scripts/functional_tests --config test/dac_integration/config.ts
```

Run tests against a manually started server (skips automatic server management):

```bash
node scripts/functional_test_runner --config test/dac_integration/config.ts
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TEST_OPENSEARCH_DASHBOARDS_HOST` | `localhost` | Hostname of the OSD instance |
| `TEST_OPENSEARCH_DASHBOARDS_PORT` | `5601` | Port of the OSD instance |
| `TEST_OPENSEARCH_DASHBOARDS_URL` | Composed from host/port | Full URL override for the OSD instance |

Example with a custom URL:

```bash
TEST_OPENSEARCH_DASHBOARDS_URL=http://localhost:5601 \
  node scripts/functional_test_runner --config test/dac_integration/config.ts
```

## Test Structure

```
test/dac_integration/
  config.ts                   # FTR configuration
  ftr_provider_context.d.ts   # TypeScript type for FTR service injection
  apis/
    index.ts                  # Registers all test suites
    validate.ts               # POST /api/saved_objects/_validate
    diff.ts                   # POST /api/saved_objects/_diff
    bulk_apply.ts             # POST /api/saved_objects/_bulk_apply
    export_clean.ts           # POST /api/saved_objects/_export_clean
    schemas.ts                # GET  /api/saved_objects/_schemas
    end_to_end.ts             # Full create-validate-diff-apply-export workflow
  helpers/
    dashboard_fixtures.ts     # Realistic dashboard/visualization/search fixtures
    test_utils.ts             # Helpers for creating, deleting, and cleaning up objects
```

## Writing New Tests

Follow the existing patterns:

1. Export a default function that receives `{ getService }` from the FTR context.
2. Use `getService('supertest')` to get the HTTP client.
3. Always set the `osd-xsrf: true` header on mutating requests.
4. Clean up any created objects in `after()` hooks.
5. Use the `dacTestId()` helper to generate prefixed IDs for easy identification and cleanup.
