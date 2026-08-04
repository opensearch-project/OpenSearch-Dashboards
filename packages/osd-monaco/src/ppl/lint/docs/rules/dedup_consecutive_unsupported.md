---
rule: dedup-consecutive-unsupported
---

# Consecutive deduplication falls back from Calcite

## What it detects

A `dedup` command with `consecutive=true` on a Calcite data source.

## Why it matters

Calcite does not implement consecutive-only deduplication. The query falls back
to the legacy engine, which can be slower and can change which engine executes
other commands in the same pipeline.

## Example

```ppl
source=logs | dedup 1 status consecutive=true
source=logs | dedup 1 status
```

The first query requires fallback. The second uses normal deduplication on
Calcite.

## How to fix it

Remove `consecutive=true` when normal deduplication is acceptable. There is no
equivalent rewrite that preserves consecutive-only behavior.

## Availability

Warning severity, configured off by default, on Calcite engine version 3.3.0 or
later. Users can opt in through the per-rule Advanced Setting. It needs only the
query text and the positive Calcite signal.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | Off; per-rule opt-in and the global PPL lint capability are required                                                                                    |
| Severity           | `warning`                                                                                                                                               |
| Diagnostic message | consecutive=true uses an older query engine and may make this query slower.                                                                             |
| Fix guidance       | Remove `consecutive=true` to use regular deduplication. No equivalent option preserves consecutive-only behavior.                                       |
| Documentation      | [Deduplicating consecutive documents](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/dedup/#example-4-deduplicating-consecutive-documents) |

## Implementation

`dedupConsecutiveUnsupportedDetector` in
`packages/osd-monaco/src/ppl/lint/rules/dedup_consecutive_unsupported.ts` finds
each `dedup` and scans its flattened, lowercased token text with
`/consecutive=(true|false)/`. It emits one diagnostic for the complete command
when the first matched value is `true`; plain `dedup` and
`consecutive=false` are ignored. No quick fix is attached.

The catalog gates the rule with `minVersion: 3.3.0` and `engine: calcite`. The
detector independently requires `context.isCalcite === true` so direct detector
calls cannot bypass the engine gate. Unknown, false, or unmeasured engine state
therefore suppresses the rule. Because this is warning severity, an unknown
version does not suppress it once Calcite is positively known; a known version
below 3.3 does.

The host only derives a positive Calcite signal from measured cluster settings.
A failed or unmeasured settings request leaves `isCalcite` undefined, keeping
this rule quiet.

## Assumptions and maintenance

- Detection depends on the flattened spelling `consecutive=true|false`. Update
  the regex if the option gains another separator, value syntax, or alias.
- The regex reads only the first `consecutive` occurrence. If the grammar ever
  permits repeated options, align detection with the engine's precedence rule.
- The warning assumes Calcite throws `CalciteUnsupportedException`, the fallback
  catches it unconditionally, and the legacy v2 `DedupeOperator` supports the
  option. Revalidate the rule, severity, and 3.3 floor if fallback behavior
  changes.
- Keep the detector-level positive-engine check in sync with the catalog gate.
  It is deliberate defense for tests and other callers that invoke the detector
  directly.

## Tests

`rules/__tests__/dedup_consecutive_unsupported.test.ts` covers
`consecutive=true`, `consecutive=false`, plain `dedup`, catalog message wiring,
and suppression without a positive Calcite context.

`__tests__/version_filter.test.ts` covers Calcite's positive-signal requirement,
known and unknown versions, and severity-independent gate behavior. If the
option syntax changes, add runtime-grammar coverage as well; the focused rule
test currently exercises only the compiled surface.
