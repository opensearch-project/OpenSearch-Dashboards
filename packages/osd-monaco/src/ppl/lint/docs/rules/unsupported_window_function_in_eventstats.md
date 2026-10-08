---
rule: unsupported-window-function-in-eventstats
---

# Unsupported window function in `eventstats` or `streamstats`

An unsupported window function such as `rank`, `dense_rank`, `percent_rank`,
`cume_dist`, `first`, `last`, `nth`, or `ntile` inside `eventstats` or
`streamstats`.

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

## Requirements

Requires engine version 3.4 or later and needs only the query text.

## Rule settings

| Setting       | Current value                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                                |
| Severity      | `error`                                                                                                                           |
| Message       | This window function is not supported in eventstats/streamstats. Only row_number is supported.                                    |
| Guidance      | Use `row_number()` for a window value, or choose an aggregation supported by `eventstats` or `streamstats`, such as `avg()`.      |
| Documentation | [Eventstats aggregation functions](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/eventstats/#aggregation-functions) |
