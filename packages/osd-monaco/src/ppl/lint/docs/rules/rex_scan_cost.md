---
rule: rex-scan-cost
---

# Pattern extraction over a text field

A `rex`, `parse`, or `grok` command whose source is one bare field mapped as
`text`. Extraction over `keyword`, numeric, unknown, computed, or
alternate-source fields is not flagged.

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

## Requirements

Runs on all engine versions and requires selected-dataset type metadata with matching source scope.

## Rule settings

| Setting       | Current value                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                               |
| Severity      | `info`                                                                                                                           |
| Message       | Pattern extraction runs against every input row from the text field, even when it finds no match.                                |
| Guidance      | Filter out rows that cannot match the pattern before extraction, using time or an indexed field.                                 |
| Documentation | [Rex sed-mode example](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/rex/#example-3-replacing-text-using-sed-mode) |
