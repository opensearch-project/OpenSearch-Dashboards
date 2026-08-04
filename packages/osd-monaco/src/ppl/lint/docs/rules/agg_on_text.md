---
rule: agg-on-text
---

# Numeric aggregation on a text field

## What it detects

`avg`, `sum`, `median`, variance, or standard-deviation aggregation applied to
one bare field mapped as `text` or `keyword`. Type-agnostic aggregations such as
`count`, `min`, and `max`, and computed arguments, are not flagged.

## Why it matters

On the verified Calcite surface, a numeric-only aggregation over text returns
`null` instead of an error. The query succeeds but the result does not represent
the stored values.

## Example

```ppl
source=logs | stats avg(message)
source=logs | stats avg(response_time)
```

The first query aggregates a text field. The second uses a numeric field.

## How to fix it

Aggregate a numeric field. If the text field intentionally stores numbers, map
and reindex it as a numeric type or cast a validated value before aggregating.
No automatic fix is offered because the correct field and conversion are
schema-specific.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires selected-dataset type metadata and is source-scoped.
