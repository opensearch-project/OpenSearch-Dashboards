---
rule: type-mismatch-numeric
---

# Numeric field compared with nonnumeric text

## What it detects

An `=` or `==` comparison between one bare numeric field and a quoted string
that cannot be converted to a number. Either operand order is recognized.
Other comparison operators and computed field expressions are not flagged.

## Why it matters

On the verified Calcite surface, the comparison returns no rows instead of an
error. A user can mistake a type mismatch for the absence of matching data.

## Example

```ppl
source=accounts | where age = "thirty"
source=accounts | where age = 30
```

The first value cannot be converted to the numeric mapping of `age`.

## How to fix it

Compare the field with a number, or use the text field that contains the value
you intend to match. No automatic fix is offered because the intended value is
unknown.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires selected-dataset type metadata and is source-scoped.
