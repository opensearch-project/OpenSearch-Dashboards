# Backend Compatibility Plugin

Enables OpenSearch Dashboards to connect to legacy Elasticsearch 6.x and 7.x clusters.

## How It Works

The plugin registers a custom `Transport` class with the OpenSearch client. Every client API call (`search`, `bulk`, `index`, etc.) passes through `transport.request()` — making it the single point where all cluster communication can be intercepted and adapted.

```
OSD Plugin calls client.search(params)
    │
    ▼
CompatibilityTransport.request(params)
    │
    ├─ Detect backend (lazy, once per instance)
    ├─ Match URL path against route table
    ├─ Translate request for target backend
    ├─ Execute request via underlying Transport
    └─ Normalize response to OpenSearch format
    │
    ▼
OpenSearch-compatible response returned to caller
```

## Backend Handling

| Backend | Request | Response |
|---------|---------|----------|
| OpenSearch 1.x+ | Pass-through | Pass-through |
| Elasticsearch 7.0–7.10.2 | Pass-through | Strip `_type` from documents |
| Elasticsearch 6.0–6.8 | Full translation | Full normalization |

When disabled, no Transport is registered — zero runtime overhead.

## Key Design Decisions

**Single interception point.** Instead of wrapping 15+ individual client methods with Proxies, the Transport intercepts at the HTTP serialization boundary where all methods converge into one `request()` call.

**Lazy detection.** Backend version is detected on the first request via `GET /`. This naturally handles timing issues where saved object migrations run before the plugin's `start()` phase.

**Declarative route table.** URL path patterns are matched against an ordered array of entries. Each entry maps to request/response translator functions. Adding support for a new API means adding one entry.

**Zero core knowledge of Elasticsearch.** Core provides a generic hook (`registerClientTransport`). All version detection and translation logic lives in the plugin.

## What Gets Translated (ES 6.x)

| Area | Translations |
|------|-------------|
| Documents | `_type` injection, `if_seq_no`/`if_primary_term` stripping, `/_create` → `/_doc` rewrite, `/_update` path rewrite |
| Search | `calendar_interval` → `interval`, unsupported agg/query removal, `hits.total` normalization |
| Mappings | Typed ↔ typeless format, `include_type_name`, field type downgrades |
| Field Caps | Strip unsupported parameters |
| Scroll | Response normalization |
| Index Resolution | Synthesize `/_resolve/index` from `/_cat/indices` + `/_cat/aliases` |

## Configuration

```yaml
# opensearch_dashboards.yml
backendCompatibility.enabled: true  # Default: false
```

## File Structure

```
server/
├── plugin.ts                      # Registers Transport with core
├── config.ts                      # Schema (enabled: boolean)
└── transport/
    ├── compatibility_transport.ts # Transport subclass, route table, request() override
    ├── backend_detector.ts        # GET / → BackendInfo
    ├── types.ts                   # BackendInfo, DEFAULT_DOCUMENT_TYPE
    └── adapters/
        ├── search_adapter.ts      # Search/msearch/aggregation transforms
        ├── document_adapter.ts    # Bulk/CRUD/_type/seq_no handling
        ├── mapping_adapter.ts     # Typed mappings, field type downgrades
        ├── field_caps_adapter.ts  # Parameter filtering
        ├── scroll_adapter.ts      # Scroll response normalization
        └── normalization_utils.ts # isPlainObject, synthesizeSeqNo, normalizeTotalHits
```

## Limitations

- Optimistic concurrency disabled on ES 6.x (concurrent writes can silently overwrite)
- Single Transport class registration (sufficient but not extensible to multiple plugins)
- Scripted field syntax differences not auto-translated
- `track_total_hits` unavailable on ES 6.x (counts above 10,000 may be inexact)
