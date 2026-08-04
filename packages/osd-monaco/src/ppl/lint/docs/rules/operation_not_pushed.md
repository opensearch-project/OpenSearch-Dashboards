---
rule: operation-not-pushed
---

# Operation left on the PPL coordinator

## What it detects

An `_explain` plan showing that a filter, aggregation, or sort remained on the
PPL coordinator instead of being included in the index request.

## Why it matters

The coordinator must receive and process more intermediate rows. On a large
dataset, that transfer and processing can dominate query latency.

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

## Availability

Warning severity, off by default, on Calcite engine version 3.3.0 or later. It
requires a known data-source version, HTTP access to `_explain`, and a clean
parse. Fast mode omits ambiguous findings; thorough mode can issue isolation
probes.
