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
only the query text. Like every PPL lint rule, it runs only when the global
`queryEnhancements.ppl.lint.enabled` feature is enabled; that feature defaults
to off.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                        |
| Severity           | `error`                                                                                                          |
| Diagnostic message | Invalid regex capture group name.                                                                                |
| Fix guidance       | Use PPL named groups in the form `(?<name>...)`. Start each name with a letter and use only letters and numbers. |
| Documentation      | [Rex parameters](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/rex/#parameters)                    |

## Implementation

`packages/osd-monaco/src/ppl/lint/rules/invalid_capture_group_name.ts` registers
`invalidCaptureGroupNameDetector`, which inspects `rex` and `parse`. It excludes
`rex mode=sed`; `grok` is excluded because it uses a different pattern
dialect. `findPatternLiteral` locates the pattern argument for each supported
command form.

The detector scans the raw quoted literal with `CAPTURE_GROUP_OPENER`, then
validates each captured name with `VALID_GROUP_NAME`. A Java opener with an
invalid name produces one diagnostic. A Python/PCRE opener always produces a
diagnostic, combining the syntax and name errors when both are invalid.

## Assumptions and maintenance

- `VALID_GROUP_NAME` is hardcoded to
  `/^[A-Za-z][A-Za-z0-9]*$/`, matching
  `RegexCommonUtils.isValidJavaRegexGroupName`. `CAPTURE_GROUP_OPENER` mirrors
  the engine's lexerless `ANY_NAMED_GROUP_PATTERN`; it intentionally also sees
  openers in escaped text, character classes, `\Q...\E`, and lookbehind text.
  If the engine validator changes, update both expressions, the catalog's
  `minVersion`, and the engine-agreement cases.
- Only `rex` extract mode and `parse` use this validator. When another command or
  mode starts using it, add coverage only after checking its regex dialect and
  locating its actual pattern argument. Do not include `grok` or sed
  substitution syntax without a corresponding engine change.
- The only quick fix removes the single `P` from a valid, case-sensitively
  unique `(?P<name>` opener. It is withheld if the name is invalid, converting
  it would duplicate another group, or no token-accurate edit range is
  available. Invalid Java names are never auto-renamed because that changes the
  output field.
- The bundled catalog and `query:enhancements:pplLint:rules` default this rule
  on, but the global lint capability defaults off. Because this is an
  error-severity rule with a `3.4.0` floor, an unknown or unparseable data-source
  version suppresses it.
- This rule is not `runtimeOnly`: it runs against either the runtime parser or
  the compiled-worker fallback. Keep pattern extraction compatible with both.
  `query:enhancements:runtimePplGrammar` controls that parser choice
  independently of the global lint feature.

## Tests

Focused coverage is in
`lint/rules/__tests__/invalid_capture_group_name.test.ts`. Keep cases for both
commands, extract/sed/grok dialect boundaries, the engine's lexerless edge
cases, exact diagnostic and pipe-first fix ranges, duplicate-name fix
suppression, fix round trips, and pre-3.4/unknown-version gating. Catalog,
version-filter, marker/fix-registry, and code-action tests cover the shared
configuration and delivery paths when those contracts change.
