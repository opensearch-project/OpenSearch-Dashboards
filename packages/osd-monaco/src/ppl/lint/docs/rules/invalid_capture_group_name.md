---
rule: invalid-capture-group-name
---

# Invalid regex capture group

For `rex` extract mode and `parse`, the rule reports:

- A Java-style named group whose name does not start with a letter or contains
  characters other than letters and numbers.
- A Python or PCRE opener in the form `(?P<name>...)`, which OpenSearch does not
  support.

`grok` and `rex mode=sed` use different pattern semantics and are not checked.

## Example

```ppl
source=logs | rex field=body "(?<user-id>\w+)"
source=logs | rex field=body "(?<userId>\w+)"
source=logs | parse body "(?P<year>\d+)"
source=logs | parse body "(?<year>\d+)"
```

The first group name contains a hyphen. The third uses a Python-style opener.

## How to fix it

Use `(?<name>...)` and start the name with a letter. A valid, unique
Python-style group gets a quick fix that removes only the `P`. Invalid Java
group names are not renamed automatically because that would silently change
the extracted field name.

## Requirements

Requires engine version 3.4 or later and needs only the query text.

## Rule settings

| Setting       | Current value                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Default       | On                                                                                                               |
| Severity      | `error`                                                                                                          |
| Message       | Invalid regex capture group name.                                                                                |
| Guidance      | Use PPL named groups in the form `(?<name>...)`. Start each name with a letter and use only letters and numbers. |
| Documentation | [Rex parameters](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/rex/#parameters)                    |
