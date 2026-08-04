---
rule: rex-scan-cost
---

# Pattern extraction over a text field

## What it detects

A `rex`, `parse`, or `grok` command whose source is one bare field mapped as
`text`. Extraction over `keyword`, numeric, unknown, computed, or
alternate-source fields is not flagged.

## Why it matters

Pattern extraction reads and evaluates the text for every input row, including
rows where the pattern does not match. On a large input this can dominate the
query.

## Example

```ppl
source=logs | rex field=body "user=(?<user>\w+)"
source=logs | where service = "checkout" | rex field=body "user=(?<user>\w+)"
```

A selective filter on time or an indexed field can reduce the rows reaching the
extraction. The rule reports the text-field extraction itself; it does not try
to prove whether an earlier filter is selective.

## How to fix it

Filter rows before extraction using time or an indexed field, or extract the
value into a purpose-built indexed field during ingestion. No automatic fix is
offered because adding a filter can change the result set.

## Availability

Info severity, configured on by default, on all engine versions. It requires
selected-dataset type metadata and is source-scoped.

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                        |
| Severity           | `info`                                                                                                                           |
| Diagnostic message | Pattern extraction runs against every input row from the text field, even when it finds no match.                                |
| Fix guidance       | Filter out rows that cannot match the pattern before extraction, using time or an indexed field.                                 |
| Documentation      | [Rex sed-mode example](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/rex/#example-3-replacing-text-using-sed-mode) |

## Implementation

`rexScanCostDetector` in
`packages/osd-monaco/src/ppl/lint/rules/rex_scan_cost.ts` is registered by a
catalog entry marked `needsContext` and `sourceScoped`. The runner suppresses it
on a proven concrete mismatch between the query source and the selected
dataset. The host supplies `typeMap` only when dataset ID, data source, and
dataset type match the metadata cache; conflicting field types are omitted from
that map. The detector independently requires `typeMap`, so fields-only,
missing, stale, conflicting, or unknown type metadata produces no finding.

The `TEXT_TYPES` set contains only `text`. The `EXTRACTION_COMMANDS` table
handles three source-field forms:

- `rex` reads its source field without mistaking a nested `offset_field` option
  for the source.
- `parse` and `grok` accept the source only when exactly one bare field spans the
  complete expression. Computed and wrapped expressions, including
  `parse field=...`, are left to field validation.
- A command rule absent from the active grammar resolves to no nodes, so
  unsupported shapes stay silent. The compiled simplified grammar and captured
  3.8 runtime bundle contain all three command rules, although the bundled
  non-simplified grammar source omits `rexCommand`.

Before type lookup, the detector prunes roots returned by
`collectAlternateSourceSubtrees`; the outer dataset's `typeMap` is not valid
inside lookup, appended or bracketed pipelines, subsearches, or union datasets.
It reports the full extraction command, emits no quick fix, and never inserts a
prefilter because that could remove rows and change results.

## Assumptions and maintenance

- Adding an extraction command requires an `EXTRACTION_COMMANDS` entry and a
  source-field resolver. Add coverage on every parser surface
  where the command exists; current focused rule tests exercise the compiled
  surface only.
- If the source-field syntax for `rex`, `parse`, or `grok` changes, preserve the
  bare-field checks so options and computed expressions do not acquire the wrong
  type.
- Adding another expensive mapping type requires evidence before changing
  `TEXT_TYPES`; `keyword` is intentionally excluded.
- A new command with its own source must be added to
  `collectAlternateSourceSubtrees`. A new extraction command must also be
  classified in `COMMAND_ORDER_EFFECTS`, and field-producing behavior may need
  a `collectCreatedFields` branch so downstream field validation sees captures.
- Source mismatch suppression is intentionally proof-based: wildcard,
  pipe-first, and inconclusive sources are not treated as mismatches. Keep host
  metadata provenance checks and detector self-suppression intact when changing
  this behavior.

## Tests

- `rules/rex_scan_cost.test.ts` covers all three command resolvers, the
  `offset_field` pitfall, text/non-text/unknown fields, non-bare expressions,
  missing context, launch-default behavior, alternate-source pruning, severity,
  message text, and absence of a quick fix.
- `source_mismatch_suppression.test.ts` covers matching and mismatched selected
  dataset provenance for this source-scoped rule.
- `lint_context_builder.test.ts` covers `typeMap` and source-pattern cache
  provenance. Add runtime-bundle coverage when changing `parse` or `grok`
  grammar handling because the existing focused rule suite is compiled-only.
