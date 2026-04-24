# Design: OpenAPI Client Generation & Schema Mapping

**Status:** Draft | **Date:** 2026-03-25 | **Branch:** `dashboards-as-code`

## Problem

The DaC CLI (`osdctl`) has a hand-written HTTP client. Each new API endpoint requires manual client code. Meanwhile, the saved object schemas (dashboard, visualization, index-pattern, search) are JSON Schema files that aren't connected to the OpenAPI spec. This creates two maintenance burdens and no generated client libraries for other languages.

## Proposal

Use the existing OpenAPI spec as the **single source of truth** for API shape, and the existing saved object JSON Schemas as the **single source of truth** for resource attributes. Connect them to auto-generate typed clients.

```
┌─────────────────────────────────────────────────────────┐
│                    OpenAPI Spec                         │
│              (saved_objects.yml)                        │
│                                                         │
│  Defines: routes, parameters, request/response shapes   │
│  Lives at: docs/openapi/saved_objects/saved_objects.yml │
└────────────────────┬────────────────────────────────────┘
                     │
                     │  $ref
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Saved Object JSON Schemas                   │
│                                                         │
│  dashboard.v1.schema.json     common.schema.json        │
│  visualization.v1.schema.json index-pattern.v1.schema.json │
│  search.v1.schema.json                                  │
│                                                         │
│  Defines: typed `attributes` per saved object type      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │  openapi-generator / openapi-typescript
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Generated Clients                          │
│                                                         │
│  TypeScript  →  packages/osd-dashboards-sdk/generated/  │
│  Python      →  clients/python/                         │
│  Go          →  clients/go/                             │
│  Java        →  clients/java/                           │
└─────────────────────────────────────────────────────────┘
```

## What Changes

### 1. Enrich the OpenAPI spec with typed `attributes`

Today `attributes` is `type: object` (untyped). We replace it with `$ref` to the saved object schemas:

```yaml
# Before
attributes:
  type: object
  description: The metadata of the saved object

# After — per-type request schemas
DashboardCreateRequest:
  type: object
  required: [attributes]
  properties:
    attributes:
      $ref: '../../../src/core/server/saved_objects/schemas/dashboard.v1.schema.json'
    references:
      $ref: '#/components/schemas/References'

VisualizationCreateRequest:
  type: object
  required: [attributes]
  properties:
    attributes:
      $ref: '../../../src/core/server/saved_objects/schemas/visualization.v1.schema.json'
    references:
      $ref: '#/components/schemas/References'
```

### 2. Add DaC-specific endpoints to the OpenAPI spec

The current spec covers CRUD + import/export but is missing the DaC routes:

| Endpoint | Status |
|---|---|
| `POST /_bulk_apply` | **Add** — deploy with dependency resolution |
| `POST /_diff` | **Add** — compare local vs deployed |
| `POST /_export_clean` | **Add** — deterministic export for DaC |
| `GET /_schemas` | **Add** — list registered schemas |
| `GET /_schemas/{type}/{version}` | **Add** — get specific schema |
| `POST /_validate` | **Add** — validate against schema |

### 3. Generate TypeScript client, replace hand-written one

```bash
# Using openapi-typescript for types + openapi-fetch for runtime
npx openapi-typescript docs/openapi/saved_objects/saved_objects.yml \
  -o packages/osd-dashboards-sdk/src/generated/api.d.ts
```

The generated types replace the manual `OsdClient` in `packages/osd-cli/src/client.ts`. The SDK's builder pattern stays — it produces objects that conform to the generated types.

### 4. Generate clients for other languages (future)

```bash
# Python
openapi-generator generate -i saved_objects.yml -g python -o clients/python/

# Go
openapi-generator generate -i saved_objects.yml -g go -o clients/go/

# Java
openapi-generator generate -i saved_objects.yml -g java -o clients/java/
```

## Architecture: Two Schemas, One Pipeline

```
                   ┌──────────────┐
                   │   User Code  │
                   │  (TS / Py /  │
                   │   Go / Java) │
                   └──────┬───────┘
                          │ uses generated client
                          ▼
                   ┌──────────────┐
                   │  Generated   │
                   │  API Client  │  ← from OpenAPI spec (routes + typed attributes)
                   └──────┬───────┘
                          │ HTTP
                          ▼
               ┌─────────────────────┐
               │   OSD Server API    │
               │                     │
               │  Routes validate    │
               │  attributes against │
               │  JSON Schemas at    │
               │  runtime            │
               └──────┬──────────────┘
                      │
                      ▼
               ┌─────────────────────┐
               │  Saved Objects      │
               │  (OpenSearch index) │
               └─────────────────────┘
```

**Key insight:** The OpenAPI spec defines the API contract (endpoints, auth, pagination). The saved object JSON Schemas define the domain model (what a dashboard looks like). By `$ref`-ing the JSON Schemas from within the OpenAPI spec, generated clients get **both** — typed API calls with typed resource attributes.

## Implementation Plan

| Phase | Work | Effort |
|---|---|---|
| **P1** | Add DaC endpoints to OpenAPI spec, wire `$ref` to JSON Schemas | S |
| **P2** | Generate TypeScript types, replace `OsdClient` with generated client | M |
| **P3** | CI: auto-regenerate clients on spec change, validate spec matches routes | S |
| **P4** | Generate Python/Go/Java clients, publish as packages | M |

## What This Does NOT Change

- **Saved object storage format** — still JSON in OpenSearch indices
- **NDJSON import/export** — still supported, the OpenAPI spec documents it
- **SDK builder pattern** — stays as the ergonomic authoring layer on top of generated types
- **Internal schema model** — no Perses adoption; we use our own JSON Schemas as the domain model

## Relationship to Other Efforts

- **Issue #6719 (Standardize OSD APIs with OpenAPI):** This is a concrete implementation of that vision, scoped to saved objects. The pattern extends to other OSD APIs.
- **Perses compatibility:** If needed later, a mapping layer can translate between OSD saved objects and Perses format. The JSON Schemas make this mechanical — both sides are well-typed.

## Open Questions

1. Should generated clients live in-repo or in separate repos?
2. Versioning strategy — bundle spec version with client package version?
3. Should we validate the OpenAPI spec against actual route registrations in CI?
