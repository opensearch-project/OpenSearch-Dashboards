---
rule: operation-pushed-as-script
---

# Operation pushed down as a script

An `_explain` plan showing that a filter or sort reached OpenSearch as a
per-document script instead of a native query or field sort.

## Example

```ppl
source=accounts | where age - 2 > 30
source=accounts | where age > 32
```

Arithmetic on the field side can be pushed as a script. The actual finding is
based on the returned plan, not query shape alone.

## How to fix it

Compare an indexed field directly or sort by an existing indexed field. For a
narrow additive comparison over a bounded integer mapping, the linter can offer
an exact inversion. The fix is withheld unless plan attribution and type checks
prove it safe.

## Requirements

Requires Calcite 3.3 or later, a known data-source version, HTTP access to
`_explain`, and a clean parse. Fast mode omits ambiguous findings; thorough
mode can issue isolation probes.

## Rule settings

| Setting       | Current value                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Default       | Off                                                                                                                 |
| Severity      | `info`                                                                                                              |
| Message       | OpenSearch evaluates this operation as a script for every candidate document instead of using a native index query. |
| Guidance      | Use a direct field comparison or sort on an indexed field so OpenSearch can use a native query or field sort.       |
| Documentation | [SQL and PPL performance limitations](https://docs.opensearch.org/latest/sql-and-ppl/limitation/#performance)       |
