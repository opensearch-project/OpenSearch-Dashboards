---
rule: union-min-datasets
---

# Query-initial `union` requires two datasets

## What it detects

A query-initial `union` command containing fewer than two explicit datasets.
For a mid-pipeline `union`, the upstream pipeline is the implicit first dataset,
so one explicit dataset is valid and is not flagged.

## Why it matters

Query-initial `union` has no upstream result to include. The engine rejects it
unless at least two datasets are provided.

## Example

```ppl
| union logs-a
| union logs-a, logs-b
```

The first query has one dataset. The second combines two.

## How to fix it

Add another direct index or bracketed subsearch. If only one dataset is needed,
run it as a normal search rather than a query-initial `union`.

## Availability

Error severity, enabled by default, on Calcite engine version 3.7.0 or later.
This is a runtime grammar rule, so it also requires a compatible grammar bundle
for the active data source.
