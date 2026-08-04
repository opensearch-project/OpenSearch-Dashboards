---
rule: type-mismatch-numeric
---

# Numeric field compared with nonnumeric text

## What it detects

An `=` or `==` comparison between one bare numeric field and a quoted string
that cannot be converted to a number. Either operand order is recognized.
Other comparison operators and computed field expressions are not flagged.

## Why it matters

On the verified Calcite surface, the comparison returns no rows instead of an
error. A user can mistake a type mismatch for the absence of matching data.

## Example

```ppl
source=accounts | where age = "thirty"
source=accounts | where age = 30
```

The first value cannot be converted to the numeric mapping of `age`.

## How to fix it

Compare the field with a number, or use the text field that contains the value
you intend to match. No automatic fix is offered because the intended value is
unknown.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires selected-dataset type metadata and is source-scoped.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                        |
| Severity           | `warning`                                                                                                                        |
| Diagnostic message | This field is numeric, but the compared value is not a number, so the comparison returns no rows.                                |
| Fix guidance       | Compare the field with a number, such as `500`, or use the text field that contains the value you want.                          |
| Documentation      | [Basic predicate operators](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#basic-predicate-operators) |

## Implementation

`typeMismatchNumericDetector` in
`packages/osd-monaco/src/ppl/lint/rules/type_mismatch_numeric.ts` requires
`context.isCalcite === true` and a nonempty `context.typeMap`. It walks
comparisons, accepts only `=` or `==`, and requires one operand to be a complete
quoted string and the other to be exactly one bare field; either operand order
is supported.

The detector canonicalizes the field path and performs an exact `typeMap`
lookup. It strips the literal's outer quote pair and uses JavaScript `Number` as
a deliberately permissive coercion oracle. Nonblank values accepted by
`Number` are left alone; blank or nonnumeric strings are reported.

The host builds `typeMap` only from fields with one unambiguous index-pattern
`esTypes` value and forwards it only when cache provenance matches the active
dataset. Catalog gates enforce `needsContext`, `sourceScoped`, Calcite, and
version 3.7.0 or later; the detector repeats the engine/map checks. The
diagnostic spans the comparison parent and has no automatic fix.

## Assumptions and maintenance

- `VERIFIED_OPERATORS` contains only `=` and `==`. Add an operator only after
  verifying its Calcite failure mode and both grammar surfaces.
- `NUMERIC_TYPES` manually mirrors `OSD_FIELD_TYPES.NUMBER`: `byte`, `short`,
  `integer`, `long`, `unsigned_long`, `half_float`, `float`, `double`,
  `scaled_float`, and `token_count`. Keep the list synchronized when supported
  field types change.
- The rule handles only a simple binary equality between one bare field and one
  quoted string. Wrapped fields, computed expressions, field-to-field
  comparisons, and compound literals intentionally produce no finding.
- `Number` may accept formats that Calcite handles differently. This
  over-acceptance is intentional: uncertain coercions become false negatives,
  not false positives. Reverify before replacing or tightening the oracle.
- Type lookup is exact. Created/renamed/extracted fields are not inferred, and
  missing or conflicting mapping types suppress the rule.
- The detector does not prune alternate-source subtrees, so comparisons in
  lookup/append/subsearch/union can use the outer dataset's type map. Review
  nested-source handling whenever command coverage expands.
- Source mismatch gating is conclusive-only; wildcard, pipe-first, multi-source,
  and inconclusive queries continue to run.

## Tests

- `packages/osd-monaco/src/ppl/lint/rules/type_mismatch_numeric.test.ts`:
  operators, operand order, numeric types/coercion, exclusions, configured
  diagnostics, and self-gating.
- `packages/osd-monaco/src/ppl/lint/rules/local_rules_product_path.test.ts`:
  catalog/registry/runner and `needsContext` plumbing.
- `packages/osd-monaco/src/ppl/lint/__tests__/source_mismatch_suppression.test.ts`:
  source-scoped behavior.
- `src/plugins/data/public/antlr/opensearch_ppl/grammar_surface_equivalence.test.ts`
  and `runtime_lint.test.ts`: runtime/compiled grammar behavior and context
  forwarding.
- `src/plugins/data/public/ppl_lint/lint_context_builder.test.ts`: numeric
  metadata extraction, conflicting mappings, provenance, and Calcite state.
