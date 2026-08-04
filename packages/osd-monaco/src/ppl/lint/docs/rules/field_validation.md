---
rule: field-validation
---

# Invalid field reference or field-slot expression

## What it detects

The rule has two passes:

- A referenced field is absent from the selected dataset and is not recognized
  as a pipeline-created field.
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

## Catalog configuration

The message and fix guidance are copied verbatim from the reviewed rule catalog.

| Field              | Reviewed value                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default state      | On in the rule catalog; the global PPL lint capability still defaults off                                                                          |
| Severity           | `error`                                                                                                                                            |
| Diagnostic message | Reference to an unknown field.                                                                                                                     |
| Fix guidance       | Correct the field name or PPL syntax. PPL runs commands left to right, so define a new field with `eval` before referencing it in a later command. |
| Documentation      | [Fields command parameters](https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/fields/#parameters)                                        |

## Implementation

`fieldValidationDetector` in
`packages/osd-monaco/src/ppl/lint/rules/field_validation.ts` combines three
passes:

1. The shape pass finds `grok`, `parse`, and `patterns`, then accepts the
   source-field argument only when one bare field spans the complete expression.
   On the runtime parser it reads the tree. On the compiled fallback, where
   `field=body` error-recovers poorly, it scans `context.sourceText` with
   `findCompiledFieldSlotShapeMatches`.
2. The existence pass walks field references. A reference is known when either
   `context.fields` or `buildPipelineShape(...).createdFields` contains its
   normalized path. It excludes source/table/join contexts, declared join-side
   aliases, and hard-pruned alternate-source subtrees.
3. Overlap suppression removes an unknown-field diagnostic contained by a
   shape diagnostic, so one malformed slot produces one finding.

The context builder derives `fields` from the selected index pattern and carries
it only when the cached dataset ID, data source ID, and dataset type still match.
The catalog marks the rule `sourceScoped`; `runLint` suppresses it only when one
non-wildcard top-level source is proven different from
`selectedSourcePattern`. Missing metadata suppresses only the existence pass.

Unknown-field ranges cover the field reference; a close match adds an in-place
replacement. The edit-distance threshold is `max(2, floor(name.length / 3))`.
Shape ranges cover the source-slot expression. Only one `=` or `==` whose
right-hand side is one bare field gets the `field=value` to `value` fix.
Ambiguous expressions have no fix.

## Assumptions and maintenance

- Keep `SHAPE_DOC_URL`, `SHAPE_COMMAND_KEYWORD`, the shape-pass command loop, and
  `field_slot_shape_text.ts`'s `COMMANDS` map synchronized. If another
  extraction command accepts `source_field = expression`, update all four
  surfaces and the grammar census guard.
- Every new PPL command must be classified in `COMMAND_ORDER_EFFECTS` in
  `pipeline_shape.ts`; otherwise `buildPipelineShape` does not see the stage or
  its created fields. Add bespoke created-field handling when output names are
  not represented by generic `AS` or an `evalClause` left-hand side.
- Created-field handling is hardcoded for `grok`/`parse`/`rex` captures,
  `patterns` (`NEW_FIELD`, `patterns_field`, and `tokens`), `spath`
  (`OUTPUT` or `indexablePath`), and `addtotals`/`addcoltotals`
  (`FIELDNAME`, default `Total`). Reverify these defaults and field extraction
  when command or engine behavior changes.
- `collectAlternateSourceSubtrees` prunes `lookup`, an `append` containing
  `search`, `appendcol`, `appendpipe`, `foreach`, bracketed subsearches, and
  union dataset branches. Add new nested-source commands there. `graphlookup`
  is intentionally not pruned because its `AS` name is an outer output field.
- Created fields are currently accumulated for the whole outer pipeline, not by
  stage. A reference before a later `eval` or alias definition is therefore
  treated as known. Whole-command pruning can also omit outer outputs from
  commands such as `lookup`; both behaviors need explicit review when command
  semantics change.
- Dotted references are accepted when either the full path or its leading
  segment is known. This avoids false positives for object children but can
  hide an unknown child beneath a known object. Unbalanced paths, absent fields,
  and detector exceptions produce no finding rather than a speculative
  diagnostic.
- Source scoping fails open for pipe-first, wildcard, multi-source, or otherwise
  inconclusive queries. Alternate-source pruning is therefore the separate
  protection for nested sources and must stay current.

## Tests

- `packages/osd-monaco/src/ppl/lint/__tests__/analyzer_lint.test.ts`: compiled
  shape fallback, fixes/ranges, overlap suppression, and field metadata.
- `packages/osd-monaco/src/ppl/lint/__tests__/field_slot_shape.test.ts` and
  `field_slot_shape_text.test.ts`: runtime-tree and compiled-text predicates.
- `packages/osd-monaco/src/ppl/lint/__tests__/field_slot_grammar_guard.test.ts`:
  hardcoded field-slot command census.
- `packages/osd-monaco/src/ppl/lint/__tests__/field_validation_alt_source.test.ts`:
  join aliases, alternate sources, normalization, and created fields.
- `packages/osd-monaco/src/ppl/lint/__tests__/pattern_fields.test.ts`: capture
  names registered by extraction commands.
- `packages/osd-monaco/src/ppl/lint/__tests__/source_mismatch_suppression.test.ts`:
  selected-source gating and inconclusive-source behavior.
- `src/plugins/data/public/antlr/opensearch_ppl/command_census.test.ts` and
  `command_order_effects.test.ts`: new-command classification and output fields.
