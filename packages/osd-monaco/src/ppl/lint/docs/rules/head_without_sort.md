---
rule: head-without-sort
---

# `head` without a stable order

## What it detects

A `head` command with no order-establishing `sort`, `top`, or `rare` command
earlier in the current pipeline. A command that invalidates ordering between
`sort` and `head` also causes the rule to fire.

## Why it matters

Without a stable order, `head` returns whichever rows arrive first. The same
query can return different rows across runs or cluster layouts.

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

## Availability

Info severity, off by default, on all engine versions. It needs only the query
text.
