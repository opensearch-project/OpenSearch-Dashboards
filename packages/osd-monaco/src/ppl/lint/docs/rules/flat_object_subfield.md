---
rule: flat-object-subfield
---

# `flat_object` field referenced from PPL

## What it detects

A reference to a field whose longest known mapping prefix is `flat_object`,
including the flat-object root itself and dotted paths below it.

## Why it matters

On the verified Calcite surface, PPL cannot resolve a `flat_object` root or
subfield. The query fails with a field-not-found error.

## Example

```ppl
source=logs | where attributes.region = "us-east-1"
source=logs | where region = "us-east-1"
```

In the first query, `attributes` is mapped as `flat_object`. The second uses a
separately indexed field.

## How to fix it

Use another indexed field, query the value through DQL or the Search API, or
map and reindex the data as a regular object. No automatic fix is offered
because PPL has no equivalent reference for the existing mapping.

## Availability

Error severity, off by default, on Calcite engine version 3.8.0 or later. It
requires selected-dataset type metadata and is source-scoped.

## Implementation

`flatObjectSubfieldDetector` in
`packages/osd-monaco/src/ppl/lint/rules/flat_object_subfield.ts` requires
`context.isCalcite === true` and a nonempty `context.typeMap`. It visits both
grammar rules in `DOTTED_PATH_RULES` (`qualifiedName` and `wcQualifiedName`),
parses each path with quote-aware segment handling, and calls
`findLongestTypedPrefix`. Prefixes are searched from the complete path toward
the root, so a separately typed child such as `attributes.http` takes precedence
over a `flat_object` ancestor such as `attributes`.

`typeMap` is extracted from unambiguous index-pattern `esTypes` and is forwarded
only while dataset/data-source/type provenance matches. The catalog applies
`needsContext`, `sourceScoped`, Calcite, and minimum-version gates; the detector
also checks Calcite and the map for direct-call safety.

The diagnostic spans the matched path node and uses the catalog message.
Positions are deduplicated because one reference can be reachable through both
grammar rule names. No fix is offered because Calcite has no equivalent valid
reference to the existing mapping.

## Hardcoded assumptions and maintenance

- `FLAT_OBJECT_TYPES` contains only `flat_object`. Update it if OpenSearch adds
  aliases or changes the mapping type exposed through index-pattern `esTypes`.
- `DOTTED_PATH_RULES` is shared grammar vocabulary. If a command exposes field
  paths through another rule, add that rule or its references will be missed.
- Longest-prefix behavior is deliberate: a more-specific typed field overrides
  a flat-object ancestor. Reverify this if field-capabilities or multi-field
  mapping semantics change.
- Missing, empty, conflicting, or malformed type information produces no
  finding. Since this is an error-severity rule with a minimum version, an
  unknown data-source version also suppresses it even when Calcite is known.
- Created fields are not typed by pipeline analysis. An `eval`, alias, or
  extraction output is checked only if its exact path is already in `typeMap`.
- The detector traverses the entire tree and does not prune alternate-source
  subtrees. A reference inside lookup/append/subsearch/union can therefore be
  classified with the outer dataset's mapping. New nested-source commands do
  not become safe merely by updating `collectAlternateSourceSubtrees`.
- Top-level source mismatch suppression fails open for wildcard, pipe-first,
  multi-source, and inconclusive queries.

## Tests

- `packages/osd-monaco/src/ppl/lint/rules/flat_object_subfield.test.ts`: roots,
  children, quoting, longest-prefix precedence, deduplication, ranges, and
  detector self-gating.
- `packages/osd-monaco/src/ppl/lint/field_path.test.ts`: quote-aware parsing and
  longest typed-prefix selection.
- `packages/osd-monaco/src/ppl/lint/rules/local_rules_product_path.test.ts`:
  catalog/registry/runner plumbing and absent context.
- `packages/osd-monaco/src/ppl/lint/__tests__/source_mismatch_suppression.test.ts`:
  source-scoped behavior.
- `src/plugins/data/public/antlr/opensearch_ppl/grammar_surface_equivalence.test.ts`
  and `runtime_lint.test.ts`: runtime/compiled behavior.
- `src/plugins/data/public/ppl_lint/lint_context_builder.test.ts`: type-map
  provenance and ambiguous mapping types.
