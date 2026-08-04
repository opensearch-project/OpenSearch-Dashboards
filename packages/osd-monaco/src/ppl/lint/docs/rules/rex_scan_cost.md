---
rule: rex-scan-cost
---

# Pattern extraction over a text field

## What it detects

A `rex`, `parse`, or `grok` command whose source is one bare field mapped as
`text`. Extraction over `keyword`, numeric, unknown, computed, or
alternate-source fields is not flagged.

## Why it matters

Pattern extraction reads and evaluates the text for every input row, including
rows where the pattern does not match. On a large input this can dominate the
query.

## Example

```ppl
source=logs | rex field=body "user=(?<user>\w+)"
source=logs | where service = "checkout" | rex field=body "user=(?<user>\w+)"
```

A selective filter on time or an indexed field can reduce the rows reaching the
extraction. The rule reports the text-field extraction itself; it does not try
to prove whether an earlier filter is selective.

## How to fix it

Filter rows before extraction using time or an indexed field, or extract the
value into a purpose-built indexed field during ingestion. No automatic fix is
offered because adding a filter can change the result set.

## Availability

Info severity, enabled by default, on all engine versions. It requires
selected-dataset type metadata and is source-scoped.
