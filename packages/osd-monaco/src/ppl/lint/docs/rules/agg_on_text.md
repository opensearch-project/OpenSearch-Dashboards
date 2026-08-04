---
rule: agg-on-text
---

# Numeric aggregation on a text field

## What it detects

`avg`, `sum`, `median`, variance, or standard-deviation aggregation applied to
one bare field mapped as `text` or `keyword`. Type-agnostic aggregations such as
`count`, `min`, and `max`, and computed arguments, are not flagged.

## Why it matters

On the verified Calcite surface, a numeric-only aggregation over text returns
`null` instead of an error. The query succeeds but the result does not represent
the stored values.

## Example

```ppl
source=logs | stats avg(message)
source=logs | stats avg(response_time)
```

The first query aggregates a text field. The second uses a numeric field.

## How to fix it

Aggregate a numeric field. If the text field intentionally stores numbers, map
and reindex it as a numeric type or cast a validated value before aggregating.
No automatic fix is offered because the correct field and conversion are
schema-specific.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires selected-dataset type metadata and is source-scoped.

## Implementation

`aggOnTextDetector` in
`packages/osd-monaco/src/ppl/lint/rules/agg_on_text.ts` requires
`context.isCalcite === true` and a nonempty `context.typeMap`. It walks every
`statsFunction`, reads its direct `statsFunctionName` and `functionArgs`
children, and continues only when the arguments contain exactly one
`fieldExpression` whose text spans the complete argument. The field path is
quote-aware and must parse successfully; its canonical full path is then looked
up exactly in `typeMap`.

`typeMap` comes from index-pattern `esTypes`. A field with no type or conflicting
types remains in `fields` but is deliberately omitted from `typeMap`, which
makes this rule stay quiet. The context builder forwards the map only while the
dataset/data-source/type provenance matches. The catalog adds `needsContext`,
`sourceScoped`, Calcite, and minimum-version gates; the detector repeats the
Calcite and map checks so direct calls also fail closed.

The diagnostic uses the catalog message and spans the complete `statsFunction`.
No fix is emitted because neither a replacement field nor a valid conversion
can be inferred from mapping metadata.

## Hardcoded assumptions and maintenance

- `NUMERIC_ONLY_AGGS` is `avg`, `sum`, `var_samp`, `var_pop`, `stddev_samp`,
  `stddev_pop`, and `median`; `TEXT_TYPES` is `text` and `keyword`. Reverify the
  live Calcite result and update both sets when aggregation or mapping semantics
  change. `count`, `min`, `max`, and percentile forms are intentionally absent.
- The detector depends on the grammar names `statsFunction`,
  `statsFunctionName`, `functionArgs`, and `fieldExpression`. A new aggregation
  grammar alternative will not be covered automatically.
- Only a bare field is classified. Computed arguments, multiple fields,
  malformed paths, absent/ambiguous types, and types outside `TEXT_TYPES`
  produce no finding.
- The lookup is for the full canonical path; an ancestor's type never classifies
  a child. Fields created by `eval`, aliases, or extraction commands have no
  inferred type and are not checked unless the host supplies that exact path in
  `typeMap`.
- Unlike `field-validation`, this detector does not prune
  `collectAlternateSourceSubtrees`; a `stats` inside a lookup, append, subsearch,
  union, or other nested source can be checked against the outer dataset's
  `typeMap`. Add alternate-source scoping when supporting those command shapes.
- Top-level source mismatch suppression is conclusive-only: pipe-first,
  wildcard, multi-source, and inconclusive queries still run with the selected
  dataset's metadata.

## Tests

- `packages/osd-monaco/src/ppl/lint/rules/agg_on_text.test.ts`: aggregation/type
  sets, bare arguments, configured diagnostics, and detector self-gating.
- `packages/osd-monaco/src/ppl/lint/rules/local_rules_product_path.test.ts`:
  bundled catalog, registry, runner, and `needsContext` plumbing.
- `packages/osd-monaco/src/ppl/lint/__tests__/source_mismatch_suppression.test.ts`:
  source-scoped behavior.
- `src/plugins/data/public/antlr/opensearch_ppl/grammar_surface_equivalence.test.ts`
  and `runtime_lint.test.ts`: runtime/compiled grammar parity and runtime context
  forwarding.
- `src/plugins/data/public/ppl_lint/lint_context_builder.test.ts`: type
  extraction, ambiguous mappings, provenance, and Calcite state.
