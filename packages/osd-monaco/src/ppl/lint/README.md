# PPL query linting

PPL query linting reports queries that can fail at execution time, silently
return an unexpected result, or use an expensive execution plan. Static rules
run best-effort on error-recovered parse trees; explain attribution requires a
clean parse. Diagnostics are advisory and never prevent the query from running.

This README is the engineering front door. See:

- [Maintaining PPL lint rules](../../../../../docs/plugins/data/ppl_lint_developer_guide.md)
- [Diagnostic and context contract](CONTRACT.md)
- [Per-rule reference](docs/rules/)

## Ownership map

PPL lint crosses package and plugin boundaries. Start in the owner for the
behavior being changed:

| Surface                                                                                                        | Owner                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Catalog, detector dispatch, applicability gates, diagnostics, fixes, hover, telemetry, and explain attribution | `packages/osd-monaco/src/ppl/lint/`                                          |
| Monaco scheduling, stale-result protection, worker serialization, marker publication, and explain layering     | `packages/osd-monaco/src/ppl/language.ts`                                    |
| Global feature state, per-model context, and runtime-to-compiled fallback                                      | `packages/osd-monaco/src/ppl/lint_bridge.ts`                                 |
| Runtime grammar cache, interpreter-backed lint, and Node-safe headless API                                     | `src/plugins/data/public/antlr/opensearch_ppl/`                              |
| Dataset metadata, version and engine signals, settings overrides, and context construction                     | `src/plugins/data/public/ppl_lint/`                                          |
| Shared and Explore editor context attachment, refresh subscriptions, and cleanup                               | `src/plugins/data/public/ui/query_editor/` and `src/plugins/explore/public/` |
| Feature capability, Advanced Settings registration, telemetry sink, and execution-query preparation            | `src/plugins/query_enhancements/`                                            |

The package is not a standalone analyzer. A rule can be correctly implemented
and registered yet remain inert if its host does not provide the grammar,
version, engine, metadata, or HTTP capability required by its catalog flags.

## Execution pipeline

```text
plugin startup
  -> queryEnhancements.pplLint capability enables the global lint state
  -> optional runtime grammar bridge, explain preparer, and telemetry sink register

host/editor setup
  -> host stores PPLLintContext in a WeakMap keyed by the Monaco model

editor content change
  -> syntax validation runs immediately (marker owner: PPL_WORKER)
  -> 500 ms trailing-edge lint debounce, per model

explicit context refresh, model creation, or language change
  -> syntax validation and lint revalidation run immediately

each lint pass
  -> runtime grammar bridge when a compatible grammar is cached
       or compiled simplified grammar in the web worker as a fallback
  -> runLint applies catalog gates and dispatches synchronous tree detectors
  -> static Diagnostic[] renders immediately
  -> optional asynchronous _explain and attribution pass
  -> diagnostic_to_marker.ts converts ANTLR coordinates to Monaco coordinates
  -> lint markers publish (marker owner: PPL_LINT)
```

Syntax and lint markers use separate owners and separate quick-fix tables. A
new result replaces only its own channel. Generation, content, model-disposal,
and language checks prevent stale asynchronous results from being rendered.

### Startup and host lifecycle

The server-side feature flag is `queryEnhancements.ppl.lint.enabled`. It is not
an Advanced Setting and defaults to `false`. The containing
`queryEnhancements` plugin defaults to enabled; disabling that plugin disables
lint regardless of the nested flag.

For a static deployment, set the flag in `opensearch_dashboards.yml` and restart
OpenSearch Dashboards:

```yaml
queryEnhancements.ppl.lint.enabled: true
```

The flag is also dynamic-config-aware. `DynamicConfigService` always exists:

- With `dynamic_config_service.enabled: false`, its dummy store returns no
  overlay, so the schema-validated YAML value is used.
- With `dynamic_config_service.enabled: true`, the configured store can overlay
  the `queryEnhancements` namespace with a blob such as
  `{ "ppl": { "lint": { "enabled": true } } }`. The overlay is recursively
  merged over the YAML configuration and can be request-scoped by a custom
  store using the async-local request context.

Enabling `dynamic_config_service` alone does not enable lint; it only makes a
store overlay available.

The server registers `queryEnhancements.pplLint: false` as the safe capability
baseline. On each capability resolution, its switcher reads the merged config
using `pluginConfigPath: ['queryEnhancements']` and sets the capability to true
only when `config.ppl.lint.enabled === true`. Dynamic config writes are not
schema-validated, so values such as the string `"true"` fail closed. A config
lookup error is logged and leaves the baseline capability off.

The public query enhancements plugin samples
`core.application.capabilities.queryEnhancements.pplLint` once during browser
plugin startup. A dynamic flag change affects newly loaded browser sessions,
but does not hot-enable or hot-disable an existing page; reload the page after a
dynamic change. A YAML change requires both a server restart and a browser
reload.

The public plugin also samples the
`query:enhancements:runtimePplGrammar` Advanced Setting, then calls
`registerPplLint`. When the capability is true, registration:

1. Enables the global lint state in `lint_bridge.ts`.
2. Registers telemetry even if runtime grammar is unavailable, because the
   compiled worker still emits diagnostics.
3. Registers the runtime bridge and execution-query preparer only when the
   runtime grammar Advanced Setting is enabled.
4. Returns a disposer that removes all registrations and disables the global
   state.

When the capability is off, the language layer clears lint markers and fixes,
does not run static or explain lint, and leaves unknown-command errors in their
raw syntax form without the `command-suggestion` rewrite. Rule Advanced
Settings remain stored but cannot enable lint by themselves.

The capability is a client feature gate, not a server-route authorization
boundary. Query enhancements routes, including the PPL explain proxy, are
registered whenever the containing plugin is enabled. They continue to use the
request's normal OpenSearch client and authorization.

Each editor host must attach context to the current Monaco model and clear it
when the model changes or the editor unmounts. The host also revalidates after
runtime grammar, resolved version, or measured Calcite settings change. Both
the shared query editor and Explore implement this lifecycle; a new editor host
does not inherit it automatically.

### Reviewed launch activation state

Implemented does not mean active. The reviewed launch configuration has these
independent gates:

| Surface                     | Default state                              | Effect                                                                                                                                          |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Global PPL lint capability  | Off                                        | The language layer suppresses diagnostics and command suggestions; the runtime bridge, explain preparer, and telemetry sink are not registered. |
| Per-rule configuration      | 12 lint rules on; 6 lint rules off         | The configured-on rules can run only after the global capability is enabled and their applicability gates pass.                                 |
| `command-suggestion`        | On when the global capability is enabled   | Unknown-command syntax errors can offer a replacement; it remains off while the global capability is off.                                       |
| Explain-backed rules        | Both off                                   | `operation-not-pushed` and `operation-pushed-as-script` do not run, so untouched settings issue no lint `_explain` requests.                    |
| Explain attribution mode    | `fast`                                     | No isolation probes are issued. This setting has no effect until an explain-backed rule is enabled.                                             |
| Runtime grammar setting     | On, subject to version and cache readiness | The bridge is registered only after the global capability is enabled; the compiled worker remains the fallback.                                 |
| Assisted diagnostic actions | Not shipped                                | `aiFixable` has no production catalog entry or action contributor, so there is no assisted-fix path to enable.                                  |

This table describes defaults, not a force-disable. A persisted Advanced
Settings override can opt in to a default-off rule after the global capability
is enabled.

The related switches have different owners and lifecycles:

| Switch                                           | Owner                           | Default                                 | Evaluation and effect                                                                                     |
| ------------------------------------------------ | ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `queryEnhancements.enabled`                      | Server config                   | On                                      | Plugin startup; disables the entire query enhancements plugin when false.                                 |
| `queryEnhancements.ppl.lint.enabled`             | Static or dynamic server config | Off                                     | Capability resolution, then browser startup; gates all lint and command-suggestion behavior.              |
| `query:enhancements:enabled`                     | Advanced Settings               | Off                                     | General query-enhancements UI behavior; current PPL lint registration does not read this setting.         |
| `query:enhancements:pplLint:rules`               | Advanced Settings               | 12 lint rules and command suggestion on | Read during context builds; editor hosts subscribe and immediately revalidate after a saved-value change. |
| `mode` inside `query:enhancements:pplLint:rules` | Advanced Settings               | `fast`                                  | Read with rule overrides; controls explain isolation only after an explain rule is enabled.               |
| `query:enhancements:runtimePplGrammar`           | Advanced Settings               | On                                      | Browser startup and page reload; controls runtime bridge/preparer registration, not the global lint gate. |

### Grammar surfaces

`resolvePPLLintResult` tries the registered runtime bridge first. The bridge
uses the grammar bundle cached for the active data source. If the bridge is
unavailable, the grammar is not cached, or the runtime pass fails, linting falls
back to the compiled simplified grammar in the PPL web worker.

The two surfaces share the catalog, detector implementations, rule-name lookup
API, and `runLint` engine. A catalog entry with `runtimeOnly: true` is skipped on
the compiled surface because its command is not represented there.

Runtime grammar artifacts are fetched only for compatible data sources. A
rule's `appliesTo.minVersion` is therefore necessary but not sufficient for a
runtime-only rule to fire: the host must also have loaded a runtime grammar.

The browser runtime path retains ANTLR error-recovered trees and runs detectors
best-effort. The compiled analyzer also runs static rules on its recovered tree,
but it only builds explain-attribution candidates after a clean parse. This is
why a partially typed query can retain static diagnostics without issuing an
`_explain` request.

Pipe-first input is parsed with a synthetic source prefix. Both surfaces stamp
`isPipeFirst`, and `remapPipeFirstColumns` removes the synthetic prefix from
diagnostic and explicit fix ranges before results leave the analyzer.

### Explain-backed rules

Rules with `needsExplain: true` do not run in the static tree pass. After static
markers render, `language.ts` requests the plan for a best-effort execution
query prepared from current host state, runs `runExplainLint`, and narrows
whole-query findings to the relevant `where`, `stats`, or `sort` command.

In `fast` mode, an ambiguous finding is omitted rather than shown at the wrong
location. `thorough` mode can issue bounded control and treatment probes to
isolate the responsible command. The shipped default is `fast`.

The explain pass runs only when all of the following are available:

- At least one enabled, version-applicable, Calcite explain rule.
- A parseable data-source version and positive Calcite signal.
- A host HTTP client.
- A clean, protocol-valid attribution snapshot from the compiled parser.
- A current model generation with unchanged content and PPL language.

The shared preparer reproduces the common source insertion or quoting,
dashboard-filter, and time-filter path using current query-service state. It
cannot observe request-specific `skipFilters`, `skipTimeFilter`,
`request.params.index`, or the S3 asynchronous `head` insertion, so hosts with
those execution variants need a request-aware equivalent before explain can be
exact. It returns both the prepared query and a stable cache key. The entire
injected time predicate is omitted from the key; dashboard filters remain
because they can change the plan. `injectedWhereCount` prevents an injected
filter from being attributed to the user's only `where`.

Successful plans are cached separately for baseline and probe requests. Each
partition holds 50 entries and evicts oldest-first. Requests with the same key
share an in-flight fetch; subscriber aborts are reference-counted so one stale
model cannot cancel another model's request. Unsupported plans and network
errors are not cached. There is no production invalidation of successful plans
other than eviction.

Thorough attribution is bounded to three ambiguous candidates, four additional
requests, two concurrent requests, and two seconds. A generated probe must
parse cleanly, remain within budget, reproduce the expected plan outcome, and
still belong to the current lint generation.

## Rule applicability

`lint_runner.ts` merges user execution overrides into the local catalog entry,
then applies these gates before calling a detector:

1. The rule is enabled.
2. Its data-source version and engine match `appliesTo`.
3. A runtime-only rule is on the runtime grammar surface.
4. A context-dependent rule has usable metadata.
5. A source-scoped rule is not being evaluated with another dataset's metadata.

Version behavior is intentionally conservative. Calcite-only rules require a
positive Calcite signal. When the data-source version is unknown, an
error-severity rule with a minimum version is suppressed because the floor
cannot be proven.

`needsContext` is a coarse runner gate. It currently considers only nonempty
`fields`, `typeMap`, or `visibleIndices`; it does not consider
`disabledObjectFields` or cluster settings. Every context-dependent detector
must still check its exact input and return no diagnostics when it is absent.

`sourceScoped` only suppresses on a proven conflict between one explicit
top-level source and the selected dataset pattern. Missing, wildcard,
multi-source, pipe-first, and otherwise inconclusive classifications fail open.
Detectors must use `collectAlternateSourceSubtrees` when nested commands read a
different source so outer metadata does not leak into those subtrees.

## Rule catalog

The catalog is the source of truth for rule identity, detector key, default
state, severity, user-facing message and fix guidance, documentation URL,
version/engine applicability, and context flags. The query enhancements
Advanced Setting mirrors the catalog defaults; its own test enforces parity.

### Configured on when the feature is enabled

Twelve lint rules are configured on:

- `agg-on-text`
- `division-by-zero`
- `enabled-false-object`
- `field-validation`
- `invalid-capture-group-name`
- `multisearch-min-subsearch`
- `replace-wildcard-asymmetry`
- `rex-scan-cost`
- `type-mismatch-numeric`
- `union-min-datasets`
- `unsupported-window-function-in-eventstats`
- `wildcard-source-zero-match`

The syntax-channel `command-suggestion` check is also enabled by default,
bringing the configured-on set to 13 checks once the global capability is
enabled. It is configured with the lint rules but is not part of the lint
catalog because it enhances a syntax error.

### Configured off

Six implemented lint rules are disabled by default:

- `dedup-consecutive-unsupported`
- `disabled-join-type`
- `flat-object-subfield`
- `head-without-sort`
- `operation-not-pushed`
- `operation-pushed-as-script`

The two `operation-*` rules are the only explain-backed rules. With both
disabled, enabling the global PPL lint capability does not by itself generate
lint `_explain` traffic. A user must opt in to at least one of them, and the
version, Calcite, HTTP, and clean-parse gates must also pass.

Users can opt in to a disabled rule through the
`query:enhancements:pplLint:rules` Advanced Setting.

Each linked rule page is also the detailed maintainer reference for that rule:
it names the detector and shared implementation paths, hardcoded grammar,
command, type, or plan assumptions, known failure and suppression behavior,
and the focused tests that must change with it.

| Rule                                                                                                   | Severity | Default | Applies to      | Flags                  |
| ------------------------------------------------------------------------------------------------------ | -------- | ------- | --------------- | ---------------------- |
| [`head-without-sort`](docs/rules/head_without_sort.md)                                                 | info     | off     | all versions    | none                   |
| [`division-by-zero`](docs/rules/division_by_zero.md)                                                   | warning  | on      | all versions    | none                   |
| [`unsupported-window-function-in-eventstats`](docs/rules/unsupported_window_function_in_eventstats.md) | error    | on      | 3.4.0+          | none                   |
| [`multisearch-min-subsearch`](docs/rules/multisearch_min_subsearch.md)                                 | error    | on      | 3.4.0+          | runtime grammar        |
| [`disabled-join-type`](docs/rules/disabled_join_type.md)                                               | warning  | off     | all versions    | none                   |
| [`dedup-consecutive-unsupported`](docs/rules/dedup_consecutive_unsupported.md)                         | warning  | off     | 3.3.0+; Calcite | none                   |
| [`union-min-datasets`](docs/rules/union_min_datasets.md)                                               | error    | on      | 3.7.0+; Calcite | runtime grammar        |
| [`replace-wildcard-asymmetry`](docs/rules/replace_wildcard_asymmetry.md)                               | error    | on      | 3.4.0+; Calcite | runtime grammar        |
| [`field-validation`](docs/rules/field_validation.md)                                                   | error    | on      | all versions    | source scoped          |
| [`agg-on-text`](docs/rules/agg_on_text.md)                                                             | warning  | on      | 3.7.0+; Calcite | context; source scoped |
| [`flat-object-subfield`](docs/rules/flat_object_subfield.md)                                           | error    | off     | 3.8.0+; Calcite | context; source scoped |
| [`type-mismatch-numeric`](docs/rules/type_mismatch_numeric.md)                                         | warning  | on      | 3.7.0+; Calcite | context; source scoped |
| [`invalid-capture-group-name`](docs/rules/invalid_capture_group_name.md)                               | error    | on      | 3.4.0+          | none                   |
| [`operation-not-pushed`](docs/rules/operation_not_pushed.md)                                           | warning  | off     | 3.3.0+; Calcite | explain plan           |
| [`operation-pushed-as-script`](docs/rules/operation_pushed_as_script.md)                               | info     | off     | 3.3.0+; Calcite | explain plan           |
| [`enabled-false-object`](docs/rules/enabled_false_object.md)                                           | warning  | on      | 3.7.0+; Calcite | context; source scoped |
| [`wildcard-source-zero-match`](docs/rules/wildcard_source_zero_match.md)                               | info     | on      | all versions    | context                |
| [`rex-scan-cost`](docs/rules/rex_scan_cost.md)                                                         | info     | on      | all versions    | context; source scoped |

## Context

The data plugin builds the context passed to `runLint`:

| Context value                                  | Used for                                                        |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `fields`                                       | Unknown-field validation                                        |
| `typeMap`                                      | Mapping-sensitive rules and safe explain quick fixes            |
| `disabledObjectFields`                         | References below objects mapped with `enabled: false`           |
| `visibleIndices`                               | Local wildcard source matching                                  |
| `selectedSourcePattern`                        | Suppressing source-scoped rules on a proven source mismatch     |
| `dataSourceVersion`, `isCalcite`, `engineType` | Applicability gates                                             |
| `settings.allJoinTypesAllowed`                 | Suppressing disabled-join findings when the cluster allows them |
| `overrides`                                    | Per-rule enabled and severity changes                           |
| `explainMode`                                  | Fast or thorough explain attribution                            |

Field metadata is used only when dataset ID, data-source ID, and dataset type
match the cache stamp. Conflicting mapping types remain in `fields` but are
omitted from `typeMap`, making type-sensitive rules self-suppress rather than
choosing an arbitrary type. `visibleIndices` is data-source-wide and is
therefore gated only by data-source identity.

The compiled worker receives a structured-clone-safe form: sets become arrays,
maps become objects, and function-bearing objects such as the HTTP client and
query preparer are omitted. Any new detector-facing context field must be added
to `LintPayloadContext`, `SerializableLintContext`, the main-thread serializer
in `language.ts`, the worker hydrator in `ppl.worker.ts`, and the host context
builder.

## Editor surfaces

- `diagnostic_to_marker.ts` maps diagnostics to Monaco markers and performs the
  only lint-path conversion from 0-based ANTLR columns to 1-based Monaco
  columns.
- `hover/hover_provider.ts` renders the severity, rule ID, detector message,
  catalog `howToFix` guidance, and a deterministic fix preview when available.
- `code_action_provider.ts` reads deterministic fixes from `fix_registry.ts`.
  Monaco rebuilds marker objects and drops custom fields, so fix payloads live
  in a side table keyed by marker identity.
- `diagnostic_action.ts` is the extension point for additional actions. Those
  actions are independent of deterministic edits.
- `telemetry.ts` tracks static rule activation and per-marker hover and
  quick-fix episodes when a host registers a sink. Explain markers participate
  in hover and quick-fix tracking but not `diagnostic_shown`;
  `command-suggestion` is outside lint telemetry.

A deterministic fix is attached only when the rewrite is unambiguous,
result-preserving, and cannot immediately reproduce the same diagnostic.
`explain/explain_quick_fix.ts` documents the strictest example.

The shared editors use `fixedOverflowWidgets`, which places the hover outside
the editor bounds. `lint_hover_persistence.ts` intercepts Monaco's hover
`mouseleave` handling and adds a 600 ms grace period. That workaround depends
on Monaco's `.overflowingContentWidgets` and `.monaco-hover` DOM structure and
must be revalidated when Monaco changes.

## Configuration

The feature is gated by `queryEnhancements.ppl.lint.enabled`, which is disabled
by default. Per-rule execution settings live in the JSON Advanced Setting
`query:enhancements:pplLint:rules`:

```json
{
  "mode": "fast",
  "rules": [
    {
      "id": "head-without-sort",
      "enabled": true,
      "severity": "info"
    }
  ]
}
```

This example opts in to `head-without-sort`, which is disabled by default.

The setting also contains `command-suggestion`. That entry controls a syntax
error enhancement and is not a catalog lint rule, so it has no severity.
Legacy top-level rule arrays remain accepted and are normalized to `fast` mode.

The rule setting is read on each context build and does not require a page
reload. The feature capability is sampled at plugin startup, and the runtime
grammar Advanced Setting requires a page reload.

`lint_overrides.ts` accepts only `enabled` and `severity` from Advanced
Settings. It ignores presentation fields and unknown rule IDs. Severity floors
are hardcoded at warning for `division-by-zero`, `agg-on-text`, and
`type-mismatch-numeric`.

Unknown IDs are ignored at execution time but are not removed from persisted
JSON. This is forward-tolerance, not a retirement migration. Retire rules
default-off before deletion, and never reuse an ID unless old saved overrides
and telemetry have been migrated explicitly.

## Hardcoded maintenance points

These values and semantic maps are implementation assumptions, not data loaded
from the backend. The
[developer guide](../../../../../docs/plugins/data/ppl_lint_developer_guide.md#command-impact-matrix)
contains the command-by-command impact matrix and new-command checklist; adding
a grammar rule alone is not sufficient.

| Assumption                                   | Location and maintenance requirement                                                                                                                                                                                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule IDs, flags, defaults, and severity      | `rules_catalog.json`; mirror the execution fields in `PPL_LINT_RULE_DEFAULTS`. The settings test enforces this pair.                                                                                                                                                                                |
| Tree and explain detector dispatch           | `detector_registry.ts` and `explain/explain_registry.ts`; a missing entry logs a warning and leaves the rule inert.                                                                                                                                                                                 |
| Latest verified engine horizon               | `OSD_KNOWN_VERSION` in `version_filter.ts`; advance it when rules are verified against a newer engine and update version-boundary tests.                                                                                                                                                            |
| Pipeline order effects and command census    | `COMMAND_ORDER_EFFECTS` in `pipeline_shape.ts`; classify every grammar command. An omitted command also hides fields it creates.                                                                                                                                                                    |
| Created-field semantics                      | `pipeline_shape.ts` contains engine-derived defaults for `patterns`, totals, capture patterns, `spath`, and companion fields. Recheck them after grammar or engine changes.                                                                                                                         |
| Alternate-source scoping                     | `collectAlternateSourceSubtrees`; add any new command that owns a nested or secondary source.                                                                                                                                                                                                       |
| Field-slot and type semantics                | `field_validation.ts`, `field_slot_shape_text.ts`, `agg_on_text.ts`, and `type_mismatch_numeric.ts` contain command, exclusion, type, operator, and fallback lists.                                                                                                                                 |
| Rule-specific engine behavior                | Join types, unsupported window functions, extraction commands, regex syntax, wildcard restrictions, and edit-distance thresholds live in their detector modules.                                                                                                                                    |
| Feature and setting defaults                 | The feature capability defaults off. When enabled, runtime grammar and `command-suggestion` default on, both explain-backed rules default off, and explain attribution defaults to `fast`. Keep server registration and client fallback behavior aligned.                                           |
| Runtime grammar eligibility and fetch policy | OpenSearch 3.6+, one active data-source cache slot, a 30-second failed-fetch cooldown, and a 10-second fetch timeout in `ppl_grammar_cache.ts`. A later `warmUp` call initiates the retry; there is no retry timer.                                                                                 |
| Calcite settings cache                       | `calcite_settings_cache.ts` stores one reading per data source with no expiry. It exposes invalidation, but there is no production subscription to administrator-side engine-setting changes.                                                                                                       |
| Metadata limits and routes                   | A 5,000-name visible-index cap and mapping/index routes in `visible_indices.ts` and `disabled_object_fields.ts`. Oversized or failed reads suppress rules.                                                                                                                                          |
| Scheduling                                   | A 500 ms content-change lint debounce in `language.ts` and a 5-second worker request timeout in `worker_proxy_service.ts`. Explicit revalidation bypasses the debounce.                                                                                                                             |
| Explain transport and interpretation         | The hardcoded `/api/enhancements/ppl/explain` route accepts queries up to 65,536 characters. `explain_cache.ts` has 50-entry limits per partition; `explain_outcomes.ts` owns pushdown tags and the script discriminator. Increment `EXPLAIN_OUTCOME_DETECTOR_VERSION` when interpretation changes. |
| Explain attribution protocol                 | Supported operations, candidate shapes, and probe kinds in `explain/attribution/`. Increment `EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION` for incompatible serialized changes.                                                                                                                            |
| Explain query preparation                    | `explain_query_preparer.ts` hardcodes the `dashboards` filter-manager app and backtick handling for `INDEXES` and `INDEX_PATTERN`. It lacks request-specific skip flags and index overrides, omits S3 async `head`, and excludes the injected time predicate from its cache key.                    |
| Hover persistence                            | `lint_hover_persistence.ts` assumes Monaco's overflow-widget DOM structure and uses a 600 ms delayed `mouseleave` replay. Keep its DOM-shape tests current across Monaco upgrades.                                                                                                                  |
| Default-status documentation                 | The enabled/disabled lists, rule table, and per-rule `Availability` sections are maintained manually. There is intentionally no documentation parity test.                                                                                                                                          |

## Failure behavior

The lint subsystem prefers missing diagnostics over unsupported or stale ones:

- A malformed catalog entry is dropped with a console warning.
- A missing detector registration leaves that catalog rule inert.
- A detector exception is isolated to that rule.
- A missing grammar rule returns `-1`; tree helpers return no match.
- Missing or stale metadata causes context-sensitive detectors to return no
  diagnostics.
- Runtime bridge failure falls back to the compiled worker.
- Runtime grammar fetch failure falls back and permits a retry on a later
  `warmUp` call after the cooldown.
- Explain parse, HTTP, plan-shape, attribution, or probe failures leave static
  markers unchanged.
- A newer generation, edited content, or language change drops stale pending
  results.
- Model disposal clears language-layer timers, abort controllers, generations,
  fix registries, markers, and telemetry state.

Catalog loading does not reject duplicate IDs. Duplicate entries can execute
twice, while the catalog-by-ID map keeps the last entry. Treat ID uniqueness as
a required review invariant.

### Debug an inert rule

Check the execution gates in order:

1. Confirm the global feature capability is enabled and the editor model is
   PPL.
2. Inspect the catalog default and the normalized Advanced Settings override.
3. Confirm `appliesTo` receives a parseable version and the required positive
   Calcite signal.
4. For `runtimeOnly`, confirm the active data source has a cached runtime
   grammar and the context is stamped `runtime-bundle`.
5. Inspect the exact context collection, its dataset/data-source/type cache
   stamp, and any source mismatch.
6. Confirm the detector is in the correct static or explain registry; missing
   registrations emit an inert-rule console warning.
7. For explain rules, confirm an HTTP client, clean attribution snapshot,
   applicable rule, supported plan shape, and unambiguous or probe-resolvable
   candidate.
8. Compare the `PPL_WORKER` syntax channel with the `PPL_LINT` marker channel so
   a syntax failure is not mistaken for a lint failure.

## Headless API

`src/plugins/data/public/antlr/opensearch_ppl/headless_ppl_lint.ts` exposes a
Node-safe path for cross-repository grammar validation. It deserializes a
supplied runtime bundle and runs the production catalog, registry, tree builder,
pipe-first handling, and `runLint` engine without Monaco or a browser.

Unlike the browser cache, `deserializeBundleOrThrow` fails hard on an invalid
bundle so CI cannot pass with an empty grammar. Callers should pass the
candidate backend version as both `dataSourceVersion` and, when appropriate,
`knownVersion`. The in-repository tests cover source imports and real
detectors; ownership of loading the built artifact and the external workflow
remains with the consuming repository.

## Testing

From the repository root:

```bash
yarn test:jest packages/osd-monaco/src/ppl --runInBand
yarn test:jest src/plugins/data/public/ppl_lint --runInBand
yarn test:jest src/plugins/data/public/antlr/opensearch_ppl --runInBand
yarn test:jest src/plugins/data/public/ui/query_editor/query_editor_lint_fields.test.tsx
yarn test:jest src/plugins/explore/public/components/query_panel/query_panel_editor/use_query_panel_editor/use_query_panel_editor.test.ts
yarn test:jest src/plugins/query_enhancements/public/ppl_lint src/plugins/query_enhancements/public/search/ppl_search_interceptor.test.ts --runInBand
yarn test:jest src/plugins/query_enhancements/server/ui_settings.test.ts
yarn workspace @osd/monaco build --dev
yarn docs:generateDevDocs
```

The complete matrix is change-dependent. See the developer guide for the
focused tests required by rule, grammar, context, explain, UI, and host changes.
