---
rule: field-validation
---

# Invalid field reference or field-slot expression

The rule has two passes:

- A referenced field is absent from the selected dataset and is not recognized
  as a pipeline-created field.
- The source-field slot of `grok`, `parse`, or `patterns` contains an expression
  instead of one bare field, including Splunk-style `field=body` syntax.

## Example

```ppl
source=logs | where staus = "error"
source=logs | where status = "error"
source=logs | parse field=body "(?<code>\d+)"
source=logs | parse body "(?<code>\d+)"
```

The first query misspells `status`. The third uses an invalid field-slot shape.

## How to fix it

Correct the field name or define it with `eval` before use. When one known field
is close enough, the linter offers a replacement. For the unambiguous
`field=body` extraction shape, it offers a rewrite to the bare field `body`.

## Requirements

Runs on all engine versions. Field existence checks require selected-dataset
metadata; field-slot checks can run from query text. Source-scoped checks
suppress on a proven dataset mismatch.

## Rule settings

| Setting       | Current value                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                                                 |
| Severity      | `error`                                                                                                                                            |
| Message       | Reference to an unknown field.                                                                                                                     |
| Guidance      | Correct the field name or PPL syntax. PPL runs commands left to right, so define a new field with `eval` before referencing it in a later command. |
| Documentation | [Fields command parameters](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/fields/#parameters)                                        |
