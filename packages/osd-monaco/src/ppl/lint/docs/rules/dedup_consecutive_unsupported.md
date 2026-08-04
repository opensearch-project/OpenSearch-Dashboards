---
rule: dedup-consecutive-unsupported
---

# Consecutive deduplication falls back from Calcite

## What it detects

A `dedup` command with `consecutive=true` on a Calcite data source.

## Why it matters

Calcite does not implement consecutive-only deduplication. The query falls back
to the legacy engine, which can be slower and can change which engine executes
other commands in the same pipeline.

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

## Availability

Warning severity, off by default, on Calcite engine version 3.3.0 or later. It
needs only the query text and the positive Calcite signal.
