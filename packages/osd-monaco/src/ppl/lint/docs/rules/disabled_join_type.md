---
rule: disabled-join-type
---

# Join type disabled by the cluster

A `right`, `full`, or `cross` join while the cluster setting
`plugins.calcite.all_join_types.allowed` is not known to be enabled.

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

## Requirements

Runs on all engine versions and self-suppresses when the host reports that all join types are allowed.

## Rule settings

| Setting       | Current value                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | Off                                                                                                                                                      |
| Severity      | `warning`                                                                                                                                                |
| Message       | This join type is disabled by default.                                                                                                                   |
| Guidance      | Use an `inner` or `left` join when it preserves the intended result. Otherwise, ask an administrator to enable `plugins.calcite.all_join_types.allowed`. |
| Documentation | [Join limitations](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/join/#limitations)                                                        |
