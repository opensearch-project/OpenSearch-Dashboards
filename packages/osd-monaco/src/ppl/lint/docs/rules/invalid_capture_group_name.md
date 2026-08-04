---
rule: invalid-capture-group-name
---

# Invalid regex capture group

## What it detects

For `rex` extract mode and `parse`, the rule reports:

- A Java-style named group whose name does not start with a letter or contains
  characters other than letters and numbers.
- A Python or PCRE opener in the form `(?P<name>...)`, which OpenSearch does not
  support.

`grok` and `rex mode=sed` use different pattern semantics and are not checked.

## Why it matters

OpenSearch validates named-group syntax before running the extraction. An
invalid name or Python-style opener fails the query at execution time.

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

## Availability

Error severity, enabled by default, on engine version 3.4.0 or later. It needs
only the query text.
