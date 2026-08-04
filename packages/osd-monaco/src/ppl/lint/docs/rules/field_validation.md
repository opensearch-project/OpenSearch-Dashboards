---
rule: field-validation
---

# Invalid field reference or field-slot expression

## What it detects

The rule has two passes:

- A referenced field is absent from the selected dataset and was not created by
  an earlier pipeline stage.
- The source-field slot of `grok`, `parse`, or `patterns` contains an expression
  instead of one bare field, including Splunk-style `field=body` syntax.

## Why it matters

An unknown field can fail or silently match no rows. A non-field expression in
an extraction command's source slot parses in some grammar surfaces but is
rejected by the engine.

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

## Availability

Error severity, enabled by default, on all engine versions. Field existence
checks require selected-dataset field metadata and self-suppress without it;
field-slot shape checks can still run from query text. Source-scoped checks are
suppressed on a proven dataset mismatch.
