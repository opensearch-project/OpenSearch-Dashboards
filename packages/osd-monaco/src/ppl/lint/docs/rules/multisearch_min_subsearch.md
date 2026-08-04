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

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                             |
| Severity           | `error`                                                                                               |
| Diagnostic message | The multisearch command requires at least two subsearches.                                            |
| Fix guidance       | Add a second subsearch, or run the single subsearch as a normal query.                                |
| Documentation      | [Multisearch syntax](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/multisearch/#syntax) |

## Implementation

The catalog marks this rule `runtimeOnly` with `minVersion: 3.4.0`. `runLint`
therefore runs it only when the context is stamped
`grammarSurface: runtime-bundle` and the data source version passes the catalog
gate. Because this is an error rule with a minimum version, an absent or
unparseable version suppresses it rather than risking a false error.

`multisearchMinSubsearchDetector` in
`packages/osd-monaco/src/ppl/lint/rules/multisearch_min_subsearch.ts` finds every
`multisearch`, counts its bracketed subsearches, and reports the full command
when the count is less than two. Unsupported parser shapes resolve to no
matches, and detector exceptions are caught by `runLint`, so an incompatible
parser fails closed to no diagnostic.

## Assumptions and maintenance

- The detector counts bracketed subsearches owned by the `multisearch` command.
  If the backend adds another way to supply a branch, update the count and both
  runtime-rule suites.
- Multisearch must remain classified as order-invalidating and branched, and
  each subsearch must remain a separate metadata scope. A new multisearch
  variant requires coordinated updates to the detector, pipeline shape, explain
  attribution, and alternate-source pruning.
- If backend support moves from 3.4.0 or the rule stops being runtime-only,
  update `rules_catalog.json`; changing only the detector does not change the
  runner gates.

## Tests

- `rules/__tests__/multisearch_min_subsearch.test.ts` verifies that the compiled
  grammar surface stays silent.
- `rules/__tests__/runtime_rules_positive_path.test.ts` verifies one versus two
  bracketed subsearches at detector level.
- `rules/__tests__/runtime_rules_plumbing.test.ts` verifies the catalog,
  registry, runtime-surface gate, version context, and catalog message together.
- When multisearch syntax changes, also update `command_census.test.ts` and
  `command_order_effects.test.ts` so the command remains visible to pipeline
  analysis.
