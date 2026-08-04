---
rule: multisearch-min-subsearch
---

# `multisearch` requires two subsearches

## What it detects

A `multisearch` command containing fewer than two bracketed subsearches.

## Why it matters

`multisearch` merges independent search results. The engine rejects the command
when there is only one result set to merge.

## Example

```ppl
| multisearch [search source=logs-a]
| multisearch [search source=logs-a] [search source=logs-b]
```

The first query has one subsearch. The second satisfies the minimum.

## How to fix it

Add another bracketed subsearch, or run the single subsearch as a normal PPL
query.

## Availability

Error severity, enabled by default, on engine version 3.4.0 or later. This is a
runtime grammar rule, so it fires only after a compatible grammar bundle is
loaded for the active data source.
