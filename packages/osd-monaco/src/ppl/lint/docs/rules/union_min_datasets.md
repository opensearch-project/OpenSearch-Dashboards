---
rule: union-min-datasets
---

# Query-initial `union` requires two datasets

A query-initial `union` command containing fewer than two explicit datasets.
For a mid-pipeline `union`, the upstream pipeline is the implicit first dataset,
so one explicit dataset is valid and is not flagged.

## Example

```ppl
| union logs-a
| union logs-a, logs-b
```

The first query has one dataset. The second combines two.

## How to fix it

Add another direct index or bracketed subsearch. If only one dataset is needed,
run it as a normal search rather than a query-initial `union`.

## Requirements

Requires Calcite 3.7 or later and a compatible runtime grammar for the active data source.

## Rule settings

| Setting       | Current value                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                    |
| Severity      | `error`                                                                                               |
| Message       | The union command requires at least two datasets.                                                     |
| Guidance      | Add another dataset to `union`, or remove `union` when using only one dataset.                        |
| Documentation | [PPL commands index](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/index/#ppl-commands) |
