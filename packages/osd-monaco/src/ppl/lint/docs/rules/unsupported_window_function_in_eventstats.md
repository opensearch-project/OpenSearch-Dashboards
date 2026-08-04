---
rule: unsupported-window-function-in-eventstats
---

# Unsupported window function in `eventstats` or `streamstats`

## What it detects

An unsupported window function such as `rank`, `dense_rank`, `percent_rank`,
`cume_dist`, `first`, `last`, `nth`, or `ntile` inside `eventstats` or
`streamstats`.

## Why it matters

Those commands accept regular aggregations and `row_number`, but the listed
window functions fail when the query executes.

## Example

```ppl
source=logs | eventstats rank() as rank_value by service
source=logs | eventstats row_number() as row_value by service
source=logs | eventstats avg(latency) as avg_latency by service
```

The first query uses an unsupported window function. The other two forms are
supported.

## How to fix it

Use `row_number()` when a row number is sufficient, use a supported aggregation
such as `avg()`, or compute the ranking with another command.

## Availability

Error severity, enabled by default, on engine version 3.4.0 or later. It needs
only the query text.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                         |
| Severity           | `error`                                                                                                                           |
| Diagnostic message | This window function is not supported in eventstats/streamstats. Only row_number is supported.                                    |
| Fix guidance       | Use `row_number()` for a window value, or choose an aggregation supported by `eventstats` or `streamstats`, such as `avg()`.      |
| Documentation      | [Eventstats aggregation functions](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/eventstats/#aggregation-functions) |

## Implementation

`unsupportedWindowFunctionDetector` in
`packages/osd-monaco/src/ppl/lint/rules/unsupported_window_function.ts` searches
`eventstats` and `streamstats` for window functions and normalizes each function
name to lowercase.

Names in `UNSUPPORTED_WINDOW_FUNCTIONS` produce a diagnostic spanning only the
function name. The set is `rank`, `dense_rank`, `percent_rank`,
`cume_dist`, `nth`, `ntile`, `first`, and `last`. `row_number` and ordinary
aggregate names are not included. The detector does not attach a quick fix.

The catalog's `minVersion: 3.4.0` gate suppresses the rule below that version.
It also suppresses when the version is absent, blank, or unparseable because an
error-severity rule cannot prove that its floor is met. This decision uses the
shipped catalog severity, so lowering severity through an override does not
re-enable the rule on an unknown version.

## Assumptions and maintenance

- Update `UNSUPPORTED_WINDOW_FUNCTIONS` whenever backend support changes. The
  grammar also exposes names such as `DISTINCT_COUNT` and `DC` through the scalar
  branch, so grammar membership alone does not mean the function is unsupported.
- Update the covered-command list when another command accepts the same window
  functions. `streamstats` is currently available only through runtime parser
  bundles, so changes need runtime coverage.
- Revalidate the 3.4 floor and the statement that only `row_number` is supported
  when backend behavior changes. The catalog message and detector set must move
  together.

## Tests

`rules/__tests__/unsupported_window_function.test.ts` covers `rank`,
`dense_rank`, and `ntile`, plus `row_number` and `avg` controls and catalog
message wiring. It supplies version 3.8 explicitly because unknown versions
suppress this error rule.

`src/plugins/data/public/antlr/opensearch_ppl/headless_ppl_lint.test.ts` verifies
the trigger and aggregate control through the runtime-bundle API.
`__tests__/version_filter.test.ts` covers the known, below-floor, and
unknown-version policies. No focused case currently exercises
`streamstatsCommand` or every member of the unsupported set; add those cases
when changing either hardcoded list.
