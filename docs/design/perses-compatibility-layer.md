# RFC: Perses Schema Compatibility Layer

**Status:** Future / On-demand | **Date:** 2026-03-25 | **Branch:** `dashboards-as-code`
**Depends on:** [OpenAPI Client Generation & Schema Mapping](./openapi-client-generation.md)

## Context

[Perses](https://perses.dev) is a CNCF sandbox project defining a vendor-neutral, Kubernetes-style resource model for observability dashboards. It's adopted by Red Hat, SAP, and Amadeus, and has a Grafana migration tool. Community members have asked whether OpenSearch Dashboards should adopt the Perses schema.

**Our position:** OpenSearch Dashboards saved objects are a 10+ year proven schema inherited from Kibana. We do not replace them. Instead, we offer an optional **bidirectional translation layer** that maps between OSD saved objects and Perses format — driven by customer requests, not speculative adoption.

## Problem

Users migrating from Grafana or Perses-native environments want to:
1. Import existing Perses/Grafana dashboards into OSD without manual rewriting
2. Export OSD dashboards in Perses format for portability to other tools
3. Use Perses as a Git-friendly interchange format across heterogeneous stacks

## Proposal

A standalone translation module — not a core dependency — that converts between the two formats.

```
┌──────────────────┐          ┌──────────────────┐
│  Perses Format   │          │  OSD Saved Objects│
│                  │          │                   │
│  kind: Dashboard │  ──────► │  type: dashboard  │
│  metadata:       │  import  │  id: uuid         │
│    name: ...     │          │  attributes:      │
│  spec:           │          │    title: ...     │
│    panels: {}    │  ◄────── │    panelsJSON: ...│
│    layouts: []   │  export  │  references: []   │
│    variables: [] │          │                   │
└──────────────────┘          └──────────────────┘
```

### Translation Mapping

| Perses Concept | OSD Saved Object | Notes |
|---|---|---|
| `kind: Dashboard` | `type: "dashboard"` | 1:1 |
| `metadata.name` | `attributes.title` | Perses uses name as ID; OSD uses UUID + title |
| `metadata.project` | Workspace | Maps to OSD workspace scoping |
| `spec.panels` (inline map) | Separate `type: "visualization"` objects | **Key structural difference** — Perses inlines, OSD links via references |
| `spec.layouts[].items` | `attributes.panelsJSON` grid positions | Both use x/y/w/h grid; format differs |
| `spec.variables` | Separate input controls or `optionsJSON` | Variable types need per-kind mapping |
| `spec.datasources` | `type: "data-source"` saved objects | Perses scopes at dashboard level; OSD scopes globally |
| `spec.duration` | `attributes.timeFrom` / `attributes.timeTo` | Duration string → absolute/relative range |
| `spec.refreshInterval` | `attributes.refreshInterval` | Compatible concept, different serialization |
| Panel `plugin.kind` | `attributes.visState.type` | Visualization type mapping table needed |
| Panel queries | `kibanaSavedObjectMeta.searchSourceJSON` | Query language + source mapping |

### Structural Flattening / Unflattening

The biggest translation challenge: Perses dashboards are **self-contained documents** (panels inline). OSD dashboards are **graphs of linked saved objects** (dashboard → visualization → index-pattern).

**Import (Perses → OSD):**
```
1. Parse Perses YAML/JSON
2. For each spec.panels entry:
   a. Create a visualization saved object (generate UUID)
   b. Map plugin.kind → visState.type
   c. Map queries → searchSourceJSON
3. For each spec.datasources entry:
   a. Resolve to existing OSD data-source or create reference
4. Build dashboard saved object:
   a. Map layouts → panelsJSON with grid positions
   b. Wire references[] to created visualization UUIDs
   c. Map metadata → title, description
5. Return NDJSON bundle ready for _bulk_apply
```

**Export (OSD → Perses):**
```
1. Export dashboard + deep references via _export_clean
2. Group saved objects: dashboard, visualizations, index-patterns
3. For each visualization reference:
   a. Inline as spec.panels entry
   b. Map visState.type → plugin.kind
   c. Map searchSourceJSON → query spec
4. Build layouts from panelsJSON grid positions
5. Map data-source references → spec.datasources
6. Emit Perses YAML/JSON
```

### Visualization Type Mapping

| OSD visState.type | Perses plugin.kind | Fidelity |
|---|---|---|
| `line` | `TimeSeriesChart` | High |
| `area` | `TimeSeriesChart` (stacked) | High |
| `bar` | `BarChart` | High |
| `pie` | `PieChart` | High |
| `metric` | `StatChart` | High |
| `table` | `Table` | Medium |
| `gauge` | `GaugeChart` | High |
| `heatmap` | `TimeSeriesChart` (heatmap) | Medium |
| `markdown` | `Markdown` | High |
| `vega` / `vega-lite` | — | **No equivalent** — export as raw JSON, flag as manual |
| `maps` | — | **No equivalent** — skip with warning |
| TSVB | `TimeSeriesChart` | Low — lossy conversion |

### Query Language Mapping

| OSD | Perses | Notes |
|---|---|---|
| DQL / Lucene | — | No Perses equivalent; embed as opaque filter |
| PPL | `PrometheusTimeSeriesQuery` | Only if PPL→PromQL translation exists |
| SQL | — | No Perses equivalent; embed as extension |

**Lossy conversions are flagged** — the translator emits warnings for anything it can't round-trip cleanly.

## Module Structure

```
packages/osd-perses-compat/
├── src/
│   ├── index.ts                 # Public API: importPerses(), exportPerses()
│   ├── import.ts                # Perses → OSD saved objects
│   ├── export.ts                # OSD saved objects → Perses
│   ├── mappings/
│   │   ├── panel-types.ts       # Visualization type mapping table
│   │   ├── queries.ts           # Query language mapping
│   │   ├── grid.ts              # Layout/grid position conversion
│   │   └── variables.ts         # Variable type conversion
│   └── types/
│       └── perses.ts            # Perses resource type definitions
├── tests/
│   ├── fixtures/                # Sample Perses + OSD documents
│   ├── import.test.ts
│   ├── export.test.ts
│   └── roundtrip.test.ts        # Import then export, verify minimal loss
└── package.json
```

## CLI Integration

```bash
# Import Perses dashboard into OSD project
osdctl import --from perses --file grafana-migrated.yaml --output ./dashboards/

# Export OSD dashboard to Perses format
osdctl export --to perses --type dashboard --id abc-123 --output ./perses/

# Bulk convert a directory
osdctl convert --from perses --to osd --dir ./perses-dashboards/ --output ./osd-dashboards/
```

## Grafana Migration Path

Perses already maintains a [Grafana migration tool](https://perses.dev/perses/docs/migration/). Combined with this compatibility layer, the migration path becomes:

```
Grafana Dashboard → (Perses migrator) → Perses Format → (this layer) → OSD Saved Objects
```

This gives OSD users a **two-hop migration** from Grafana without us maintaining a direct Grafana importer.

## Scope Boundaries

**In scope:**
- Bidirectional translation of dashboard structure, panels, layouts, variables
- Visualization type mapping with fidelity ratings
- CLI commands for import/export/convert
- Warning system for lossy conversions

**Out of scope:**
- Replacing the saved object model
- Runtime Perses API compatibility (serving Perses API endpoints)
- Direct Grafana JSON import (use Perses migrator as first hop)
- Perses CUE validation integration

## When to Build This

This RFC is **parked until customer demand materializes.** Triggers:

1. Multiple customer requests for Grafana → OSD migration
2. Perses reaches CNCF incubation (signals real standardization momentum)
3. A concrete deployment where Perses + OSD coexist and need interop

Until then, the saved object schema + OpenAPI client generation (parent RFC) is the priority.

## Open Questions

1. Should the Perses type definitions be vendored or pulled from `@perses-dev/core`?
2. Round-trip fidelity target — is 80% panel coverage enough for v1?
3. Should lossy fields be preserved as `x-osd-*` extensions in Perses output for lossless round-trips?
