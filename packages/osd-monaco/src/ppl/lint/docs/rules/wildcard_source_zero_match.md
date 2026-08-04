---
rule: wildcard-source-zero-match
---

# Wildcard source matches no visible index

## What it detects

A simple local wildcard in the top-level `source=` clause that matches none of
the visible index names. Complex multi-target, exclusion, date-math,
cross-cluster, and hidden-index forms are left alone because the local index
inventory cannot reproduce their semantics exactly.

## Why it matters

The query is valid and returns no rows. That can look like an empty dataset when
the actual problem is a typo in the index pattern.

## Example

```ppl
source=lgos-*
source=logs-*
```

If visible indexes include `logs-2026.08.04`, the first pattern matches none
and the second matches one.

## How to fix it

Correct the wildcard pattern or select an existing index.

## Availability

Warning severity, enabled by default, on all engine versions. It requires
visible index metadata for the active data source and self-suppresses when that
inventory is absent or empty.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                        |
| Severity           | `warning`                                                                                                                        |
| Diagnostic message | Wildcard source pattern matches no known index.                                                                                  |
| Fix guidance       | Correct the `source=` pattern or choose an existing index.                                                                       |
| Documentation      | [Search command wildcard example](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/search/#example-6-using-wildcards) |

## Implementation

`wildcardSourceZeroMatchDetector` in
`packages/osd-monaco/src/ppl/lint/rules/wildcard_source_zero_match.ts` first
requires a nonempty `context.visibleIndices`. The host builds that inventory in
`src/plugins/data/public/ppl_lint/visible_indices.ts` from the data source's
`resolve_index/*` response, including indices, aliases, and data streams.
Request failure, an empty response, or more than 5,000 names returns an empty
list, which makes the rule suppress rather than interpret missing inventory as
zero matches. The lint context reuses the inventory across datasets only when
the data source identity matches.

`classifyTopLevelSource` recognizes the supported `source` and `index` forms. It
uses the original query's pipe-first flag so a synthetic parser prefix is never
treated as a real source, and returns inconclusive for zero or multiple
candidates. The rule continues only for one simple local wildcard.

Simple patterns contain `*`, do not start with `-` or `.`, and contain only
letters, digits, `.`, `_`, `+`, `-`, and `*`. Regex metacharacters are escaped,
each `*` becomes `.*`, and the resulting case-sensitive expression is anchored
to the full visible name. Exact names, multi-targets, exclusions, date math,
cross-cluster sources, hidden-index forms, `?`, whitespace, and backslash forms
are intentionally not evaluated.

## Assumptions and maintenance

- `top_level_source.ts` hardcodes the source keywords `source` and `index` and
  supports only the current top-level source forms. Add new source syntax there,
  then verify both runtime and compiled parser surfaces before this rule uses it.
- `isSimpleLocalWildcardPattern` and `wildcardToRegExp` reproduce only the
  documented `*` subset. Do not broaden the accepted characters or operators
  until local matching can reproduce backend semantics exactly.
- `MAX_VISIBLE_INDICES` and the `resolve_index/*` host fetch are part of the
  correctness boundary. If the cap, endpoint, response buckets, or data-source
  cache key changes, preserve the empty-on-failure behavior.
- The rule is deliberately not `sourceScoped`: its inventory is data-source
  scoped, not selected-dataset field metadata. A source/dataset mismatch must
  not suppress the warning.

## Tests

- `rules/wildcard_source_zero_match.test.ts` covers missing context, unsupported
  forms, anchored matching, literal regex characters, diagnostics, and the
  accepted-pattern helper.
- `top_level_source.test.ts` covers concrete, wildcard, pipe-first, multiple,
  and absent source classification.
- `grammar_surface_equivalence.test.ts` verifies supported and unsupported
  wildcard forms behave the same on runtime and compiled grammars.
- `source_mismatch_suppression.test.ts` verifies the rule is not suppressed by a
  selected-dataset mismatch.
- `visible_indices.test.ts` covers the host request, data-source parameter,
  response flattening, failures, and the 5,000-name boundary;
  `lint_context_builder.test.ts` covers data-source provenance.
