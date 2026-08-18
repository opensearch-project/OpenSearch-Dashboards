---
rule: multisearch-min-subsearch
---

# `multisearch` requires two subsearches

A `multisearch` command containing fewer than two bracketed subsearches.

## Example

```ppl
| multisearch [search source=logs-a]
| multisearch [search source=logs-a] [search source=logs-b]
```

The first query has one subsearch. The second satisfies the minimum.

## How to fix it

Add another bracketed subsearch, or run the single subsearch as a normal PPL
query.

## Requirements

Requires engine version 3.4 or later and a compatible runtime grammar for the active data source.

## Rule settings

| Setting       | Current value                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                    |
| Severity      | `error`                                                                                               |
| Message       | The multisearch command requires at least two subsearches.                                            |
| Guidance      | Add a second subsearch, or run the single subsearch as a normal query.                                |
| Documentation | [Multisearch syntax](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/multisearch/#syntax) |
