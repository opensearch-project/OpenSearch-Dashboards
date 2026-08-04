---
rule: enabled-false-object
---

# Field below an object with `enabled: false`

## What it detects

A dotted field reference equal to or below an object mapped with
`enabled: false`.

## Why it matters

OpenSearch stores the original object in `_source` but does not parse or index
its children. On the verified Calcite surface, PPL returns `null` for the
reference with a successful response.

## Example

```ppl
source=logs | where session.id = "abc"
source=logs | where indexed_session_id = "abc"
```

In the first query, `session` is mapped with `enabled: false`. The second uses a
separately indexed value.

## How to fix it

Use an indexed field. To query the nested value through PPL, enable the object
mapping and reindex the data. No automatic fix is offered because there is no
equivalent reference in the current mapping.

## Availability

Warning severity, enabled by default, on Calcite engine version 3.7.0 or later.
It requires disabled-object mapping metadata and is source-scoped.
