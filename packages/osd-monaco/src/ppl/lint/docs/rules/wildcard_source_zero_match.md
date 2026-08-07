---
rule: wildcard-source-zero-match
---

# Wildcard source matches no visible index

A simple local wildcard in the top-level `source=` clause that matches none of
the visible index names. Complex multi-target, exclusion, date-math,
cross-cluster, and hidden-index forms are left alone because the local index
inventory cannot reproduce their semantics exactly.

## Example

```ppl
source=lgos-*
source=logs-*
```

If visible indexes include `logs-2026.08.04`, the first pattern matches none
and the second matches one.

## How to fix it

Correct the wildcard pattern or select an existing index.

## Requirements

Runs on all engine versions and requires visible-index metadata for the active data source.

## Rule settings

| Setting       | Current value                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                               |
| Severity      | `warning`                                                                                                                        |
| Message       | Wildcard source pattern matches no known index.                                                                                  |
| Guidance      | Correct the `source=` pattern or choose an existing index.                                                                       |
| Documentation | [Search command wildcard example](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/search/#example-6-using-wildcards) |
