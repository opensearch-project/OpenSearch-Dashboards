---
rule: wildcard-source-zero-match
---

# Wildcard source matches no visible index

## What it detects

A simple local wildcard in the top-level `source=` clause that matches none of
the visible index names. Complex multi-target, exclusion, date-math,
cross-cluster, and hidden-index forms are left alone because the local index
inventory cannot reproduce their semantics exactly.

## Why it matters

The query is valid and returns no rows. That can look like an empty dataset when
the actual problem is a typo in the index pattern.

## Example

```ppl
source=lgos-*
source=logs-*
```

If visible indexes include `logs-2026.08.04`, the first pattern matches none
and the second matches one.

## How to fix it

Correct the wildcard pattern or select an existing index.

## Availability

Info severity, enabled by default, on all engine versions. It requires visible
index metadata for the active data source and self-suppresses when that
inventory is absent or empty.
