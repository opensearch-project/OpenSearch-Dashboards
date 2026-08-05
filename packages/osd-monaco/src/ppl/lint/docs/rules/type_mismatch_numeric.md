---
rule: type-mismatch-numeric
---

# Numeric field compared with nonnumeric text

An `=` or `==` comparison between one bare numeric field and a quoted string
that cannot be converted to a number. Either operand order is recognized.
Other comparison operators and computed field expressions are not flagged.

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

## Requirements

Requires Calcite 3.7 or later, selected-dataset type metadata, and matching source scope.

## Rule settings

| Setting       | Current value                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                               |
| Severity      | `warning`                                                                                                                        |
| Message       | This field is numeric, but the compared value is not a number, so the comparison returns no rows.                                |
| Guidance      | Compare the field with a number, such as `500`, or use the text field that contains the value you want.                          |
| Documentation | [Basic predicate operators](https://docs.opensearch.org/latest/sql-and-ppl/ppl/functions/expressions/#basic-predicate-operators) |
