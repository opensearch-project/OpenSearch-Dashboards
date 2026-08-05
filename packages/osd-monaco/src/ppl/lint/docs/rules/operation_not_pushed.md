---
rule: operation-not-pushed
---

# Operation left on the PPL coordinator

An `_explain` plan showing that a filter, aggregation, or sort remained on the
PPL coordinator instead of being included in the index request.

## Example

```ppl
source=accounts | where age - 2 > 30
source=accounts | where age > 32
```

Arithmetic on the field side can prevent native pushdown. The actual finding is
based on the returned plan, not query shape alone.

## How to fix it

Rewrite the highlighted operation using indexed fields and supported
expressions. For a narrow additive comparison over a bounded integer mapping,
the linter can offer an exact inversion such as `age - 2 > 30` to `age > 32`.
The fix is withheld unless plan attribution and type checks prove it safe.

## Requirements

Requires Calcite 3.3 or later, a known data-source version, HTTP access to
`_explain`, and a clean parse. Fast mode omits ambiguous findings; thorough
mode can issue isolation probes.

## Rule settings

| Setting       | Current value                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Default       | Off                                                                                                                                  |
| Severity      | `warning`                                                                                                                            |
| Message       | This operation runs after the index scan, so OpenSearch must read and return its input rows first.                                   |
| Guidance      | Rewrite the highlighted operation with indexed fields and supported functions so the PPL engine can include it in the index request. |
| Documentation | [SQL and PPL performance limitations](https://docs.opensearch.org/latest/sql-and-ppl/limitation/#performance)                        |
