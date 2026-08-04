---
rule: division-by-zero
---

# Division or modulo by literal zero

## What it detects

A `/` or `%` expression whose right operand is a numeric literal equal to zero,
including signed, decimal, and parenthesized forms.

## Why it matters

PPL evaluates division and modulo by zero to `null` instead of returning an
error. Filters and aggregations can then skip the affected value while the
query appears to have succeeded.

## Example

```ppl
source=logs | eval error_rate = errors / 0
source=logs | eval error_rate = if(total = 0, 0, errors / total)
```

The first expression always produces `null`. The second handles a zero total
explicitly.

## How to fix it

Use the intended divisor, or guard a divisor that can legitimately be zero.
No automatic fix is offered because the correct fallback value is
domain-specific.

## Availability

Warning severity, enabled by default, on all engine versions. It needs only the
query text.
