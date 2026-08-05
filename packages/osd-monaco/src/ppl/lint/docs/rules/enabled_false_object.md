---
rule: enabled-false-object
---

# Field below an object with `enabled: false`

A dotted field reference equal to or below an object mapped with
`enabled: false`.

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

## Requirements

Requires Calcite 3.7 or later, disabled-object mapping metadata, and matching source scope.

## Rule settings

| Setting       | Current value                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                                         |
| Severity      | `warning`                                                                                                                  |
| Message       | This field is stored but not searchable, so PPL returns null for it.                                                       |
| Guidance      | Query an indexed field instead. To make this value searchable, enable indexing in the mapping and reindex the data.        |
| Documentation | [Disabling object fields](https://docs.opensearch.org/latest/mappings/mapping-parameters/enabled/#disabling-object-fields) |
