---
rule: division-by-zero
---

# Division or modulo by literal zero

## What it detects

A `/` or `%` expression whose right operand is a numeric literal equal to zero,
including signed, decimal, and parenthesized forms.

## Why it matters

PPL evaluates division and modulo by zero to `null` instead of returning an
error. Filters and aggregations can then skip the affected value while the
query appears to have succeeded.

## Example

```ppl
source=logs | eval error_rate = errors / 0
source=logs | eval error_rate = if(total = 0, 0, errors / total)
```

The first expression always produces `null`. The second handles a zero total
explicitly.

## How to fix it

Use the intended divisor, or guard a divisor that can legitimately be zero.
No automatic fix is offered because the correct fallback value is
domain-specific.

## Availability

Warning severity, enabled by default, on all engine versions. It needs only the
query text.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                              |
| Severity           | `warning`                                                                                                              |
| Diagnostic message | Dividing by zero returns no value (null) instead of an error.                                                          |
| Fix guidance       | Use the intended divisor, or handle zero before dividing, for example `if(total = 0, 0, errors / total)`.              |
| Documentation      | [Arithmetic operators](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators) |

## Implementation

`divisionByZeroDetector` in
`packages/osd-monaco/src/ppl/lint/rules/division_by_zero.ts` walks arithmetic
expressions, finds `/` or `%`, and treats the complete right operand as the
divisor.

`isZeroLiteral` removes enclosing parentheses repeatedly, removes one leading
sign, accepts decimal digit forms such as `0`, `0.0`, `0.`, and `.0`, and
confirms the result with `Number(text) === 0`. The diagnostic spans only the
divisor expression. It carries no quick fix because the detector cannot infer a
replacement or fallback value.

The catalog has no version, engine, grammar-surface, or metadata gate. If
`valueExpression` is absent from an active grammar, the shared rule lookup
returns no nodes and the detector produces no finding.

## Assumptions and maintenance

- Detection is intentionally literal-only. It does not evaluate identifiers,
  functions, casts, arithmetic that folds to zero, or non-decimal literal
  syntaxes. Expand `isZeroLiteral` and its tests if the grammar adds supported
  numeric forms such as exponent notation.
- If arithmetic syntax expands, reverify that the detector selects the complete
  right operand and reports its range rather than a nested expression.
- The traversal runs on error-recovered trees. Keep it defensive: a missing
  divisor must remain a no-op rather than causing the runner to catch and skip
  the entire detector.

## Tests

`rules/__tests__/division_by_zero.test.ts` covers `/ 0`, `/ 0.0`, `% 0`,
nonzero controls, catalog message wiring, and operation without lint metadata.
Add focused cases for signed and parenthesized zero whenever `isZeroLiteral` or
the expression grammar changes.

`src/plugins/data/public/antlr/opensearch_ppl/runtime_lint.test.ts` verifies `/`
and `%` on the runtime grammar path. Changes to rule names or tree shape should
also add a compiled-versus-runtime case so a warm grammar cache cannot change
the result.
