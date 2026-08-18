# PPL lint contract

This document records the stable behavior shared by rule authors, lint hosts,
the runtime grammar bridge, and editor integrations. The source TypeScript in
[`diagnostic.ts`](diagnostic.ts), [`types.ts`](types.ts), and
[`../lint_bridge.ts`](../lint_bridge.ts) remains authoritative.

## Rule identity

A rule ID identifies the catalog entry, Advanced Settings override, Monaco
marker, and telemetry dimension. Treat it as a compatibility key. Changing an
ID requires a migration for persisted settings and consumers of historical
telemetry.

The bundled catalog owns default state, severity, user-facing message, fix
guidance, documentation URL, applicability, and behavior flags. Detectors
consume those values rather than defining their own copies.

## Diagnostics and ranges

A diagnostic identifies its rule, severity, message, source range, and
optional documentation link or deterministic fix.

Diagnostic lines are 1-based, columns are 0-based, and the end position is
exclusive. Monaco conversion happens only at the editor boundary. Pipe-first
parsing may add a synthetic source internally, but diagnostics and fixes refer
to the text the user entered.

Explain attribution may carry internal targeting data while a diagnostic is
being resolved. Editor integrations must not render or persist that data as
user-facing metadata.

## Deterministic fixes

A deterministic fix contains a title, replacement text, and an optional range.
When the range is omitted, the diagnostic range is replaced.

Offer a deterministic fix only when the rewrite is unambiguous,
result-preserving, and does not immediately reproduce the same diagnostic.
Any source text used to derive the edit must still match before an asynchronous
explain probe relies on it.

## Detectors and context

Static detectors are synchronous and isolated. A detector that cannot prove a
finding returns no diagnostics. A detector failure must not prevent other rules
from running.

Grammar navigation uses rule-name lookups and must tolerate a missing rule.
Rules that depend on dataset metadata, engine state, version, runtime grammar,
or an explain plan self-suppress when that evidence is unavailable.

Dataset metadata is valid only for the dataset and data source that produced
it. Source-scoped rules suppress findings on a proven source mismatch and avoid
applying outer-source metadata inside alternate-source subqueries.

## Runtime bridge

The runtime bridge receives editor content and host context. Returning `null`
or throwing asks the language layer to use the compiled grammar worker.
Returning a lint result, including an empty result, is authoritative for that
pass.

Context sent to the worker must be structured-clone safe. New worker-visible
context requires matching payload, serialization, hydration, host construction,
and lifecycle updates.

## Advanced Settings

The current persisted setting contains an explain attribution mode and a list
of rule overrides. A rule override identifies the rule and can change its
enabled state or severity.

The legacy top-level rules array remains accepted. Removing that shape requires
a saved-value migration. Unknown IDs may be ignored during execution, but they
must not be reused for a different rule while old settings or telemetry can
still contain them.

`command-suggestion` belongs to the syntax channel. It shares the persisted
rule list but is not a catalog diagnostic and has no configurable lint
severity.
