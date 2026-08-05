---
rule: flat-object-subfield
---

# `flat_object` field referenced from PPL

A reference to a field whose longest known mapping prefix is `flat_object`,
including the flat-object root itself and dotted paths below it.

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

## Requirements

Requires Calcite 3.8 or later, selected-dataset type metadata, and matching source scope.

## Rule settings

| Setting       | Current value                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Default       | Off                                                                                                                              |
| Severity      | `error`                                                                                                                          |
| Message       | PPL cannot search a field stored inside a flat_object field.                                                                     |
| Guidance      | Use another field or query this data with DQL or the Search API. To use it in PPL, map and reindex it as a regular object field. |
| Documentation | [`flat_object` field type](https://docs.opensearch.org/latest/field-types/supported-field-types/flat-object/)                    |
