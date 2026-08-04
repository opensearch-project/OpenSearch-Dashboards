---
rule: disabled-join-type
---

# Join type disabled by the cluster

## What it detects

A `right`, `full`, or `cross` join while the cluster setting
`plugins.calcite.all_join_types.allowed` is not known to be enabled.

## Why it matters

These high-cost join types are disabled by default. The query fails at
execution time unless an administrator explicitly allows them.

## Example

```ppl
source=a | join type=cross b on a.id=b.id
source=a | join type=inner b on a.id=b.id
```

The first query requires the cluster opt-in. The second uses a default-enabled
join type.

## How to fix it

Use an `inner` or `left` join when it preserves the intended result. Otherwise,
ask an administrator to enable all join types after evaluating the cost.

## Availability

Warning severity, off by default, on all engine versions. The rule
self-suppresses when the host reports that all join types are allowed.
