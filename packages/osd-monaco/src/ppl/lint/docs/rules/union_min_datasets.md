---
rule: union-min-datasets
---

# Query-initial `union` requires two datasets

## What it detects

A query-initial `union` command containing fewer than two explicit datasets.
For a mid-pipeline `union`, the upstream pipeline is the implicit first dataset,
so one explicit dataset is valid and is not flagged.

## Why it matters

Query-initial `union` has no upstream result to include. The engine rejects it
unless at least two datasets are provided.

## Example

```ppl
| union logs-a
| union logs-a, logs-b
```

The first query has one dataset. The second combines two.

## How to fix it

Add another direct index or bracketed subsearch. If only one dataset is needed,
run it as a normal search rather than a query-initial `union`.

## Availability

Error severity, enabled by default, on Calcite engine version 3.7.0 or later.
This is a runtime grammar rule, so it also requires a compatible grammar bundle
for the active data source.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                             |
| Severity           | `error`                                                                                               |
| Diagnostic message | The union command requires at least two datasets.                                                     |
| Fix guidance       | Add another dataset to `union`, or remove `union` when using only one dataset.                        |
| Documentation      | [PPL commands index](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/index/#ppl-commands) |

## Implementation

The catalog marks this rule `runtimeOnly`, Calcite-only, and
`minVersion: 3.7.0`. `runLint` requires a runtime-bundle grammar, a known
compatible version, and a positive Calcite signal. The detector repeats the
Calcite check so direct calls also stay silent when `context.isCalcite` is not
exactly `true`.

`unionMinDatasetsDetector` in
`packages/osd-monaco/src/ppl/lint/rules/union_min_datasets.ts` finds each
`union` and determines whether it starts the query or follows an upstream
pipeline. It counts explicit datasets only for the query-initial form and
reports the command when fewer than two exist. An unresolved query position or
unsupported runtime form suppresses the diagnostic.

## Assumptions and maintenance

- The detector must distinguish query-initial `union`, which needs two explicit
  datasets, from mid-pipeline `union`, which inherits one dataset from upstream.
  New union forms must preserve that distinction.
- Union is order-invalidating and branched, and each union dataset is a separate
  metadata scope. Update pipeline shape, explain attribution, and
  alternate-source pruning together when union behavior expands.
- Fragments and recovery trees where query position cannot be proven produce no
  finding. Preserve that fail-closed behavior.
- Update the catalog's version, engine, or `runtimeOnly` fields if backend
  availability changes; the detector cannot override those runner gates.

## Tests

- `rules/__tests__/union_min_datasets.test.ts` verifies compiled-surface and
  non-runtime suppression.
- `rules/__tests__/runtime_rules_positive_path.test.ts` covers query-initial
  one/two-dataset counts, mid-pipeline union, and the detector's Calcite gate.
- `rules/__tests__/runtime_rules_plumbing.test.ts` covers the real catalog and
  registry, query-position distinction, runtime-only gate, and Calcite gate.
- Changes to union grammar or ordering also require focused updates in
  `command_census.test.ts`, `command_order_effects.test.ts`, and alternate-source
  field-validation coverage.
