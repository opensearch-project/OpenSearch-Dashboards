---
rule: replace-wildcard-asymmetry
---

# Mismatched wildcard captures in `replace`

## What it detects

A `replace` pair whose replacement contains a nonzero number of unescaped `*`
wildcards that differs from the pattern's wildcard count. A fixed replacement
with no wildcard is allowed.

## Why it matters

Each wildcard in the replacement refers to a wildcard capture from the pattern.
The engine rejects a replacement that requests a different number of captures.

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

## Availability

Error severity, enabled by default, on Calcite engine version 3.4.0 or later.
This is a runtime grammar rule, so it also requires a compatible grammar bundle
for the active data source.
