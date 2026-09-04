---
rule: replace-wildcard-asymmetry
---

# Mismatched wildcard captures in `replace`

A `replace` pair whose replacement contains a nonzero number of unescaped `*`
wildcards that differs from the pattern's wildcard count. A fixed replacement
with no wildcard is allowed.

## Example

```ppl
source=logs | replace "*-*" WITH "*" IN host
source=logs | replace "*-*" WITH "*:*" IN host
```

The first pair has two pattern wildcards and one replacement wildcard. The
second has two on each side.

## How to fix it

Use the same number of unescaped `*` wildcards in the pattern and replacement,
or remove all replacement wildcards when a fixed value is intended.

## Requirements

Requires Calcite 3.4 or later and a compatible runtime grammar for the active data source.

## Rule settings

| Setting       | Current value                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                    |
| Severity      | `error`                                                                                               |
| Message       | The replace match and replacement have different numbers of "*" wildcards. The counts must match.     |
| Guidance      | Use the same number of `*` wildcards in the match and replacement patterns.                           |
| Documentation | [Replace parameters](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/replace/#parameters) |
