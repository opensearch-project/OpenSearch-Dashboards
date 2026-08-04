---
rule: operation-not-pushed
---

# Operation left on the PPL coordinator

## What it detects

An `_explain` plan showing that a filter, aggregation, or sort remained on the
PPL coordinator instead of being included in the index request.

## Why it matters

The coordinator must receive and process more intermediate rows. On a large
dataset, that transfer and processing can dominate query latency.

## Example

```ppl
source=accounts | where age - 2 > 30
source=accounts | where age > 32
```

Arithmetic on the field side can prevent native pushdown. The actual finding is
based on the returned plan, not query shape alone.

## How to fix it

Rewrite the highlighted operation using indexed fields and supported
expressions. For a narrow additive comparison over a bounded integer mapping,
the linter can offer an exact inversion such as `age - 2 > 30` to `age > 32`.
The fix is withheld unless plan attribution and type checks prove it safe.

## Availability

Warning severity and configured off by default on Calcite engine version 3.3.0
or later. A user must opt in through the per-rule Advanced Setting, and the
global `queryEnhancements.ppl.lint.enabled` feature also defaults to off. The
rule requires a parseable data-source version, a positively identified Calcite
engine, HTTP access to `_explain`, and a clean parse. Fast mode is the default
and omits ambiguous findings; thorough mode can issue isolation probes.

## Implementation

`packages/osd-monaco/src/ppl/lint/explain/rules/operation_not_pushed.ts`
registers `operationNotPushedDetector`, which consumes the normalized outcomes
from `detectExplainOutcomes`. Its hardcoded `SIGNALS` map
`filter:coordinator`, `aggregation:coordinator`, and `sort:coordinator` to
filter, aggregation, and sort diagnostics.

Outcome detection prefers `calcite.physical.rels` and falls back to one
relation per line in a legacy physical-plan string. Evidence stays
relation-local. A coordinator filter is a `Calc`/`Filter`-suffix relation with
a condition and no `FILTER->` or qualifying `SCRIPT->` tag. Coordinator
aggregation and sort are `Aggregate`- and `Sort`-suffix relations without
`AGGREGATION->`, or without `SORT->`/qualifying `SORT_EXPR->`, respectively.
Suffix checks avoid treating joins such as `EnumerableSortMergeJoin` as sorts.

The detector initially emits a whole-query diagnostic. The attribution snapshot
narrows it to parser-derived `where` expressions, `statsAggTerm` nodes, or
`sortField` nodes. One unambiguous candidate is resolved locally unless
host-injected `where` clauses make filter counting unsafe. Fast mode drops
unresolved findings; thorough mode validates and explains generated
control/treatment queries before publishing causally attributed findings.
Network, parse, stale-generation, invalid snapshot, unsupported-plan, and
detector failures fail closed and leave static lint markers unchanged.

## Hardcoded assumptions and maintenance

- `SIGNALS` and the `ExplainOutcome` union define the supported operations.
  Adding a coordinator outcome requires updating the outcome type, signal map,
  plan classifier, attribution candidates and probes, hover behavior, and
  focused fixtures. Increment `EXPLAIN_OUTCOME_DETECTOR_VERSION` (currently
  `2`) whenever outcome interpretation changes so probe cache entries cannot be
  reused. Increment `EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION` (currently `1`) when
  the worker snapshot protocol changes.
- Plan interpretation hardcodes `PushDownContext` tags, the
  `opensearch_compounded_script` discriminator, residual `Calc`/`Filter`
  operator suffixes, and coordinator `Aggregate`/`Sort` suffixes. Recheck both
  `json_tree` and legacy string plans when Calcite changes relation names,
  fields, tag spelling, or response shape.
- Attribution recognizes only `whereCommand`, `statsCommand`, and
  `sortCommand`. `BRANCHED_COMMANDS` hardcodes `join`, `append`, `appendcol`,
  `union`, `multisearch`, and `lookup`. The shared alternate-source scan
  separately hardcodes `lookup`, an `append` containing `search`, `appendcol`,
  `appendpipe`, `foreach`, `subSearch`, and `unionDataset`; either condition
  disables all three operations. `graphlookup` is deliberately not pruned
  because its `AS` output belongs to the outer pipeline, so any independent-plan
  behavior needs explicit explain handling rather than blind shared pruning.
  Aggregation attribution also requires exactly one aggregation stage and that
  stage must be plain `stats`; `eventstats`, `streamstats`, and `timechart` are
  unsupported. Sort attribution requires exactly one outer `sort`.
- Alias tracking has dedicated `eval` and single-pair `rename` handling and
  preserves bindings only across `where`, `sort`, `head`, `dedup`, `reverse`,
  and `regex`. A new field-shaping, branching, filter, aggregation, or sort
  command must be classified here; otherwise ranges can be wrong and the rule
  must fail closed.
- Probe rewrites are operation-specific: filters replace every non-treatment
  predicate with `true`; aggregation probes remove `stats` for the control and
  keep one term while truncating after that stage for each treatment; sort
  probes remove the stage for the control and keep one key per treatment. All
  generated queries must pass worker validation before `_explain`.
- The optional filter fix accepts only
  `field +/- unsigned_integer CMP signed_integer` on `byte`, `short`, or
  `integer` mappings. It rejects unknown, floating-point, and `long` mappings,
  division, compound expressions, non-bare fields, and any signed-64-bit
  overflow risk. Even a locally derived fix is removed until a thorough-mode
  treatment proves the flagged outcome disappears.
- Baseline and probe plans use separate, oldest-first 50-entry caches keyed by
  data source and stable prepared query; only successful Calcite plans are
  cached. Errors and unsupported plans retry later, while in-flight requests
  are deduplicated and reference-counted for cancellation. Thorough mode allows
  at most three ambiguous candidates, four extra `_explain` requests, two
  concurrent treatments, and two seconds total.
- The catalog and `query:enhancements:pplLint:rules` default this rule off, and
  the global lint capability also defaults off. The product layer suppresses
  explain traffic without a parseable version, a positive Calcite signal, an
  HTTP client, and at least one explicitly enabled explain rule. Mode defaults
  to `fast`, including legacy bare-array or malformed rule settings.
- `query:enhancements:runtimePplGrammar` is a separate gate. When it is off,
  lint uses the compiled-worker fallback and `query_enhancements` does not
  register the runtime bridge or host explain-query preparer; explain then uses
  raw editor text instead of reproducing source prepending and injected
  dashboard/time filters.

## Tests

Use `explain_detectors.test.ts` and `explain_outcomes.test.ts` for captured
legacy/tree plans, relation locality, exact tags, suffix collisions, and
non-Calcite behavior. Use `candidates_and_probes.test.ts`,
`explain_attribution.test.ts`, `resolve_explain_ranges.test.ts`, and
`explain_quick_fix.test.ts` for command extraction, unsupported branches,
aliases, ambiguity, host-injected filters, probe construction, and fix safety.
`explain_cache.test.ts`, `run_explain_lint.test.ts`,
`language_explain_layer.test.ts`, `explain_query_preparer.test.ts`, and the
server route tests cover cache/cancellation, gates, failure behavior, product
wiring, prepared queries, and proxying. `query_enhancements/server/plugin.test.ts`
and `data/public/ppl_lint/lint_overrides.test.ts` pin the global feature, per-rule,
and fast/thorough defaults.
