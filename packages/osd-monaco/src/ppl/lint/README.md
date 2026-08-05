# PPL query linting

PPL query linting reports queries that can fail, return an unexpected result,
or use an avoidably expensive execution plan. Diagnostics are advisory and
never prevent a query from running.

This README is the maintainer entry point. See the
[lint contract](CONTRACT.md) for stable cross-boundary behavior and the
[rule references](docs/rules/) for individual diagnostics.

## How PPL linting runs

The `queryEnhancements.ppl.lint.enabled` capability gates PPL linting. When it
is enabled, editor hosts attach the available dataset, engine, and version
context to the Monaco model.

On each lint pass:

1. The language layer uses a compatible runtime grammar when one is cached,
   otherwise it falls back to the compiled grammar worker.
2. `runLint` applies catalog and context gates before dispatching static
   detectors.
3. Static diagnostics render immediately.
4. Enabled explain-backed rules can request a query plan and add attributed
   diagnostics after the static result.

Syntax and lint diagnostics use separate marker owners. Stale asynchronous
results are discarded when the query, language, model, or lint generation
changes. Missing grammar, context, or explain evidence suppresses the affected
diagnostic rather than guessing.

The main entry points are:

- [`rules_catalog.json`](rules_catalog.json) for rule identity, defaults,
  severity, copy, applicability, and behavior flags.
- [`lint_runner.ts`](lint_runner.ts) for common gates and static dispatch.
- [`detector_registry.ts`](detector_registry.ts) and
  [`explain/explain_registry.ts`](explain/explain_registry.ts) for detector
  registration.
- [`../language.ts`](../language.ts) for Monaco scheduling and result
  publication.
- [`../lint_bridge.ts`](../lint_bridge.ts) for runtime grammar fallback and
  model context.

## Configure linting

The server feature flag is:

```yaml
queryEnhancements.ppl.lint.enabled: true
```

Per-rule overrides use the
`query:enhancements:pplLint:rules` Advanced Setting. An override can enable or
disable a rule and change its severity. The setting also contains
`command-suggestion`, which controls an unknown-command syntax hint rather than
a catalog lint rule.

The defaults shown on individual rule pages apply only after the global PPL
lint capability is enabled.

The query enhancements UI setting mirrors the catalog defaults. Keep
`src/plugins/query_enhancements/server/ui_settings.ts` synchronized with
`rules_catalog.json`; its focused test enforces parity.

## Rules

- [`agg-on-text`](docs/rules/agg_on_text.md)
- [`dedup-consecutive-unsupported`](docs/rules/dedup_consecutive_unsupported.md)
- [`disabled-join-type`](docs/rules/disabled_join_type.md)
- [`division-by-zero`](docs/rules/division_by_zero.md)
- [`enabled-false-object`](docs/rules/enabled_false_object.md)
- [`field-validation`](docs/rules/field_validation.md)
- [`flat-object-subfield`](docs/rules/flat_object_subfield.md)
- [`head-without-sort`](docs/rules/head_without_sort.md)
- [`invalid-capture-group-name`](docs/rules/invalid_capture_group_name.md)
- [`multisearch-min-subsearch`](docs/rules/multisearch_min_subsearch.md)
- [`operation-not-pushed`](docs/rules/operation_not_pushed.md)
- [`operation-pushed-as-script`](docs/rules/operation_pushed_as_script.md)
- [`replace-wildcard-asymmetry`](docs/rules/replace_wildcard_asymmetry.md)
- [`rex-scan-cost`](docs/rules/rex_scan_cost.md)
- [`type-mismatch-numeric`](docs/rules/type_mismatch_numeric.md)
- [`union-min-datasets`](docs/rules/union_min_datasets.md)
- [`unsupported-window-function-in-eventstats`](docs/rules/unsupported_window_function_in_eventstats.md)
- [`wildcard-source-zero-match`](docs/rules/wildcard_source_zero_match.md)

The rule page is the documentation source for the current severity, default,
message, fix guidance, applicability, and user-visible prerequisites. Review it
against the catalog whenever those values change.

## Add or change a rule

1. Add or update the entry in `rules_catalog.json`. Rule IDs are persisted in
   Advanced Settings and telemetry, so prefer changing user-facing copy over
   renaming an ID.
2. Implement a static detector under `rules/` or an explain detector under
   `explain/rules/`, then register it in the matching registry.
3. Use catalog values for rule ID, severity, message, and documentation link.
   Return no diagnostic when the available grammar or context cannot prove the
   finding.
4. Set applicability and context flags narrowly. An uncertain rule should
   self-suppress instead of broadening its version or engine range.
5. Add a deterministic fix only when the edit is unambiguous and preserves the
   intended result.
6. Mirror the catalog default in the query enhancements UI setting.
7. Add or update the concise rule page and the documentation-link snapshot.
8. Add a positive case, a nearby valid case, exact range coverage, and tests
   for every applicability or context gate.

When retiring a rule, preserve compatibility with stored overrides and
telemetry. Disable it before removal unless the same change defines the saved
setting and ID migration.

## Change grammar or context

Grammar and context changes cross multiple lint surfaces:

- Classify new commands in shared pipeline semantics before relying on them in
  a detector.
- Review created fields and alternate-source handling for new command shapes.
- Keep compiled and runtime grammar behavior covered when a rule supports both.
- Add host context to the public payload, worker-safe serialization, worker
  hydration, context builder, and editor lifecycle as one change.
- Treat metadata loading as best-effort and retain source provenance so a rule
  cannot use one dataset's metadata for another.

Prefer focused product-path tests through `PPLLanguageAnalyzer.lint`,
`runLint`, or `lintWithGrammar` over detector-only coverage.

## Headless and SQL compatibility

`src/plugins/data/public/antlr/opensearch_ppl/headless_ppl_lint.ts` exposes the
production runtime-grammar lint path without Monaco. The OpenSearch SQL
repository uses it for cross-repository compatibility checks.

The SQL repository owns the
[`[Linter] PPL compatibility`](https://github.com/opensearch-project/sql/blob/main/.github/workflows/ppl-lint-multiversion-validation.yml)
workflow, its
[versioned contracts](https://github.com/opensearch-project/sql/tree/main/integ-test/src/test/resources/ppl-lint/contracts),
and the
[workflow guide](https://github.com/opensearch-project/sql/blob/main/scripts/ppl-lint/README.md).
Review the corresponding SQL contract when catalog wiring, static detector
behavior, grammar requirements, fixes, or applicability changes.

## Validate changes

Choose focused suites for the changed surface. A broad lint change normally
uses:

```bash
yarn test:jest packages/osd-monaco/src/ppl --runInBand
yarn test:jest src/plugins/data/public/ppl_lint --runInBand
yarn test:jest src/plugins/data/public/antlr/opensearch_ppl --runInBand
yarn test:jest src/plugins/query_enhancements/server/ui_settings.test.ts
yarn workspace @osd/monaco build --dev
```

Documentation-only changes also require Prettier, the documentation-link test,
and `yarn docs:generateDevDocs`.
