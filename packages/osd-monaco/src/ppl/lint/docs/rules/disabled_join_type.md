---
rule: disabled-join-type
---

# Join type disabled by the cluster

## What it detects

A `right`, `full`, or `cross` join while the cluster setting
`plugins.calcite.all_join_types.allowed` is not known to be enabled.

## Why it matters

These high-cost join types are disabled by default. The query fails at
execution time unless an administrator explicitly allows them.

## Example

```ppl
source=a | join type=cross b on a.id=b.id
source=a | join type=inner b on a.id=b.id
```

The first query requires the cluster opt-in. The second uses a default-enabled
join type.

## How to fix it

Use an `inner` or `left` join when it preserves the intended result. Otherwise,
ask an administrator to enable all join types after evaluating the cost.

## Availability

Warning severity, configured off by default, on all engine versions. Users can
opt in through the per-rule Advanced Setting. The rule self-suppresses when the
host reports that all join types are allowed.

## Implementation

`disabledJoinTypeDetector` in
`packages/osd-monaco/src/ppl/lint/rules/disabled_join_type.ts` enumerates every
`joinCommand`. It supports both grammar shapes that carry the join type: a
direct `sqlLikeJoinType` child for runtime syntax such as `join right ...`, and
a `joinType` child under each direct `joinOption` for syntax such as
`join type=cross ...`.

Only direct `joinOption` children are inspected. Nested joins are found
separately by the outer `joinCommand` walk, preventing a nested type from being
reported twice or masking the outer type. Direct terminal text is lowercased and
matched against `right`, `full`, and `cross`. The diagnostic spans the matched
type rule, not the whole join, and has no quick fix.

The rule suppresses only when
`context.settings.allJoinTypesAllowed === true`. Missing settings, failed cache
reads, and an explicit `false` all warn. This fail-closed policy is intentional:
the cluster opt-in must be positively observed before the linter suppresses an
execution-time warning.

## Hardcoded assumptions and maintenance

- `DISABLED_JOIN_KEYWORDS` mirrors the engine's
  `highCostJoinTypes = RIGHT/CROSS/FULL`. Reconcile it when the backend changes
  the protected set. `outer` remains an alias for `left` and must not be added.
- Keep both `sqlLikeJoinType` and `joinOption` -> `joinType` traversals when join
  syntax or grammar labels change. A descendant search under the outer join
  reintroduces duplicate nested diagnostics.
- The settings route reads
  `plugins.calcite.all_join_types.allowed` with transient, persistent, then
  default precedence and considers only the normalized string `true` enabled.
  Renaming the backend setting requires coordinated route, cache, context, and
  detector updates.
- The catalog has no Calcite or version predicate. Do not add one solely because
  the setting name contains `calcite`; the engine validation being modeled
  applies independently of the selected query-engine signal.

## Tests

`rules/__tests__/disabled_join_type.test.ts` covers the compiled
`type=cross|right|full` form, allowed join controls, setting-based suppression,
and nested joins with distinct, nonduplicated ranges.

`rules/__tests__/runtime_rules_positive_path.test.ts` directly verifies false,
true, and absent setting behavior plus nested traversal. There is no focused
test for the runtime-only SQL-prefix form (`join right ...`); add one against a
runtime grammar bundle when changing that branch. Settings transport and
context wiring are covered by `ppl_calcite_settings.test.ts`,
`calcite_settings_cache.test.ts`, and `lint_context_builder.test.ts`.
