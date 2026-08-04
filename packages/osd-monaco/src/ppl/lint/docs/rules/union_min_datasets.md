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

## Implementation

The catalog marks this rule `runtimeOnly`, Calcite-only, and
`minVersion: 3.7.0`. `runLint` requires a runtime-bundle grammar, a known
compatible version, and a positive Calcite signal. The detector repeats the
Calcite check so direct calls also stay silent when `context.isCalcite` is not
exactly `true`.

`unionMinDatasetsDetector` in
`packages/osd-monaco/src/ppl/lint/rules/union_min_datasets.ts` finds
`unionCommand` nodes and checks their parent. Only a direct `pplCommands` parent
means query-initial union; a `commands` parent means the upstream pipeline is
the implicit first dataset. It counts direct `unionDataset` children only for
the query-initial form and reports the command when fewer than two exist. An
unavailable `pplCommands` rule, unresolved parent, or missing runtime command
rule suppresses the diagnostic.

## Hardcoded assumptions and maintenance

- Query position is inferred from the exact parent rule names `pplCommands` and
  `commands`. If the runtime grammar adds a wrapper, a new initial form, or a
  union alias, update the parent discrimination and direct-child count rather
  than treating all unions alike.
- `pipeline_shape.ts` classifies `unionCommand` as order-invalidating and prunes
  each `unionDataset` as an alternate-source subtree. Explain attribution also
  lists union as branched. New union grammar nodes must be reflected in all
  three places to avoid order, field-scope, or attribution errors.
- Missing grammar names deliberately produce no finding. Preserve this
  fail-closed behavior for fragments and pipe-first or recovery trees where the
  query-initial relationship cannot be proven.
- Update the catalog's version, engine, or `runtimeOnly` fields if backend
  availability changes; the detector cannot override those runner gates.

## Tests

- `rules/__tests__/union_min_datasets.test.ts` verifies compiled-surface and
  non-runtime suppression.
- `rules/__tests__/runtime_rules_positive_path.test.ts` covers query-initial
  one/two-dataset counts, mid-pipeline union, and the detector's Calcite gate.
- `rules/__tests__/runtime_rules_plumbing.test.ts` covers the real catalog and
  registry, parent distinction, runtime-only gate, and Calcite gate.
- Changes to union grammar or ordering also require focused updates in
  `command_census.test.ts`, `command_order_effects.test.ts`, and alternate-source
  field-validation coverage.
