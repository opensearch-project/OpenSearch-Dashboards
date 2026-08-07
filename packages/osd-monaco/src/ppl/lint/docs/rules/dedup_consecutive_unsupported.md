---
rule: dedup-consecutive-unsupported
---

# Consecutive deduplication falls back from Calcite

A `dedup` command with `consecutive=true` on a Calcite data source.

## Example

```ppl
source=logs | dedup 1 status consecutive=true
source=logs | dedup 1 status
```

The first query requires fallback. The second uses normal deduplication on
Calcite.

## How to fix it

Remove `consecutive=true` when normal deduplication is acceptable. There is no
equivalent rewrite that preserves consecutive-only behavior.

## Requirements

Requires Calcite 3.3 or later. It needs only the query text and a positive Calcite signal.

## Rule settings

| Setting       | Current value                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | Off                                                                                                                                                     |
| Severity      | `warning`                                                                                                                                               |
| Message       | consecutive=true uses an older query engine and may make this query slower.                                                                             |
| Guidance      | Remove `consecutive=true` to use regular deduplication. No equivalent option preserves consecutive-only behavior.                                       |
| Documentation | [Deduplicating consecutive documents](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/dedup/#example-4-deduplicating-consecutive-documents) |
