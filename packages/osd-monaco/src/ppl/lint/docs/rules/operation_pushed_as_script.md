---
rule: operation-pushed-as-script
---

# Operation pushed down as a script

## What it detects

An `_explain` plan showing that a filter or sort reached OpenSearch as a
per-document script instead of a native query or field sort.

## Why it matters

Script evaluation performs calculations for every candidate document. A native
range query or field sort can use index structures and is usually cheaper.

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

## Availability

Info severity, off by default, on Calcite engine version 3.3.0 or later. It
requires a known data-source version, HTTP access to `_explain`, and a clean
parse. Fast mode omits ambiguous findings; thorough mode can issue isolation
probes.
