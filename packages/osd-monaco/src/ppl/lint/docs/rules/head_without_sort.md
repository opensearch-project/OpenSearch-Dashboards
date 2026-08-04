---
rule: head-without-sort
---

# `head` without a stable order

## What it detects

A `head` command with no order-establishing `sort`, `top`, or `rare` command
earlier in the current pipeline. A command that invalidates ordering between
`sort` and `head` also causes the rule to fire.

## Why it matters

Without a stable order, `head` returns whichever rows arrive first. The same
query can return different rows across runs or cluster layouts.

## Example

```ppl
source=logs | head 10
source=logs | sort - @timestamp | head 10
```

The first query has no defined ordering. The second consistently returns the
ten newest rows.

## How to fix it

Add a `sort` before `head` when the selected rows must be stable. No automatic
fix is offered because the linter cannot infer the correct sort field or
direction.

## Availability

Info severity, configured off by default, on all engine versions. Users can opt
in through the per-rule Advanced Setting. It needs only the query text.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | Off; per-rule opt-in and the global PPL lint capability are required                                                                                                             |
| Severity           | `info`                                                                                                                                                                           |
| Diagnostic message | Without sort, head can return different rows each time the query runs.                                                                                                           |
| Fix guidance       | Add `sort` before `head` when you need stable top or bottom results.                                                                                                             |
| Documentation      | [Head command: retrieving results after an offset](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/head/#example-3-retrieving-the-first-n-results-after-an-offset-m) |

## Implementation

`headWithoutSortDetector` in
`packages/osd-monaco/src/ppl/lint/rules/head_without_sort.ts` builds an ordered
stage list with `buildPipelineShape`. The stage builder resolves command rule
names against the active compiled or runtime grammar, using
`COMMAND_ORDER_EFFECTS` in
`packages/osd-monaco/src/ppl/lint/pipeline_shape.ts` as the command census and
order classification.

The detector keeps a `sawSort` state. Commands in
`ORDER_ESTABLISHING_COMMANDS` set it, commands in
`ORDER_PRESERVING_COMMANDS` leave it unchanged, and every other recognized
command clears it. An unordered `headCommand` produces a diagnostic spanning
the complete command. No quick fix is attached.

Stages inside roots returned by `collectAlternateSourceSubtrees` are skipped so
that an inner sort cannot order an outer `head`, or vice versa. The root command
itself is retained: for example, top-level `append` and `lookup` still clear an
existing order while their secondary pipelines are ignored.

The catalog has no version, engine, grammar-surface, or metadata gate, so the
detector runs on every available parse tree when the rule is enabled.

## Assumptions and maintenance

- Every new or renamed PPL command must be added to `COMMAND_ORDER_EFFECTS` as
  `preserves`, `establishes`, or `invalidates`. An omitted command is absent from
  the stage list and is silently treated as though it did not affect ordering.
- Recheck the classification against a live `_explain` plan whenever a command's
  execution changes. The current map assumes `sort`, `top`, `rare`, `chart`, and
  `timechart` establish order; joins, aggregations, and unions invalidate it.
- Update `collectAlternateSourceSubtrees` when a command gains a nested or
  secondary pipeline. Incorrect scoping lets ordering inside that pipeline leak
  into the outer one.
- `command_census.test.ts` checks only the bundled grammar and the committed 3.8
  grammar fixture. A command added by a newer backend is not covered until that
  fixture is refreshed.

## Tests

`rules/__tests__/head_without_sort.test.ts` covers missing and trailing sorts,
preserving and invalidating stages, multiple `head` commands, alternate-source
scoping, and the `streamstats`/`eventstats` order distinction.

`src/plugins/data/public/antlr/opensearch_ppl/command_census.test.ts` requires
every command on both captured grammar surfaces to be classified.
`command_order_effects.test.ts` checks classifications behaviorally on compiled
and runtime trees, including command-name drift. `runtime_lint.test.ts` and
`headless_ppl_lint.test.ts` cover runtime execution and pipe-first range
remapping.
