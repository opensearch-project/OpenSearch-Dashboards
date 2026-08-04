---
rule: multisearch-min-subsearch
---

# `multisearch` requires two subsearches

## What it detects

A `multisearch` command containing fewer than two bracketed subsearches.

## Why it matters

`multisearch` merges independent search results. The engine rejects the command
when there is only one result set to merge.

## Example

```ppl
| multisearch [search source=logs-a]
| multisearch [search source=logs-a] [search source=logs-b]
```

The first query has one subsearch. The second satisfies the minimum.

## How to fix it

Add another bracketed subsearch, or run the single subsearch as a normal PPL
query.

## Availability

Error severity, enabled by default, on engine version 3.4.0 or later. This is a
runtime grammar rule, so it fires only after a compatible grammar bundle is
loaded for the active data source.

## Implementation

The catalog marks this rule `runtimeOnly` with `minVersion: 3.4.0`. `runLint`
therefore runs it only when the context is stamped
`grammarSurface: runtime-bundle` and the data source version passes the catalog
gate. Because this is an error rule with a minimum version, an absent or
unparseable version suppresses it rather than risking a false error.

`multisearchMinSubsearchDetector` in
`packages/osd-monaco/src/ppl/lint/rules/multisearch_min_subsearch.ts` finds every
`multisearchCommand`, counts its direct `subSearch` children, and reports the
full command when the count is less than two. Missing grammar rule names resolve
to no matches, and detector exceptions are caught by `runLint`, so an
incompatible grammar fails closed to no diagnostic.

## Hardcoded assumptions and maintenance

- The detector assumes the runtime grammar names are `multisearchCommand` and
  `subSearch`, and that subsearches are direct children of the command. If the
  backend adds a wrapper or another subsearch form, update the detector and the
  runtime stub rule maps in both runtime-rule suites.
- `pipeline_shape.ts` classifies `multisearchCommand` as order-invalidating, and
  explain attribution lists it as a branched command. A new command rule or
  alias must be added to those command sets as well as this detector.
- `collectAlternateSourceSubtrees` treats every `subSearch` as separate metadata
  scope. Revisit that pruning if a new multisearch variant represents its
  branches with a different grammar node.
- If backend support moves from 3.4.0 or the rule stops being runtime-only,
  update `rules_catalog.json`; changing only the detector does not change the
  runner gates.

## Tests

- `rules/__tests__/multisearch_min_subsearch.test.ts` verifies that the compiled
  grammar surface stays silent.
- `rules/__tests__/runtime_rules_positive_path.test.ts` verifies one versus two
  direct `subSearch` children at detector level.
- `rules/__tests__/runtime_rules_plumbing.test.ts` verifies the catalog,
  registry, runtime-surface gate, version context, and catalog message together.
- When adding a grammar alias, also update `command_census.test.ts` and
  `command_order_effects.test.ts` so the command remains visible to pipeline
  analysis.
