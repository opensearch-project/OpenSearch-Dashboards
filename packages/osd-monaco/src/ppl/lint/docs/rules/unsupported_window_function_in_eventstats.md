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
