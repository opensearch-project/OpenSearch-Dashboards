---
rule: replace-wildcard-asymmetry
---

# Mismatched wildcard captures in `replace`

## What it detects

A `replace` pair whose replacement contains a nonzero number of unescaped `*`
wildcards that differs from the pattern's wildcard count. A fixed replacement
with no wildcard is allowed.

## Why it matters

Each wildcard in the replacement refers to a wildcard capture from the pattern.
The engine rejects a replacement that requests a different number of captures.

## Example

```ppl
source=logs | replace "*-*" WITH "*" IN host
source=logs | replace "*-*" WITH "*:*" IN host
```

The first pair has two pattern wildcards and one replacement wildcard. The
second has two on each side.

## How to fix it

Use the same number of unescaped `*` wildcards in the pattern and replacement,
or remove all replacement wildcards when a fixed value is intended.

## Availability

Error severity, enabled by default, on Calcite engine version 3.4.0 or later.
This is a runtime grammar rule, so it also requires a compatible grammar bundle
for the active data source.

## Implementation

The catalog marks this rule `runtimeOnly`, Calcite-only, and
`minVersion: 3.4.0`. `runLint` requires a runtime-bundle grammar, a compatible
known version, and `isCalcite: true`; the detector repeats the Calcite check for
direct callers.

`replaceWildcardAsymmetryDetector` in
`packages/osd-monaco/src/ppl/lint/rules/replace_wildcard_asymmetry.ts` reads the
first two direct `stringLiteral` children of every `replacePair` as pattern and
replacement, removes their outer quotes, and counts unescaped `*` characters. A
star is escaped only when it has an odd number of immediately preceding
backslashes. The rule reports when the replacement count is nonzero and differs
from the pattern count; zero replacement wildcards intentionally means a fixed
replacement. Pairs with fewer than two literals and unavailable grammar rules
produce no diagnostic.

## Hardcoded assumptions and maintenance

- The implementation assumes the runtime nodes are `replacePair` and
  `stringLiteral`, with pattern then replacement as direct children. A grammar
  wrapper, optional literal, or new replacement form requires a structural
  extractor rather than relying on child order.
- Wildcard parity is based on the raw query text after outer-quote removal. If
  engine escaping or wildcard semantics change, update
  `countUnescapedWildcards` and add cases for odd/even backslash runs before
  changing the rule message.
- `pipeline_shape.ts` classifies `replaceCommand` as order-invalidating. Add any
  new command rule or alias to `COMMAND_ORDER_EFFECTS`; otherwise it disappears
  from pipeline ordering and created-field analysis.
- Keep the silent behavior for missing rule names or incomplete parse pairs.
  Catalog version, Calcite, and runtime-only changes belong in
  `rules_catalog.json`, not just in this detector.

## Tests

- `rules/__tests__/replace_wildcard_asymmetry.test.ts` covers compiled-surface
  suppression and bare, escaped, even-backslash, and absent wildcards.
- `rules/__tests__/runtime_rules_positive_path.test.ts` covers asymmetric,
  symmetric, fixed replacements, and the detector's Calcite gate.
- `rules/__tests__/runtime_rules_plumbing.test.ts` verifies the real catalog,
  registry, runtime-only gate, and end-to-end diagnostic message.
- A new `replace` grammar variant also needs `command_census.test.ts` and
  `command_order_effects.test.ts` coverage.
