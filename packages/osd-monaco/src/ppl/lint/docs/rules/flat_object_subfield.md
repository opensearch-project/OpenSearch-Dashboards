---
rule: flat-object-subfield
---

# `flat_object` field referenced from PPL

## What it detects

A reference to a field whose longest known mapping prefix is `flat_object`,
including the flat-object root itself and dotted paths below it.

## Why it matters

On the verified Calcite surface, PPL cannot resolve a `flat_object` root or
subfield. The query fails with a field-not-found error.

## Example

```ppl
source=logs | where attributes.region = "us-east-1"
source=logs | where region = "us-east-1"
```

In the first query, `attributes` is mapped as `flat_object`. The second uses a
separately indexed field.

## How to fix it

Use another indexed field, query the value through DQL or the Search API, or
map and reindex the data as a regular object. No automatic fix is offered
because PPL has no equivalent reference for the existing mapping.

## Availability

Error severity, off by default, on Calcite engine version 3.8.0 or later. It
requires selected-dataset type metadata and is source-scoped.
