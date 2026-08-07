---
rule: head-without-sort
---

# `head` without a stable order

A `head` command with no order-establishing `sort`, `top`, or `rare` command
earlier in the current pipeline. A command that invalidates ordering between
`sort` and `head` also causes the rule to fire.

## Example

```ppl
source=logs | head 10
source=logs | sort - @timestamp | head 10
```

The first query has no defined ordering. The second consistently returns the
ten newest rows.

## How to fix it

Add a `sort` before `head` when the selected rows must be stable. No automatic
fix is offered because the linter cannot infer the correct sort field or
direction.

## Requirements

Runs on all engine versions and needs only the query text.

## Rule settings

| Setting       | Current value                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | Off                                                                                                                                                                              |
| Severity      | `info`                                                                                                                                                                           |
| Message       | Without sort, head can return different rows each time the query runs.                                                                                                           |
| Guidance      | Add `sort` before `head` when you need stable top or bottom results.                                                                                                             |
| Documentation | [Head command: retrieving results after an offset](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/head/#example-3-retrieving-the-first-n-results-after-an-offset-m) |
