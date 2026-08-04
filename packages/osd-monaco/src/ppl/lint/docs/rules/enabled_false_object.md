---
rule: enabled-false-object
---

# Field below an object with `enabled: false`

## What it detects

A dotted field reference equal to or below an object mapped with
`enabled: false`.

## Why it matters

OpenSearch stores the original object in `_source` but does not parse or index
its children. On the verified Calcite surface, PPL returns `null` for the
reference with a successful response.

## Example

```ppl
source=logs | where session.id = "abc"
source=logs | where indexed_session_id = "abc"
```

In the first query, `session` is mapped with `enabled: false`. The second uses a
separately indexed value.

## How to fix it

Use an indexed field. To query the nested value through PPL, enable the object
mapping and reindex the data. No automatic fix is offered because there is no
equivalent reference in the current mapping.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires disabled-object mapping metadata and is source-scoped.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                  |
| Severity           | `warning`                                                                                                                  |
| Diagnostic message | This field is stored but not searchable, so PPL returns null for it.                                                       |
| Fix guidance       | Query an indexed field instead. To make this value searchable, enable indexing in the mapping and reindex the data.        |
| Documentation      | [Disabling object fields](https://docs.opensearch.org/latest/mappings/mapping-parameters/enabled/#disabling-object-fields) |

## Implementation

The metadata producer in
`src/plugins/data/public/ppl_lint/disabled_object_fields.ts` calls the existing
read-only `indices.getFieldMapping` proxy, unwraps an optional response `body`,
and recursively walks each index's `mappings.properties`. It records the dotted
path of every definition with `enabled: false`, stops below that definition, and
merges/de-duplicates paths across all indices matched by the selected pattern.

The editor caches those paths as `disabledObjectFields`. The context builder
forwards the set only when dataset ID, data source ID, and dataset type match the
active dataset. `enabledFalseObjectDetector` in
`packages/osd-monaco/src/ppl/lint/rules/enabled_false_object.ts` then uses
`collectDottedPathNodes` to collect dotted field references. A path matches when
it equals a disabled path or starts with that path plus `.`, preserving the
segment boundary.

The catalog gates the rule with `needsContext`, `sourceScoped`, Calcite, and
version 3.7.0 or later. The diagnostic spans the complete dotted path, uses the
catalog message, and offers no fix. Missing mappings, malformed responses,
missing titles, empty results, and fetch failures return no metadata, so the
detector stays quiet instead of guessing.

## Assumptions and maintenance

- The producer assumes the response shape
  `{ [index]: { mappings: { properties } } }` with an optional transport
  `body`. Update `collectDisabledObjectFields` if the mapping route or response
  envelope changes.
- Results are a union across an index pattern. Per-index differences are lost:
  if a path is disabled in one matched index but enabled in another, the set
  still marks it disabled. Revisit the context model if findings must be
  index-specific.
- Only dotted references are inspected. A bare top-level disabled object such as
  `session` is not reported; a dotted disabled object name such as
  `outer.inner` can be. Command-specific field forms need explicit detector
  coverage.
- Matching uses raw node text rather than `parseFieldPath`; quoted path segments
  may therefore fail to match the unquoted names emitted by the mapping walker.
- Unlike the other Calcite mapping detectors, this detector itself does not
  check `isCalcite`; direct callers must use `runLint` or reproduce the catalog
  gate.
- `runLint`'s `needsContext` emptiness test currently considers `fields`,
  `typeMap`, and `visibleIndices`, but not `disabledObjectFields`. A standalone
  disabled-object set is insufficient to pass the runner gate; the editor
  normally loads it alongside `fields`. Update `isContextEmpty` if that host
  contract changes.
- The detector does not prune alternate-source subtrees. Nested lookup, append,
  subsearch, or union references can be compared with the outer mapping set.
- Top-level source mismatch suppression fails open for wildcard, pipe-first,
  multi-source, and inconclusive queries.

## Tests

- `packages/osd-monaco/src/ppl/lint/rules/enabled_false_object.test.ts`:
  path/boundary matching, nested disabled objects, per-reference diagnostics,
  and metadata suppression.
- `src/plugins/data/public/ppl_lint/disabled_object_fields.test.ts`: mapping
  traversal, response envelopes, multi-index merging, route construction, and
  failure behavior.
- `src/plugins/data/public/ppl_lint/lint_context_builder.test.ts`: cache
  provenance and context forwarding.
- `packages/osd-monaco/src/ppl/lint/__tests__/source_mismatch_suppression.test.ts`:
  source-scoped behavior.
- `packages/osd-monaco/src/ppl/lint/__tests__/catalog.test.ts` and
  `lint_runner.test.ts`: version/engine/context catalog gates.
