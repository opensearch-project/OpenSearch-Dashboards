---
rule: division-by-zero
---

# Division or modulo by literal zero

A `/` or `%` expression whose right operand is a numeric literal equal to zero,
including signed, decimal, and parenthesized forms.

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

## Requirements

Runs on all engine versions and needs only the query text.

## Rule settings

| Setting       | Current value                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                     |
| Severity      | `warning`                                                                                                              |
| Message       | Dividing by zero returns no value (null) instead of an error.                                                          |
| Guidance      | Use the intended divisor, or handle zero before dividing, for example `if(total = 0, 0, errors / total)`.              |
| Documentation | [Arithmetic operators](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#arithmetic-operators) |
