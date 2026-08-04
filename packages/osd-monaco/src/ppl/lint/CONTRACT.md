# PPL lint contract v1.0

This document defines the interfaces shared by rule authors, lint hosts, the
runtime grammar bridge, and editor integrations. Additive optional fields are
compatible within v1. Removing a field, changing coordinate conventions, or
changing the meaning of an existing field requires a contract revision.

The source TypeScript remains authoritative.

## Diagnostic result

```ts
type LintSeverity = 'error' | 'warning' | 'info';

interface LintResult {
  diagnostics: Diagnostic[];
}

interface Diagnostic {
  ruleId: string;
  severity: LintSeverity;
  message: string;
  range: DiagnosticRange;
  docUrl?: string;
  fix?: DiagnosticFix;
  attribution?: DiagnosticAttribution;
  explainTarget?: ExplainTarget;
}
```

`ruleId` identifies the catalog entry and Advanced Settings entry. `message`
describes this occurrence; it can be more specific than the catalog fallback.
`docUrl` becomes the marker code target when present.

`attribution` and `explainTarget` are internal handoff fields for the explain
pipeline. Editor integrations must not render or persist them as user-facing
metadata.

## Ranges

```ts
interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

Lines are 1-based. Columns are 0-based. The end column is exclusive.
`diagnostic_to_marker.ts` owns conversion to Monaco's 1-based columns.

Ranges refer to the user's editor text. Pipe-first parsing can prepend a
synthetic source internally, but `remapPipeFirstColumns` removes that prefix
from diagnostic and explicit fix ranges before they leave the analyzer.

## Deterministic fixes

```ts
interface DiagnosticFix {
  title: string;
  text: string;
  range?: DiagnosticRange;
  expectedText?: string;
}
```

When `range` is absent, the fix replaces the diagnostic range. `expectedText`
records the source slice from which a rewrite was derived. The explain
attribution layer checks it before generating causal probes. The ordinary
Monaco code-action path does not currently recheck it at click time, so it is
not a universal stale-edit guard. A fix is allowed only when the rewrite is
unambiguous, result-preserving, and does not reproduce the same diagnostic.

Monaco marker objects do not preserve custom fields. The language layer stores
fixes in `fix_registry.ts` before publishing markers, and the code-action
provider rejoins them by marker identity.

## Tree detector

```ts
type Detector = (
  tree: ParserRuleContext,
  config: CatalogEntry,
  context: LintRunContext,
  ruleNameToIndex: RuleNameToIndex
) => Diagnostic[];
```

Detectors are synchronous and isolated. A detector that cannot prove a finding
returns an empty array. `runLint` catches an individual detector failure so one
rule cannot break other diagnostics.

`RuleNameToIndex` returns `-1` when a grammar surface lacks a rule. Tree
navigation must use the duck-typed helpers in `rule_index.ts`; JavaScript class
identity is not stable across worker bundles.

## Catalog entry

```ts
interface CatalogEntry {
  id: string;
  detector: string;
  enabled: boolean;
  severity: LintSeverity;
  message: string;
  howToFix: string;
  docUrl: string;
  appliesTo: {
    minVersion?: string;
    maxVersion?: string;
    engine?: 'calcite';
  };
  runtimeOnly?: boolean;
  needsContext?: boolean;
  needsExplain?: boolean;
  aiFixable?: boolean;
  sourceScoped?: boolean;
}
```

The repository-bundled catalog owns presentation metadata. Runtime and headless
overrides can change execution fields, but the editor hover reads its message
guidance from the local catalog rather than trusting remote presentation text.

## Lint context

```ts
interface LintRunContext {
  isCalcite?: boolean;
  fields?: Set<string>;
  typeMap?: Map<string, string>;
  disabledObjectFields?: Set<string>;
  visibleIndices?: string[];
  settings?: { allJoinTypesAllowed?: boolean };
  overrides?: BundleRuleOverrides;
  selectedSourcePattern?: string;
  engineType?: string;
  commandSuggestionEnabled?: boolean;
  explainMode?: 'fast' | 'thorough';
  dataSourceId?: string;
  dataSourceVersion?: string;
  sourceText?: string;
  grammarSurface?: 'compiled-simplified' | 'runtime-bundle';
  grammarHash?: string;
  isPipeFirst?: boolean;
}
```

All fields are optional so the compiled fallback and headless consumers can
provide only what they know. Rules that need a field must self-suppress when it
is absent or empty.

The runner's `needsContext` gate considers only nonempty `fields`, `typeMap`, or
`visibleIndices`. It does not prove that `disabledObjectFields`, settings, or a
specific collection is available. Detectors remain responsible for checking
their exact dependencies.

`fields`, `typeMap`, and `disabledObjectFields` describe the selected dataset.
A rule that consumes them should normally set `sourceScoped`, causing the
runner to suppress it on a proven top-level source mismatch.

`visibleIndices` is data-source-wide inventory rather than selected-dataset
metadata. A rule that only consumes that list should not be source-scoped.

Source mismatch suppression is intentionally conservative. It suppresses only
a proven conflict with one explicit top-level source; absent, wildcard,
multi-source, pipe-first, and ambiguous classifications do not suppress.

## Worker serialization

`SerializableLintContext` is the structured-clone-safe worker form:

- `Set<string>` becomes `string[]`.
- `Map<string, string>` becomes `Record<string, string>`.
- Function-bearing objects such as the HTTP client are omitted.

The worker restores sets and maps before calling the same `runLint` engine used
by the runtime grammar path.

Host-supplied fields must start in `LintPayloadContext`, which is also the host
side of `PPLLintContext`. Adding a worker-visible field is an additive contract
change only when the field is also added to `SerializableLintContext`,
main-thread serialization, and worker hydration. `LintRunContext` is for
analyzer-derived values such as source text and grammar surface, not a host
extension boundary.

## Bridge behavior

A `PPLLintBridge` receives editor content, model identity, and the full host
context. Returning `null` asks `resolvePPLLintResult` to use the compiled worker
fallback. Throwing also falls back. Returning a `LintResult`, including an
empty result, is authoritative for that pass.

Runtime grammar linting stamps `grammarSurface: 'runtime-bundle'`. The compiled
analyzer stamps `compiled-simplified`. The surface value is the gate for
`runtimeOnly` entries.

## Advanced Settings

The current persisted shape is:

```json
{
  "mode": "fast",
  "rules": [
    {
      "id": "head-without-sort",
      "enabled": true,
      "severity": "info"
    },
    {
      "id": "command-suggestion",
      "enabled": true
    }
  ]
}
```

The legacy top-level array remains accepted. Missing or malformed values
normalize to `fast` mode and catalog defaults. `command-suggestion` belongs to
the syntax channel and is not a catalog `Diagnostic` rule.
