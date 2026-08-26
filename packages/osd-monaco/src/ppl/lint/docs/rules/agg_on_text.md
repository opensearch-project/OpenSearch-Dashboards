---
rule: agg-on-text
---

# Numeric aggregation on a text field

`avg`, `sum`, `median`, variance, or standard-deviation aggregation applied to
one bare field mapped as `text` or `keyword`. Type-agnostic aggregations such as
`count`, `min`, and `max`, and computed arguments, are not flagged.

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

## Requirements

Requires Calcite 3.7 or later, selected-dataset type metadata, and matching source scope.

## Rule settings

| Setting       | Current value                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                                    |
| Severity      | `warning`                                                                                                                             |
| Message       | Numeric aggregation on a text field may return no value (null), because text is not stored as a number.                               |
| Guidance      | Aggregate a numeric field instead. If this field really does hold numbers, map it as a numeric type, or `cast` it before aggregating. |
| Documentation | [Stats limitations](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/stats/#limitations)                                   |
