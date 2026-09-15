# RFC: Dashboards-as-Code for OpenSearch Dashboards

|               |                                                     |
|---------------|-----------------------------------------------------|
| **Proposal**  | [RFC] Dashboards-as-Code for OpenSearch Dashboards  |
| **Status**    | Draft                                               |
| **Authors**   | OpenSearch Dashboards Team                          |
| **Created**   | 2026-03-23                                          |
| **Updated**   | 2026-03-23                                          |
| **Issue**     | _To be created_                                     |

## Summary

This RFC proposes adding Dashboards-as-Code (DaC) capabilities to OpenSearch Dashboards, enabling users to define, validate, version-control, and deploy dashboards programmatically. The design extends the existing Saved Objects API with typed schemas, validation endpoints, and a diff mechanism, then layers multi-language SDKs and a CLI on top.

## Motivation

### The Problem

Organizations managing OpenSearch Dashboards at scale face these challenges today:

1. **No programmatic dashboard definition.** Dashboards are created exclusively through the UI. Teams with 50-500+ dashboards cannot apply consistent standards, reuse components, or generate dashboards from templates.

2. **No version control integration.** Dashboard changes are not tracked in Git. There is no peer-review workflow, no rollback capability, and no audit trail of who changed what.

3. **Fragile migration/backup story.** The only bulk mechanism is ndjson export/import, which produces opaque blobs unsuitable for code review or meaningful diffs.

4. **No CI/CD pipeline support.** Dashboard deployment cannot be automated. Promoting dashboards across dev/staging/prod environments is manual and error-prone.

### Why Now

Every major observability platform has shipped or is actively building as-code capabilities:

- **Grafana 12** (2025): Foundation SDK (5 languages), grafanactl CLI, Git Sync, Dashboard Schema v2, Terraform provider updates
- **Perses** (CNCF): CUE + Go SDKs, percli CLI with build/diff/preview/lint, GitHub Actions, Kubernetes Operator
- **Datadog**: Official SDKs (6 languages), mature Terraform provider (2,755+ commits), Kubernetes Operator
- **Dynatrace**: Monaco CLI for config-as-code across observability + security

OpenSearch Dashboards risks becoming uncompetitive for teams that expect GitOps-style workflows for their observability stack.

### Goals

1. Enable programmatic dashboard definition in TypeScript, Python, Go, and Java
2. Extend the Saved Objects API with typed schemas, validation, and diff capabilities
3. Ship a CLI (`osdctl`) for build, validate, diff, apply, and pull workflows
4. Provide CI/CD integration (GitHub Actions, generic pipeline support)
5. Keep all features fully open-source

### Non-Goals (this RFC)

- Git Sync (bi-directional UI-to-Git synchronization) — deferred to a follow-up RFC
- Alerting-as-code, SLO-as-code — deferred to Phase 4
- Terraform/Pulumi providers — deferred to Phase 3
- Kubernetes Operator / CRDs — out of scope

---

## Design

### Architecture Overview

```
                                                  OpenSearch Dashboards Server
                                                 +---------------------------------+
                                                 |                                 |
+------------------+     +------------------+    |  +---------------------------+  |
| SDK (TS/Py/Go/   | --> | JSON/YAML files  | -->|  | Saved Objects API         |  |
| Java)            |     | (git-tracked)    |    |  | (extended)                |  |
+------------------+     +------------------+    |  |                           |  |
        |                        |               |  |  +-- _validate endpoint   |  |
        v                        v               |  |  +-- _diff endpoint       |  |
+------------------+     +------------------+    |  |  +-- _bulk_apply endpoint |  |
| osdctl CLI       | --> | CI/CD Pipeline   | -->|  |  +-- labels/annotations  |  |
| (build/validate/ |     | (GitHub Actions, |    |  |  +-- version counter     |  |
|  diff/apply/pull)|     |  GitLab CI, etc) |    |  +---------------------------+  |
+------------------+     +------------------+    |              |                   |
                                                 |              v                   |
                                                 |  +---------------------------+  |
                                                 |  | Saved Objects Store       |  |
                                                 |  | (.kibana index)           |  |
                                                 |  +---------------------------+  |
                                                 +---------------------------------+
```

The design has four layers:

1. **API Layer** — Extensions to the Saved Objects API (server-side)
2. **Schema Layer** — Typed, versioned JSON Schema definitions for each resource
3. **SDK Layer** — Multi-language builder libraries that compile to JSON/YAML
4. **CLI Layer** — Developer tool that orchestrates build, validate, diff, apply

Each layer builds on the one below it. The SDK and CLI are external tools; only the API and schema layers require changes to the OpenSearch Dashboards server.

---

### Layer 1: Saved Objects API Extensions

#### Design Principle

**Extend, don't replace.** The Saved Objects API is battle-tested. We add new endpoints alongside existing ones. Existing integrations (ndjson export, UI, programmatic CRUD) continue to work unchanged.

#### 1.1 Typed Schema Registry

Each Saved Object type gets a formal JSON Schema definition, registered at server startup.

```
src/core/server/saved_objects/schemas/
  dashboard.v1.json
  visualization.v1.json
  index-pattern.v1.json
  search.v1.json
```

**Schema structure** (example for dashboard):

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "opensearch-dashboards://saved-objects/dashboard/v1",
  "type": "object",
  "properties": {
    "title": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "panelsJSON": {
      "description": "Panel layout and configuration",
      "type": "array",
      "items": { "$ref": "#/$defs/panel" }
    },
    "optionsJSON": {
      "type": "object",
      "properties": {
        "useMargins": { "type": "boolean", "default": true },
        "hidePanelTitles": { "type": "boolean", "default": false }
      }
    },
    "timeRestore": { "type": "boolean" },
    "timeTo": { "type": "string" },
    "timeFrom": { "type": "string" },
    "refreshInterval": { "$ref": "#/$defs/refreshInterval" }
  },
  "required": ["title", "panelsJSON"]
}
```

**Schema versioning:** Schemas use `<type>/v<N>` versioning. The server exposes a `GET /api/saved_objects/_schemas` endpoint that returns all registered schemas, enabling SDK auto-generation.

```
GET /api/saved_objects/_schemas
GET /api/saved_objects/_schemas/dashboard/v1
```

#### 1.2 Validation Endpoint

```
POST /api/saved_objects/_validate
Content-Type: application/json

{
  "type": "dashboard",
  "attributes": { ... }
}
```

**Response (success):**
```json
{
  "valid": true,
  "warnings": []
}
```

**Response (failure):**
```json
{
  "valid": false,
  "errors": [
    {
      "path": "attributes.panelsJSON[2].gridData.w",
      "message": "must be >= 1",
      "schemaPath": "#/$defs/panel/properties/gridData/properties/w/minimum"
    }
  ]
}
```

**Validation modes** (via query parameter):
- `?mode=schema` — Validate against JSON Schema only (fast, offline-capable)
- `?mode=full` — Schema + server-side checks (data source existence, index pattern validity, plugin availability)

#### 1.3 Diff Endpoint

```
POST /api/saved_objects/_diff
Content-Type: application/json

{
  "type": "dashboard",
  "id": "my-dashboard-id",
  "attributes": { ... }
}
```

**Response:**
```json
{
  "status": "updated",
  "diff": [
    {
      "op": "replace",
      "path": "/attributes/title",
      "oldValue": "Old Title",
      "newValue": "New Title"
    },
    {
      "op": "add",
      "path": "/attributes/panelsJSON/3",
      "newValue": { "...": "new panel definition" }
    }
  ]
}
```

**Status values:** `new` (object doesn't exist yet), `updated` (changes detected), `unchanged` (identical), `error`.

#### 1.4 Labels and Annotations

Extend the Saved Object document structure:

```json
{
  "type": "dashboard",
  "id": "cpu-monitoring",
  "attributes": { "...": "..." },
  "labels": {
    "env": "production",
    "team": "platform",
    "managed-by": "osdctl"
  },
  "annotations": {
    "owner": "jane@company.com",
    "source-repo": "github.com/acme/dashboards",
    "last-applied-hash": "sha256:abc123..."
  }
}
```

**Query support:** Extend the existing `GET /api/saved_objects/_find` endpoint:

```
GET /api/saved_objects/_find?type=dashboard&labels=env:production,team:platform
```

**Behavioral notes:**
- `labels` are indexed and queryable. Keys and values are strings. Max 64 labels per object.
- `annotations` are stored but not indexed. Free-form metadata for tooling.
- The `managed-by` label identifies objects managed by as-code tooling. The UI shows a badge/indicator for these objects to prevent accidental manual edits.
- `last-applied-hash` annotation enables client-side drift detection.

#### 1.5 Optimistic Concurrency

Add a `version` field to Saved Objects (distinct from the existing internal `_version`):

```
PUT /api/saved_objects/dashboard/cpu-monitoring
If-Match: "5"

{ "attributes": { ... } }
```

**Behavior:**
- Every create/update increments `version` (integer, starting at 1).
- Update/delete requests with `If-Match` header are rejected with `409 Conflict` if the version doesn't match.
- `If-Match` is optional for backward compatibility — omitting it skips the check (existing behavior).
- The `version` is returned in all GET/find responses.

#### 1.6 Git-Diff-Friendly Export Format

New endpoint for clean, deterministic export:

```
GET /api/saved_objects/_export_clean?type=dashboard&id=cpu-monitoring
Accept: application/json  # or application/yaml
```

**Output design principles:**
- Sorted keys (deterministic JSON)
- No server-generated fields in the body (id, version, timestamps go in a separate `metadata` block)
- Panels as a flat array with named references (not deeply nested)
- Human-readable field names (not `panelsJSON` containing a stringified JSON blob)

**Example output:**

```yaml
apiVersion: dashboard/v1
metadata:
  name: cpu-monitoring
  project: my-workspace
  labels:
    env: production
    team: platform
  annotations:
    owner: jane@company.com
spec:
  title: "CPU Monitoring"
  description: "Production CPU metrics across all clusters"
  timeRange:
    from: "now-1h"
    to: "now"
  refreshInterval: "30s"
  panels:
    - name: cpu-usage
      type: visualization
      visualization: line
      gridPosition: { x: 0, y: 0, w: 24, h: 12 }
      query:
        language: PPL
        query: "source = metrics | where name = 'cpu.usage' | stats avg(value) by host"
      options:
        showLegend: true
    - name: cpu-by-host
      type: visualization
      visualization: heatmap
      gridPosition: { x: 0, y: 12, w: 24, h: 12 }
      query:
        language: DQL
        query: "cpu.usage:*"
  dataSources:
    - name: metrics-cluster
      type: opensearch
      default: true
```

**Compatibility:** The existing ndjson export continues to work unchanged. The clean format is opt-in.

#### 1.7 Bulk Apply Endpoint

```
POST /api/saved_objects/_bulk_apply
Content-Type: application/json

{
  "resources": [
    { "type": "dashboard", "id": "cpu-monitoring", "attributes": { ... } },
    { "type": "visualization", "id": "cpu-line-chart", "attributes": { ... } }
  ],
  "options": {
    "dryRun": false,
    "overwrite": true,
    "createMissing": true
  }
}
```

**Behavior:**
- Creates objects that don't exist, updates those that do (upsert semantics).
- `dryRun: true` — validates all resources and reports what would change, without persisting.
- If any resource fails validation, the entire batch is rejected (transactional).
- Response includes per-resource status: `created`, `updated`, `unchanged`, `error`.

---

### Layer 2: Schema-Driven SDK Generation

#### Approach

SDKs are **auto-generated from the JSON Schema definitions** exposed by `GET /api/saved_objects/_schemas`. This ensures:
- SDKs stay in sync with the server without manual maintenance
- New resource types or schema versions automatically get SDK support
- Type safety is guaranteed by the schema

#### Generation Pipeline

```
JSON Schema files  -->  Code Generator  -->  TypeScript SDK
(dashboard/v1.json)     (openapi-generator      Python SDK
                         or custom)              Go SDK
                                                 Java SDK
```

The generator produces:
1. **Type definitions** — Interfaces/structs matching the schema
2. **Builder classes** — Fluent API for constructing resources
3. **Validators** — Client-side validation using the schema
4. **Serializers** — Output to JSON or YAML in the clean export format

#### TypeScript SDK Example

```typescript
import { Dashboard, Panel, Query } from '@opensearch-dashboards/sdk';

const cpuDashboard = Dashboard.create('cpu-monitoring')
  .title('CPU Monitoring')
  .description('Production CPU metrics across all clusters')
  .labels({ env: 'production', team: 'platform' })
  .annotation('owner', 'jane@company.com')
  .timeRange('now-1h', 'now')
  .refreshInterval('30s')
  .addPanel(
    Panel.create('cpu-usage')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
      .query(
        Query.ppl("source = metrics | where name = 'cpu.usage' | stats avg(value) by host")
      )
      .option('showLegend', true)
  )
  .addPanel(
    Panel.create('cpu-by-host')
      .visualization('heatmap')
      .gridPosition({ x: 0, y: 12, w: 24, h: 12 })
      .query(
        Query.dql('cpu.usage:*')
      )
  )
  .addDataSource('metrics-cluster', { type: 'opensearch', default: true })
  .build();

// Output to file
cpuDashboard.toYAML('dashboards/cpu-monitoring.yaml');
cpuDashboard.toJSON('dashboards/cpu-monitoring.json');
```

#### Python SDK Example

```python
from opensearch_dashboards_sdk import Dashboard, Panel, Query

cpu_dashboard = (
    Dashboard("cpu-monitoring")
    .title("CPU Monitoring")
    .description("Production CPU metrics across all clusters")
    .labels(env="production", team="platform")
    .time_range("now-1h", "now")
    .refresh_interval("30s")
    .add_panel(
        Panel("cpu-usage")
        .visualization("line")
        .grid_position(x=0, y=0, w=24, h=12)
        .query(Query.ppl("source = metrics | where name = 'cpu.usage' | stats avg(value) by host"))
        .option("showLegend", True)
    )
    .add_data_source("metrics-cluster", type="opensearch", default=True)
    .build()
)

cpu_dashboard.to_yaml("dashboards/cpu-monitoring.yaml")
```

#### Go SDK Example

```go
package main

import (
    "github.com/opensearch-project/osd-sdk-go/dashboard"
    "github.com/opensearch-project/osd-sdk-go/panel"
    "github.com/opensearch-project/osd-sdk-go/query"
)

func main() {
    d, err := dashboard.New("cpu-monitoring",
        dashboard.Title("CPU Monitoring"),
        dashboard.Labels(map[string]string{"env": "production", "team": "platform"}),
        dashboard.TimeRange("now-1h", "now"),
        dashboard.RefreshInterval("30s"),
        dashboard.AddPanel("cpu-usage",
            panel.Visualization("line"),
            panel.GridPosition(0, 0, 24, 12),
            panel.Query(query.PPL("source = metrics | where name = 'cpu.usage' | stats avg(value) by host")),
        ),
        dashboard.AddDataSource("metrics-cluster", datasource.OpenSearch(datasource.Default(true))),
    )
    if err != nil {
        log.Fatal(err)
    }
    d.ToYAML("dashboards/cpu-monitoring.yaml")
}
```

#### Reusable Components

SDKs support composable fragments for DRY dashboard definitions:

```typescript
// shared/standard-panels.ts
import { Panel, Query } from '@opensearch-dashboards/sdk';

export const cpuPanel = (host: string) =>
  Panel.create(`cpu-${host}`)
    .visualization('line')
    .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
    .query(Query.ppl(`source = metrics | where host = '${host}' | stats avg(cpu) by timestamp`));

// dashboards/per-host.ts
import { Dashboard } from '@opensearch-dashboards/sdk';
import { cpuPanel } from '../shared/standard-panels';

const hosts = ['web-1', 'web-2', 'api-1'];
for (const host of hosts) {
  Dashboard.create(`monitoring-${host}`)
    .addPanel(cpuPanel(host))
    .build()
    .toYAML(`dashboards/monitoring-${host}.yaml`);
}
```

---

### Layer 3: CLI Design (`osdctl`)

#### Overview

`osdctl` is a standalone binary (Node.js-based, distributed via npm, Homebrew, and direct download) that orchestrates the DaC workflow.

#### Configuration

```yaml
# ~/.osdctl/config.yaml
profiles:
  dev:
    url: https://dashboards-dev.internal:5601
    auth:
      type: basic
      username: admin
      # password read from OSD_PASSWORD env var or keychain
  staging:
    url: https://dashboards-staging.internal:5601
    auth:
      type: saml
      token_command: "aws sso get-role-credentials ..."
  prod:
    url: https://dashboards.company.com:5601
    auth:
      type: basic

default_profile: dev
output_dir: ./built
```

#### Command Reference

##### `osdctl init`

Scaffold a new DaC project.

```bash
$ osdctl init --language typescript my-dashboards
Creating project my-dashboards/
  my-dashboards/package.json
  my-dashboards/tsconfig.json
  my-dashboards/dashboards/example.ts
  my-dashboards/.osdctl.yaml
  my-dashboards/.github/workflows/deploy.yaml
  my-dashboards/.gitignore

Project created. Run:
  cd my-dashboards
  npm install
  osdctl build
```

Supported: `--language typescript|python|go|java`

##### `osdctl build`

Compile SDK source into JSON/YAML dashboard definitions.

```bash
# Build a single file
$ osdctl build -f dashboards/cpu-monitoring.ts -o yaml

# Build all files in a directory
$ osdctl build -d dashboards/ -o json

# Output to stdout instead of files
$ osdctl build -f dashboards/cpu-monitoring.ts --stdout
```

**How it works:**
1. Detects language from file extension or project config
2. Executes the source file (e.g., `npx tsx`, `python`, `go run`)
3. Captures the SDK output (JSON/YAML)
4. Writes results to `./built/` directory (one file per dashboard)

##### `osdctl validate`

Validate dashboard definitions against the schema.

```bash
# Local-only validation (no server needed)
$ osdctl validate -d built/
Validating 5 dashboards...
  cpu-monitoring.yaml          VALID
  memory-overview.yaml         VALID
  disk-usage.yaml              ERROR  panelsJSON[2].gridData.w must be >= 1
  network-traffic.yaml         VALID
  application-errors.yaml      VALID

4/5 valid, 1 error

# Server-side validation (checks data sources, plugins)
$ osdctl validate -d built/ --server --profile staging
```

##### `osdctl diff`

Compare local definitions against a running instance.

```bash
$ osdctl diff -d built/ --profile prod
Comparing 5 dashboards against prod...

  cpu-monitoring               UPDATED
    ~ title: "CPU Metrics" -> "CPU Monitoring"
    + panels[3]: new panel "cpu-p99-latency"

  memory-overview              UNCHANGED
  disk-usage                   NEW
  network-traffic              UPDATED
    ~ refreshInterval: "1m" -> "30s"
  application-errors           UNCHANGED

2 updated, 1 new, 2 unchanged
```

**How it works:**
1. For each local definition, calls `POST /api/saved_objects/_diff`
2. Renders diffs with colorized, human-readable output
3. Optionally writes `.diff` files to output directory

##### `osdctl apply`

Deploy dashboard definitions to a running instance.

```bash
# Apply all dashboards
$ osdctl apply -d built/ --profile prod
Applying 5 dashboards to prod...
  cpu-monitoring               UPDATED  (v5 -> v6)
  memory-overview              UNCHANGED
  disk-usage                   CREATED  (v1)
  network-traffic              UPDATED  (v3 -> v4)
  application-errors           UNCHANGED

3 changes applied, 2 unchanged

# Dry-run mode
$ osdctl apply -d built/ --profile prod --dry-run

# Apply with confirmation prompt
$ osdctl apply -d built/ --profile prod --confirm
```

**How it works:**
1. Calls `POST /api/saved_objects/_bulk_apply` with all resources
2. Uses optimistic concurrency (`If-Match`) to prevent overwriting concurrent changes
3. Stamps `managed-by: osdctl` label and `last-applied-hash` annotation on applied objects

##### `osdctl pull`

Export dashboards from a running instance to local files.

```bash
# Pull all dashboards
$ osdctl pull --profile prod -o yaml
Pulling dashboards from prod...
  Wrote dashboards/cpu-monitoring.yaml
  Wrote dashboards/memory-overview.yaml
  ... (12 dashboards)

# Pull specific dashboards by label
$ osdctl pull --profile prod --label team=platform -o yaml

# Pull into SDK code (TypeScript)
$ osdctl pull --profile prod --language typescript
  Wrote dashboards/cpu-monitoring.ts
```

**How it works:**
1. Calls `GET /api/saved_objects/_export_clean` for the clean format
2. Writes individual files per dashboard (one dashboard per file)
3. `--language` mode reverse-generates SDK code from the JSON/YAML definition

##### `osdctl lint`

Check dashboards against organizational policies.

```bash
$ osdctl lint -d built/
Linting 5 dashboards...
  cpu-monitoring.yaml
    WARN  no "owner" annotation set
    WARN  no description provided
  disk-usage.yaml
    ERROR missing required label "env"

2 warnings, 1 error
```

**Lint rules** configured via `.osdctl.yaml`:

```yaml
lint:
  rules:
    require-labels: ["env", "team"]
    require-annotations: ["owner"]
    require-description: warn
    max-panels-per-dashboard: 30
    naming-convention: kebab-case
    allowed-data-sources: ["metrics-*", "logs-*"]
```

##### `osdctl preview`

Create an ephemeral dashboard for testing.

```bash
$ osdctl preview -f built/cpu-monitoring.yaml --profile dev
Preview dashboard created at:
  https://dashboards-dev.internal:5601/app/dashboards#/preview/tmp-abc123

Preview expires in 1 hour. Press Ctrl+C to delete early.
```

---

### Layer 4: CI/CD Integration

#### GitHub Actions

Official actions published to `opensearch-project/osdctl-actions`:

```yaml
# .github/workflows/dashboards.yaml
name: Deploy Dashboards

on:
  push:
    branches: [main]
    paths: ['dashboards/**']
  pull_request:
    paths: ['dashboards/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: opensearch-project/osdctl-actions/setup@v1

      - name: Build dashboards
        run: osdctl build -d dashboards/ -o yaml

      - name: Validate
        run: osdctl validate -d built/

      - name: Diff (on PRs)
        if: github.event_name == 'pull_request'
        run: osdctl diff -d built/ --profile staging
        env:
          OSD_URL: ${{ secrets.OSD_STAGING_URL }}
          OSD_TOKEN: ${{ secrets.OSD_STAGING_TOKEN }}

  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: opensearch-project/osdctl-actions/setup@v1

      - name: Build
        run: osdctl build -d dashboards/ -o yaml

      - name: Deploy to production
        run: osdctl apply -d built/ --profile prod
        env:
          OSD_URL: ${{ secrets.OSD_PROD_URL }}
          OSD_TOKEN: ${{ secrets.OSD_PROD_TOKEN }}
```

#### Generic CI/CD

Docker image for use in any pipeline:

```dockerfile
FROM opensearchproject/osdctl:latest
# Contains osdctl + Node.js + Python + Go runtimes for SDK execution
```

```bash
# Works in any CI system
docker run --rm -v $(pwd):/workspace opensearchproject/osdctl \
  osdctl build -d /workspace/dashboards/ -o yaml && \
  osdctl validate -d /workspace/built/ && \
  osdctl apply -d /workspace/built/ --url $OSD_URL --token $OSD_TOKEN
```

---

## Data Flow

### Write Path (SDK to Deployed Dashboard)

```
1. Developer writes dashboard code (TypeScript/Python/Go/Java)
        |
        v
2. `osdctl build` executes SDK code, produces JSON/YAML files
        |
        v
3. Files committed to Git, PR opened
        |
        v
4. CI runs `osdctl validate` (schema check) + `osdctl diff` (change preview)
        |
        v
5. PR merged to main
        |
        v
6. CD runs `osdctl apply`, calls POST /api/saved_objects/_bulk_apply
        |
        v
7. Saved Objects API validates, applies, increments version
        |
        v
8. Dashboard live in OpenSearch Dashboards
```

### Read Path (Deployed Dashboard to Code)

```
1. `osdctl pull --profile prod`
        |
        v
2. GET /api/saved_objects/_export_clean (deterministic YAML)
        |
        v
3. Files written to local directory
        |
        v
4. (Optional) `osdctl pull --language typescript` reverse-generates SDK code
        |
        v
5. Developer commits to Git, continues as-code workflow
```

### Drift Detection

```
1. Scheduled CI job runs `osdctl diff -d built/ --profile prod`
        |
        v
2. Diff endpoint compares local definitions against deployed state
        |
        v
3. If drift detected:
   - CI job fails / posts alert
   - Team decides: update code (accept drift) or re-apply (reject drift)
```

---

## Schema Migration Strategy

### Backward Compatibility

The typed schema layer is **additive** — it does not change the underlying Saved Objects storage format. Existing dashboards created via the UI continue to work without modification.

### Schema Versioning

```
dashboard/v1      <-- initial typed schema (covers current attributes)
dashboard/v1beta2 <-- future schema with layout decoupled from panels
dashboard/v2      <-- stable release of the decoupled schema
```

**Migration path:**
1. `v1` matches the current Saved Objects structure exactly — zero migration needed
2. `v1beta2` introduces the cleaner structure (layout/panels decoupled) as opt-in
3. `osdctl convert --from v1 --to v2` migrates definitions forward
4. Server accepts both `v1` and `v2` simultaneously during transition

### Impact on Existing Features

| Feature | Impact |
|---|---|
| Dashboard UI (create/edit) | No change. UI continues writing to Saved Objects as today. |
| Saved Objects API (existing endpoints) | No change. All existing endpoints work identically. |
| ndjson Export/Import | No change. Existing format preserved. |
| Saved Objects Management UI | Enhanced: shows `managed-by` badge, labels, version counter. |
| Dashboard listing | Enhanced: filter by labels (e.g., show only `team: platform` dashboards). |

---

## Security Considerations

### Authentication

`osdctl` supports multiple auth methods:
- **Basic auth** — username/password (for dev/test environments)
- **Token-based** — API token or bearer token
- **SAML/OIDC** — via `token_command` that shells out to an identity provider CLI
- **Environment variables** — `OSD_URL`, `OSD_TOKEN`, `OSD_USERNAME`, `OSD_PASSWORD`

Credentials are **never** stored in config files. Passwords are read from environment variables, keychains, or interactive prompts.

### Authorization

The `_validate`, `_diff`, `_bulk_apply`, and `_export_clean` endpoints respect existing OpenSearch Dashboards security:
- Workspace/tenant isolation applies to all new endpoints
- Users can only validate/diff/apply resources they have permission to access
- The `managed-by` label is informational — it does not bypass access control

### Managed Object Protection

When a Saved Object has `labels.managed-by: osdctl`:
- The UI shows a visual indicator ("Managed by code — edits may be overwritten")
- The UI **does not** block editing (users may need emergency manual changes)
- The `last-applied-hash` annotation enables the CLI to detect if someone manually changed a managed object

---

## Rejected Alternatives

### 1. Build a completely new API from scratch

**Why rejected:** The Saved Objects API already handles CRUD, references, multi-tenancy, and bulk operations. Building parallel endpoints duplicates effort, creates confusion about which API to use, and forces migration of all existing integrations. Extending the existing API is faster to ship and preserves backward compatibility.

### 2. Use CUE as the primary schema/SDK language

**Why rejected:** CUE is powerful for validation but has a steep learning curve, limited ecosystem, and niche adoption. Perses uses CUE, but even they added a Go SDK because CUE's dependency management and integration story are weak. General-purpose languages (TypeScript, Python, Go, Java) reach more users and integrate with existing tooling.

### 3. Embed Git operations in the server (Grafana Git Sync model)

**Why rejected for Phase 1:** Git Sync requires significant server-side complexity (Git client, webhook handling, conflict resolution, branch management). The CLI + CI/CD approach delivers the same GitOps outcome with less server complexity and more flexibility (works with any Git provider, any CI system). Git Sync is a candidate for a future RFC.

### 4. Use Jsonnet as the templating language

**Why rejected:** Jsonnet is a single-purpose templating language with limited IDE support and no type system. Multi-language SDKs using general-purpose languages provide better DX (type checking, autocompletion, testing, debugging) and reach the widest possible audience.

### 5. Terraform provider as the primary interface

**Why rejected for Phase 1:** Terraform adds a dependency on HCL and the Terraform ecosystem. Many teams want as-code workflows without Terraform. The SDK + CLI approach serves a broader audience. A Terraform provider is planned for Phase 3, built on top of the same API extensions.

---

## Rollout Plan

### Phase 1 — Foundation (Target: Q2-Q3 2026)

**Server-side:**
- [ ] JSON Schema definitions for dashboard, visualization, index-pattern, search
- [ ] `GET /api/saved_objects/_schemas` endpoint
- [ ] `POST /api/saved_objects/_validate` endpoint
- [ ] `POST /api/saved_objects/_diff` endpoint
- [ ] `POST /api/saved_objects/_bulk_apply` endpoint
- [ ] Labels and annotations on Saved Objects
- [ ] Optimistic concurrency control (`version` + `If-Match`)
- [ ] `GET /api/saved_objects/_export_clean` endpoint
- [ ] `managed-by` badge in Saved Objects Management UI

**Client-side:**
- [ ] TypeScript SDK (`@opensearch-dashboards/sdk`) published to npm
- [ ] `osdctl` CLI: `init`, `build`, `validate`, `diff`, `apply`, `pull`
- [ ] GitHub Actions: `setup-osdctl` action
- [ ] Documentation: getting-started guide, SDK API reference, CLI reference
- [ ] Example repository with TypeScript DaC project

### Phase 2 — Multi-Language & CI/CD (Target: Q3-Q4 2026)

- [ ] Python SDK published to PyPI
- [ ] Go SDK published as Go module
- [ ] SDK auto-generation pipeline from JSON Schema
- [ ] `osdctl lint` with configurable rules
- [ ] `osdctl convert` (Grafana JSON import)
- [ ] `osdctl preview` (ephemeral dashboards)
- [ ] GitHub Actions: composite deploy workflow
- [ ] Docker image for generic CI/CD
- [ ] Dashboard template gallery (Kubernetes, application, security starter kits)

### Phase 3 — IaC Providers (Target: Q1 2027)

- [ ] Terraform provider for OpenSearch Dashboards
- [ ] Pulumi provider (bridged from Terraform)
- [ ] Java SDK published to Maven Central
- [ ] GitLab CI templates, Jenkins shared library

---

## Open Questions

1. **Schema granularity:** Should the typed schema cover the full panel visualization config (chart type, axes, thresholds), or stop at the panel boundary and treat visualization config as opaque JSON? Full typing enables richer validation and SDK autocompletion but couples the schema to visualization plugin internals.

2. **Plugin SDK extension point:** Should visualization plugins be able to register their own JSON Schema fragments and SDK builders (like Perses' plugin-per-language model)? This grows the ecosystem but adds complexity.

3. **`osdctl pull --language` feasibility:** Reverse-generating idiomatic SDK code from JSON/YAML is hard to do well. Should we defer this to a later phase or ship a simpler "scaffold from JSON" that generates less-polished but functional code?

4. **Multi-workspace support:** How does `osdctl apply` handle dashboards across multiple workspaces? Should workspace be a field in the resource definition, a CLI flag, or both?

5. **ndjson migration:** Should we provide `osdctl convert --from ndjson` to help teams migrate existing ndjson-based automation to the new clean format?

---

## References

- [Requirements Document](./dashboards-as-code-requirements.md) — Full competitive analysis and prioritized requirements
- [Grafana 12 Observability-as-Code](https://grafana.com/blog/observability-as-code-grafana-12/)
- [Perses Dashboard-as-Code](https://perses.dev/perses/docs/concepts/dashboard-as-code/)
- [Perses Go SDK](https://github.com/perses/perses/tree/main/go-sdk)
- [Perses CLI Actions](https://github.com/perses/cli-actions)
- [Grafana Foundation SDK](https://github.com/grafana/grafana-foundation-sdk)
- [Grafonnet (Jsonnet)](https://github.com/grafana/grafonnet)
- [Dynatrace Monaco](https://github.com/Dynatrace/dynatrace-configuration-as-code)
