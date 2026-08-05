# Maintaining PPL lint rules

PPL lint rules report queries that can fail later, produce an unexpected
result, or use an avoidably expensive execution plan. Static rules run
best-effort on error-recovered trees; explain-backed rules require a clean
parse. The lint engine lives in `packages/osd-monaco/src/ppl/lint/`.

Read the package [architecture overview](../../../packages/osd-monaco/src/ppl/lint/README.md)
and [diagnostic contract](../../../packages/osd-monaco/src/ppl/lint/CONTRACT.md)
before changing shared types or execution behavior.

## Know the sources of truth

`packages/osd-monaco/src/ppl/lint/rules_catalog.json` owns rule identity,
shipped enabled state, severity, user-facing copy, documentation URL,
applicability, and behavior flags. A rule implementation must consume those
values through its `CatalogEntry`; do not duplicate them in a detector.

Several other surfaces intentionally mirror or extend the catalog:

| Surface                                                  | Contents                                                                                           | Enforcement                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/plugins/query_enhancements/server/ui_settings.ts`   | Rule ID, enabled default, severity, order, plus `command-suggestion`                               | Automated by `ui_settings.test.ts`                                      |
| `detector_registry.ts` and `explain/explain_registry.ts` | Detector key to implementation                                                                     | Partial product-path coverage; no complete catalog/registry parity test |
| `src/plugins/data/public/ppl_lint/lint_overrides.ts`     | Severity floors and special syntax-channel setting handling                                        | Focused tests                                                           |
| Lint README enabled/disabled lists and table             | Shipped rule summary                                                                               | Manual review                                                           |
| `docs/rules/*.md`                                        | Per-rule catalog copy, behavior, implementation, assumptions, maintenance, tests, and availability | Manual review                                                           |
| `__tests__/__fixtures__/doc_links.snapshot.json`         | External URL and link-quality classification                                                       | Offline catalog/snapshot parity test                                    |

There is intentionally no test that parses prose documentation for parity.
When a default, severity, applicability predicate, ID, or documentation URL
changes, update the manual documentation surfaces in the same change.

Rule IDs are persisted in Advanced Settings and emitted as telemetry
dimensions. Treat an ID as a compatibility key, not display text.

Implementation presence is not activation. In the reviewed launch
configuration, the global PPL lint capability is off, six catalog rules are
configured off, both explain-backed rules are therefore dormant, and assisted
diagnostic actions are not shipped. Keep the architecture README's activation
table and rule-status lists current when any of these gates change.

## Maintain the feature gate

The feature gate crosses server config, per-request capabilities, browser
startup, and Monaco global state:

1. `src/plugins/query_enhancements/common/config.ts` declares
   `queryEnhancements.ppl.lint.enabled` with a `false` default.
2. `src/plugins/query_enhancements/opensearch_dashboards.json` declares the
   case-sensitive config path `queryEnhancements`.
3. The server plugin registers a default-false
   `queryEnhancements.pplLint` capability provider.
4. Its capability switcher asks `DynamicConfigService` for
   `pluginConfigPath: ['queryEnhancements']` on each capability resolution and
   enables only for a literal boolean `true`.
5. The public plugin snapshots the resolved capability and runtime-grammar
   Advanced Setting during browser startup.
6. `registerPplLint` updates the `globalThis`-backed Monaco gate, then
   conditionally registers telemetry, the runtime bridge, and the explain-query
   preparer.
7. `language.ts` checks the global gate independently for syntax-channel
   command suggestions and lint-channel diagnostics.
8. Plugin teardown unregisters optional integrations and resets the Monaco gate
   to false.

Static YAML is the fallback configuration even when the dynamic config service
is disabled. When that service is enabled, a stored `queryEnhancements` blob is
recursively merged over YAML and may vary by request context. Dynamic writes
are not schema-validated, which is why the capability switcher must retain the
strict `=== true` check.

Do not replace `pluginConfigPath` with `{ name: 'queryEnhancements' }`:
`DynamicConfigService` snake-cases `name` to the wrong namespace. Preserve the
default-off value in the schema, capability provider, and Monaco global state
so a missing config, lookup error, disabled plugin, or incomplete startup fails
closed.

The browser does not subscribe to capability changes. A dynamic flag update
requires a page reload for existing sessions; a YAML update also requires an
OpenSearch Dashboards restart. If hot switching is added later, update browser
registration, teardown, current-model revalidation, pending explain
cancellation, telemetry registration, and tests as one lifecycle change.

Treat the capability as a client feature gate, not a security boundary. Server
routes such as the PPL explain proxy are registered with the containing plugin
regardless of the lint capability and continue to enforce their normal
request-client authorization.

Feature-gate changes require focused coverage in:

- `src/plugins/query_enhancements/server/plugin.test.ts` for provider,
  namespace, request context, strict-boolean, and failure behavior.
- `src/plugins/query_enhancements/public/ppl_lint/register_ppl_lint.test.ts` for
  the capability/runtime-grammar matrix and teardown.
- `packages/osd-monaco/src/ppl/language*.test.ts` for marker clearing,
  command-suggestion fallback, and stale asynchronous work.

## Choose the detector path

Most rules inspect an ANTLR parse tree and implement `Detector`:

```ts
type Detector = (
  tree: ParserRuleContext,
  config: CatalogEntry,
  context: LintRunContext,
  ruleNameToIndex: RuleNameToIndex
) => Diagnostic[];
```

Use an explain detector only when the finding depends on the physical plan.
Explain detectors consume an `ExplainPlan`, register in
`explain/explain_registry.ts`, and run asynchronously after static diagnostics.

Set `runtimeOnly: true` when the detector needs grammar rules that do not exist
in the compiled simplified grammar. A runtime-only rule stays silent until the
host has cached a compatible runtime grammar.

Use these flags narrowly:

- `needsContext` asks the runner to require at least one nonempty `fields`,
  `typeMap`, or `visibleIndices` collection. It does not prove that the exact
  input your rule needs is available.
- `sourceScoped` is for selected-dataset metadata such as `fields`, `typeMap`,
  or `disabledObjectFields`. It suppresses only a proven source mismatch.
- `needsExplain` moves dispatch to the asynchronous explain registry. It does
  not make the detector eligible by itself; the host still needs a version,
  positive Calcite signal, HTTP client, and clean attribution snapshot.
- `aiFixable` is an extension flag. No production catalog entry or assisted
  action contributor currently ships, so setting it alone does not create an
  action.

## Add the catalog entry

Add the rule to `rules_catalog.json`:

```json
{
  "id": "example-rule",
  "detector": "example-rule",
  "enabled": true,
  "severity": "warning",
  "message": "Describe the observed behavior.",
  "howToFix": "Tell the user what to change.",
  "docUrl": "https://docs.opensearch.org/latest/...",
  "appliesTo": {
    "minVersion": "3.8.0",
    "engine": "calcite"
  }
}
```

The fields are:

| Field          | Requirement                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`           | Unique kebab-case rule ID. It is shown in the hover card and used by Advanced Settings.                             |
| `detector`     | Registry key. It normally equals `id`.                                                                              |
| `enabled`      | Shipped default. Use `false` for an advisory rule whose signal or cost is not appropriate for every installation.   |
| `severity`     | `error`, `warning`, or `info`. Match the consequence, not the implementation difficulty.                            |
| `message`      | Short statement of what happens. Detectors may specialize it with field or operation details.                       |
| `howToFix`     | Task-oriented guidance rendered in the hover card.                                                                  |
| `docUrl`       | Closest published OpenSearch documentation page or anchor.                                                          |
| `appliesTo`    | Optional `minVersion`, `maxVersion`, and Calcite engine gate. Use only behavior verified on that surface.           |
| `runtimeOnly`  | The detector requires the runtime grammar surface.                                                                  |
| `needsContext` | The detector requires metadata such as field types or visible indexes.                                              |
| `needsExplain` | The detector consumes an `_explain` plan instead of the parse tree.                                                 |
| `sourceScoped` | The detector reads selected-dataset metadata and must be suppressed when the query explicitly names another source. |
| `aiFixable`    | A registered diagnostic-action contributor may offer an assisted fix.                                               |

Do not use a severity override to compensate for uncertain applicability.
Constrain `appliesTo`, require the relevant context, or self-suppress instead.

Catalog validation checks field shapes but does not reject duplicate IDs.
Duplicate entries can run twice, and catalog lookup by ID keeps the last one.
Check uniqueness during review.

## Implement the detector

Put a tree detector in `rules/<rule_name>.ts` and register it in
`detector_registry.ts`. Put an explain detector under `explain/rules/` and
register it in `explain/explain_registry.ts`.

Navigate trees by rule name:

```ts
const commands = findAllDescendantsByRule(tree, ruleNameToIndex, 'exampleCommand');
const argument = findChildByRule(commands[0], ruleNameToIndex, 'exampleArgument');
```

Follow these constraints:

1. Use `findChildByRule`, `findAllChildrenByRule`, and
   `findAllDescendantsByRule`. They no-op when a grammar surface lacks a rule.
2. Use `isRuleNode` and `isTerminalNode`. Do not use `instanceof
ParserRuleContext`; workers can contain a second `antlr4ng` bundle.
3. Use `buildPipelineShape` for stage ordering and
   `collectAlternateSourceSubtrees` before applying outer-source metadata inside
   nested searches.
4. Use `rangeFromContext`, `rangeFromTokens`, or `rangeWithinToken`. Diagnostic
   lines are 1-based and columns are 0-based.
5. Return `[]` when required metadata is absent or the current grammar cannot
   prove the finding.
6. Use `config.id`, `config.severity`, `config.message`, and `config.docUrl`
   rather than duplicating catalog values in the detector.

The runner handles common gates, but direct detector tests bypass it. A
Calcite-specific detector should still check `context.isCalcite === true` when
that protects the detector's own contract.

### Maintain shared semantic maps

Some rules depend on shared, hardcoded interpretations of the grammar and
engine. A grammar accepting a new command does not make the lint model aware of
that command.

Do not patch one detector around a missing shared classification. Update the
shared map and its census or guard tests so later rules see the same semantics.

#### New-command checklist

For every command added to either grammar surface:

1. Add its parser rule name to `COMMAND_ORDER_EFFECTS` in `pipeline_shape.ts`.
   Classify the command from observed engine behavior, not from its name. An
   omitted command is skipped silently, can make `head-without-sort` wrong, and
   prevents its created fields from being registered. The command census checks
   the bundled grammar and one captured 3.8 runtime grammar; it cannot see a
   newer backend command until that fixture is refreshed.
2. Decide whether it creates, removes, renames, or shadows fields. Extend
   `collectCreatedFields` when the generic `AS` and `evalClause` scans are not
   sufficient. The current model accumulates known fields; it does not model a
   field being removed or when a field becomes available. Destructive
   projections can therefore cause false negatives, and a field created by a
   later stage is currently treated as known by earlier stages.
3. Decide whether it contains a nested pipeline or reads another source. Update
   `collectAlternateSourceSubtrees` before any source-scoped rule can inspect
   the command with the outer dataset's metadata.
4. Search `field_validation.ts`, `field_slot_shape_text.ts`, and
   `field_slot_grammar_guard.test.ts` for command and ancestor allowlists. Add a
   slot-shape fallback only when the compiled grammar can misparse valid syntax;
   do not broaden the text scanner to all commands.
5. Search `explain/attribution/candidates.ts`. Decide whether the command is an
   attributable operation, a branch that makes attribution unsafe, preserves
   an `eval` alias, or creates an unsupported aggregation shape.
6. Search `rules/` for command-name arrays and direct rule-name lookups. A new
   spelling or merged parser rule does not automatically join an existing rule
   family. A backend-only command that has no compiled grammar representation
   needs `runtimeOnly` and must be exercised through `lintWithGrammar`.
7. Update the captured runtime grammar fixture and run the command census,
   ordering, field-slot, grammar-equivalence, runtime-lint, and headless-lint
   suites that cover the changed surface. Add a focused product-path case for
   any new hardcoded semantic.
8. Verify ordering, output field names, source scope, and version/engine
   applicability against a live engine. Record version differences in comments
   and tests rather than choosing one surface's behavior silently.

`command_census.test.ts` catches a missing order classification, but it does not
prove that the chosen classification, created-field handling, source scope, or
explain behavior is correct.

Current limitations that a command change must not hide:

- Created fields are collected for the whole outer pipeline, not incrementally
  by stage. There is no use-before-definition check.
- Alternate-source pruning is implemented by `field-validation` and
  `rex-scan-cost`, but `agg-on-text`, `type-mismatch-numeric`,
  `flat-object-subfield`, and `enabled-false-object` currently walk the full
  tree with outer-source metadata. A new alternate-source form increases that
  exposure until those detectors are scoped consistently.
- `lookup`, `appendcol`, `appendpipe`, and `foreach` are pruned as whole command
  nodes. This protects their inner sources but can also hide an output field
  they add to the outer pipeline.

#### Command impact matrix

Use this matrix before treating a command change as grammar-only:

| Command or family                                                                           | Hardcoded surfaces to review                                                                                                                                                                                       | Main pitfalls                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every pipeline command                                                                      | `COMMAND_ORDER_EFFECTS`, `COMMAND_RULE_NAMES`, `command_census.test.ts`, and `command_order_effects.test.ts`                                                                                                       | An unknown parser rule is invisible to pipeline analysis. Keep old and new rule names when engine versions rename or merge commands, as with `topCommand`, `rareCommand`, and `rareTopCommand`.                                                                                              |
| `source` / `index`, `search`, `describe`, `show`, `rest`                                    | `top_level_source.ts`, source exclusions in `field_validation.ts`, `addPPLSourceClause`, `prependSource`, `isPPLSearchQuery`, `ppl_filter_utils.ts`, `ppl_search_interceptor.ts`, and runtime start-rule selection | Source prepending is implemented separately in Explore and explain preparation. New source-free commands must update both. Search classification recognizes only current `source=` forms; a new form can bypass filters, time ranges, source-mismatch suppression, and wildcard-source lint. |
| `where`                                                                                     | `OPERATION_COMMANDS`, filter candidate extraction, comparison-range extraction, `ppl_filter_utils.ts`, and `injectedWhereCount` handling                                                                           | Dashboard and time filters inject additional `where` commands. Attribution must not assign an injected filter to the user's command. A new filter-like command remains unsupported until explicitly modeled.                                                                                 |
| `sort`, `head`, `reverse`, `dedup`, `top`, `rare`, `chart`, `timechart`                     | Order classification, `head_without_sort.ts`, sort attribution, `ALIAS_PRESERVING_COMMANDS`, and `queryEndsWithHead`                                                                                               | A command can preserve, establish, or destroy an earlier sort. `top`/`rare` use different parser rule names across grammar versions. Explain attribution treats only `sortCommand` as a sort candidate; S3 execution recognizes only terminal `head` as an existing limit.                   |
| `dedup`                                                                                     | `dedup_consecutive_unsupported.ts` and order classification                                                                                                                                                        | The detector uses flattened command text to recognize `consecutive=true`; a grammar or option-spelling change can silently disable it.                                                                                                                                                       |
| `stats`, `eventstats`, `streamstats`, `chart`, `timechart`                                  | Created aliases, `agg_on_text.ts`, `unsupported_window_function.ts`, aggregation attribution, and order classification                                                                                             | Explain attribution supports one outer `statsCommand`; the other aggregation shapes deliberately mark aggregation attribution unsupported. Window-function restrictions cover only `eventstats` and `streamstats`.                                                                           |
| `eval` and `rename`                                                                         | `collectCreatedFields`, `buildEvalBindings`, `updateRenameBindings`, and alias-preserving command handling                                                                                                         | Explain probes follow only simple, unambiguous aliases. Multiple or wildcard renames clear bindings. A stored field renamed over an alias shadows it.                                                                                                                                        |
| Commands with `AS` output, including `convert`, `trendline`, `chart`, and `graphlookup`     | Generic `AS` scan and its alias-context exclusions in `pipeline_shape.ts`                                                                                                                                          | Not every `AS` creates a field: casts and table/source aliases must remain excluded. A new non-field `AS` context can pollute known fields and hide a real diagnostic.                                                                                                                       |
| `fields` / `table` and other projections                                                    | Order classification and field validation's known-field model                                                                                                                                                      | The model registers additions but does not subtract dropped fields. A downstream reference to a removed field can therefore be missed unless destructive projection is modeled explicitly.                                                                                                   |
| `grok`, `parse`, `rex`                                                                      | Capture-name extraction in `pipeline_shape.ts`, `pattern_literal.ts`, `rex_scan_cost.ts`, field-slot handling, and `invalid_capture_group_name.ts`                                                                 | Their grammar shapes differ. The pattern is selected as the last string literal for `grok`/`parse`; `rex` nests it under `rexExpr`. `grok` uses a different capture dialect, and `rex mode=sed` must not be treated as named-group extraction.                                               |
| `grok`, `parse`, `patterns` field slots                                                     | `SHAPE_DOC_URL`, `SHAPE_COMMAND_KEYWORD`, `field_slot_shape_text.ts`, and `field_slot_grammar_guard.test.ts`                                                                                                       | The compiled-text fallback recognizes only these commands and must remain quote/comment/pipe aware. Adding a fourth grammar slot without updating the guard leaves valid syntax misdiagnosed on the compiled surface.                                                                        |
| `patterns`                                                                                  | Created-field handling and field-slot handling                                                                                                                                                                     | Engine versions disagree: the model registers explicit `NEW_FIELD`, `patterns_field`, and companion `tokens` as a conservative union. Recheck all three against each supported engine before narrowing the set.                                                                              |
| `spath`                                                                                     | `spathParameter` handling in `collectCreatedFields`                                                                                                                                                                | `OUTPUT` names the created field; without it, the indexable path supplies the name. `INPUT` is a source reference and must still be validated. Quoted and backtick names normalize differently.                                                                                              |
| `addtotals` / `addcoltotals`                                                                | Totals handling in `collectCreatedFields` and order classification                                                                                                                                                 | `FIELDNAME` is not an `AS` alias. The hardcoded default is `Total`. `addtotals` preserves order, while `addcoltotals` appends a summary row and invalidates it.                                                                                                                              |
| `lookup`, `append`, `appendcol`, `appendpipe`, `foreach`, subsearches, and `union` datasets | `collectAlternateSourceSubtrees` and explain `BRANCHED_COMMANDS`                                                                                                                                                   | Outer field metadata must not enter nested sources, and nested `sort` must not satisfy an outer `head`. `append` is pruned only when it contains a search source. Whole-command pruning can also hide fields exported to the outer pipeline.                                                 |
| `graphlookup`                                                                               | Order classification, generic `AS` output, alternate-source policy, and explain `BRANCHED_COMMANDS`                                                                                                                | It is deliberately not pruned because its `AS` output is an outer-pipeline column, but it is also not currently marked as an explain branch. Review both output-field visibility and unsafe attribution before changing it.                                                                  |
| `join`                                                                                      | Alternate/branch handling, table-alias exclusions, join-alias collection, and `disabled_join_type.ts`                                                                                                              | Side aliases are table qualifiers, not created fields. Join option shapes differ between SQL-like and `type=` syntax. Cluster settings can suppress the rule.                                                                                                                                |
| `union` / `multisearch`                                                                     | Dedicated minimum-input rules, initial-position parent checks, alternate-source handling, and runtime-only gates                                                                                                   | `union` is legal in more than one grammar position and is runtime-only. A fragment or pipe-first parse without a provable parent must fail closed.                                                                                                                                           |
| `replace`                                                                                   | `replace_wildcard_asymmetry.ts` and order classification                                                                                                                                                           | The detector navigates `replacePair`; a grammar rename silently disables it. Replacement and target wildcard semantics are intentionally asymmetric.                                                                                                                                         |
| New expression-bearing commands                                                             | `field_validation.ts`, `division_by_zero.ts`, `type_mismatch_numeric.ts`, `flat_object_subfield.ts`, and `enabled_false_object.ts`                                                                                 | Generic `fieldExpression` walking usually provides coverage, but new source/name slots may need exclusion. Type-aware rules must self-suppress when metadata or a verified operator/type contract is absent.                                                                                 |
| New extraction, join, window, or wildcard variants                                          | The corresponding detector's command/rule arrays and version gates                                                                                                                                                 | Similar syntax is not proof of identical engine behavior. Add the variant only after checking dialect, execution engine, minimum version, and false-positive behavior.                                                                                                                       |
| Backend-only commands                                                                       | Runtime grammar deserialization/cache, `runtime_lint.ts`, catalog `runtimeOnly`, and compiled fallback behavior                                                                                                    | Runtime parsing can start working automatically while pipeline semantics and compiled lint remain unaware of the command. Test through the production runtime bundle path; a direct detector test can pass vacuously.                                                                        |
| Command suggestions and completion                                                          | Grammar ATN, `command_suggestion.ts`, `ppl_documentation.ts`, runtime autocomplete's `DESCRIBE`/`SHOW` rerun exceptions, and the simplified symbol-table parser                                                    | Piped command candidates are derived from `FIRST(commands)`, but command documentation and selected completion behavior are manual. A missing documentation-map entry yields a blank suggestion description; new field-shaping commands may leave completion's field state stale.            |

Commands with no dedicated detector or created-field branch still require the
global order classification and generic field/`AS` review. This currently
includes `fields`, `table`, `bin`, `fillnull`, `flatten`, `trendline`,
`convert`, `fieldformat`, `nomv`, `expand`, `mvexpand`, `top`, `rare`, `chart`,
`transpose`, `mvcombine`, `timewrap`, `ad`, `kmeans`, `ml`, `describe`,
`showDataSources`, and `rest`. `reverse` and `regex` also participate in
explain alias preservation.

The Data and Explore editor hosts are otherwise command-neutral. Update host
wiring only when a command requires new context or metadata; then update
serialization, worker hydration, both hosts, revalidation, stale-result
handling, and teardown together.

#### Focused command tests

Choose tests from the command's semantics. These tests belong in the command
implementation change, not in a documentation-only change:

| Change                                            | Focused suites                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Any new or renamed command                        | `command_census.test.ts` and a semantic case in `command_order_effects.test.ts`                                               |
| Creates, renames, or exports fields               | `field_validation_alt_source.test.ts`                                                                                         |
| Adds a field slot                                 | `field_slot_shape.test.ts`, `field_slot_shape_text.test.ts`, and `field_slot_grammar_guard.test.ts`                           |
| Adds a source form or alternate source            | `top_level_source.test.ts`, `source_mismatch_suppression.test.ts`, and alternate-source rule cases                            |
| Adds a source-free or search-like initial command | `get_query_with_source.test.ts`, `explain_query_preparer.test.ts`, common utility tests, and `ppl_search_interceptor.test.ts` |
| Exists only in the backend grammar                | `runtime_lint.test.ts` and `headless_ppl_lint.test.ts` using a refreshed runtime bundle                                       |
| Extends explain attribution                       | `candidates_and_probes.test.ts`, attribution snapshot/probe tests, and range-resolution tests                                 |
| Adds detector context                             | Data and Explore host lifecycle, revalidation, failure, stale-result, and teardown tests                                      |

### Handle context provenance

The host stamps metadata with dataset ID, data-source ID, and dataset type.
`buildPPLLintContext` exposes selected-dataset field metadata only when all
three match. It exposes visible index names when the data-source identity
matches because that inventory is cluster-wide.

A context-dependent detector must:

1. Check its exact collection or setting, even when `needsContext` is set.
2. Return `[]` for missing, empty, conflicting, or otherwise inconclusive data.
3. Set `sourceScoped` when it consumes selected-dataset metadata.
4. Avoid evaluating alternate-source subtrees with outer metadata.
5. Cover both a proven mismatch and the intended fail-open cases in tests.

Conflicting `esTypes` are omitted from `typeMap`; do not recover by picking one.
`sourceScoped` also fails open for missing, wildcard, multi-source, pipe-first,
or ambiguous source classifications.

## Add a deterministic fix

A diagnostic can carry:

```ts
fix: {
  title: 'Replace with "status"',
  text: 'status',
  range: replacementRange,
  expectedText: 'staus'
}
```

Omit `range` when the edit replaces the diagnostic range. Use a separate range
when the edit targets another span, such as deleting the `P` in a Python-style
regex group opener.

Only attach a fix when the rewrite is unambiguous, preserves the result set,
and cannot re-fire the same rule. For ambiguous rewrites, provide guidance in
`howToFix` and leave `fix` undefined.

Test the full round trip through marker conversion and the code-action
provider. Monaco drops custom marker fields, so `language.ts` stores fixes in a
side table keyed by marker identity. `expectedText` is used by explain probe
verification but is not a universal click-time stale-edit guard for ordinary
Monaco actions.

For a non-deterministic action, use `diagnostic_action.ts`. Contributors are
synchronous and isolated. They must validate links and inputs independently;
`aiFixable` is only a catalog signal for a contributor that has been registered
elsewhere.

## Register the settings default

Mirror the catalog entry in `PPL_LINT_RULE_DEFAULTS` in
`src/plugins/query_enhancements/server/ui_settings.ts`. Keep catalog order.
`ui_settings.test.ts` compares that list with the bundled catalog and fails on
missing, extra, or drifting defaults.

If a warning must not be downgraded to info, add its floor to `MIN_SEVERITY` in
`src/plugins/data/public/ppl_lint/lint_overrides.ts` and test the clamp.

The persisted shape is `{ mode, rules }`, but a legacy bare rules array remains
accepted. Do not remove that schema or normalization path without a saved-value
migration; the UI settings read hook drops values that fail validation.

`command-suggestion` is not a catalog rule. It controls a syntax error rewrite,
has no configurable severity, and is read separately from catalog overrides.

## Add documentation

1. Add the external URL and quality classification to
   `__tests__/__fixtures__/doc_links.snapshot.json`.
2. Add `docs/rules/<rule_id_with_underscores>.md`.
3. Use the five user-facing headings: `What it detects`, `Why it matters`,
   `Example`, `How to fix it`, and `Availability`.
4. Add `Catalog configuration` with the reviewed enabled state, severity, exact
   `message`, exact `howToFix`, and linked `docUrl`.
5. Add the developer headings `Implementation`, `Assumptions and
maintenance`, and `Tests`. Name the detector and shared helpers, explain its
   evidence and fail-closed behavior, list command/grammar/type/plan constants
   that can drift, record known limitations, and identify focused tests that
   must change with the rule.
6. Add the rule to the default-status list and rule table in the lint README.
7. Add or update the companion SQL compatibility contract when the rule belongs
   to the active or dormant static-rule corpus. Follow
   [Maintain the SQL compatibility gate](#maintain-the-sql-compatibility-gate).

The doc-link test is offline. It verifies catalog/snapshot IDs, exact URL
equality, domain and anchor shape, and explicit unpublished gaps. It does not
make network requests or prove that a page or anchor exists.

The README list/table and rule-page availability text are manual
synchronization points. Review them explicitly; do not add a prose-parity test.

## Change or retire a rule

### Change a default or severity

Update:

1. `rules_catalog.json`.
2. `PPL_LINT_RULE_DEFAULTS` in the same order.
3. `MIN_SEVERITY` and its tests if the allowed downgrade floor changes.
4. The README enabled/disabled lists and table.
5. The rule page's `Availability` and `Catalog configuration` sections.
6. Tests that rely on implicit catalog defaults. Prefer explicit overrides in
   tests whose purpose is unrelated to the shipped default.

The catalog/settings test enforces steps 1 and 2. Documentation remains manual.

### Rename a rule

A rename is a compatibility change. There is no alias or migration mechanism:
stored overrides under the old ID are silently ignored. The telemetry
dimension, marker code, detector registry key, rule documentation path, link
snapshot, severity floor, action consumers, and tests may all depend on the ID.

Prefer retaining the ID and changing user-facing `message` or `howToFix`. If a
rename is required, define the saved-setting and telemetry migration before
changing code.

### Retire a rule

Do not normally delete a rule in one change. Rule IDs survive in saved Advanced
Settings and telemetry, so retirement should be staged.

First, disable the rule by default in both `rules_catalog.json` and
`PPL_LINT_RULE_DEFAULTS`, but retain its ID, catalog entry, detector
registration, implementation, rule page, README row, link snapshot, and
behavioral tests for a compatibility window. Update its documentation to state
why it is disabled and the planned retirement policy. Existing explicit
`enabled: true` overrides will continue to work; this is normally the
backward-compatible behavior.

Default-off is not enough when a rule is unsafe to run, because a stored
override can re-enable it. In that case, add an explicit retired-rule gate or
saved-value migration and test it. Do not unregister only the detector: an
enabled catalog entry without a detector becomes an inert rule that logs a
warning on each pass.

After the compatibility window, remove the implementation only when the same
change also:

1. Defines how legacy saved entries are migrated or ignored. The current
   settings reader ignores unknown IDs but does not remove them from persisted
   JSON.
2. Permanently reserves the retired ID so a future rule cannot inherit an old
   override or telemetry series.
3. Defines how historical telemetry remains queryable across retirement.
4. Removes the catalog entry, registry registration, UI-setting default,
   severity floor, rule page, link snapshot entry, README row, detector, and
   tests that no longer describe a supported compatibility path.
5. Tests upgrades from saved settings containing the retired ID.

If there is no migration or retired-ID mechanism yet, keep the default-disabled
compatibility implementation rather than treating deletion as complete.

## Add or change context

A detector-facing field can cross both a host/analyzer boundary and a
browser/worker boundary. Update all applicable surfaces:

1. Add host-supplied fields to `LintPayloadContext`; reserve `LintRunContext`
   additions for analyzer-derived state.
2. `SerializableLintContext` when the compiled worker needs it.
3. Serialization in `packages/osd-monaco/src/ppl/language.ts`.
4. Hydration in `packages/osd-monaco/src/ppl/worker/ppl.worker.ts`.
5. `buildPPLLintContext` in the data plugin.
6. Metadata loading, cache provenance, refresh, and cleanup in both editor
   hosts.
7. Runtime and compiled product-path tests.
8. The contract and context table in the lint README.

Flatten sets and maps into structured-clone-safe arrays or objects. Do not send
HTTP clients, callbacks, or other function-bearing values to the worker.

Metadata loaders must be best-effort. The current mapping loader and visible
index loader return no usable context on failure so detectors self-suppress.
The visible-name list is capped at 5,000 to bound retained memory, worker
serialization, and per-pass matching; exceeding the cap is not a partial
sample.

## Change grammar or engine assumptions

The runtime grammar cache supports compatible engines at version 3.6 or later,
stores one active data source, and uses a 10-second request timeout. A failed
grammar fetch enters a 30-second cooldown; a later `warmUp` call can retry after
that period, but no timer initiates the retry. Version-resolution failures do
not enter the fetch-failure cooldown. The compiled grammar remains the browser
fallback.

For a grammar or engine upgrade:

1. Refresh the captured runtime grammar fixture using the repository's
   established grammar tooling.
2. Run `command_census.test.ts`; classify every added or renamed command in
   `COMMAND_ORDER_EFFECTS`.
3. Run `command_order_effects.test.ts` and update live-engine evidence when an
   order effect changes.
4. Run `field_slot_grammar_guard.test.ts` and update field-slot and exclusion
   lists deliberately.
5. Run `grammar_surface_equivalence.test.ts` and add cases for rules whose tree
   shape changed.
6. Verify runtime-only rules through `lintWithGrammar`, not only a direct
   detector call.
7. Recheck command-created fields, alternate sources, pipe-first handling, and
   exact ranges.
8. Advance `OSD_KNOWN_VERSION` only after catalog behavior is verified on the
   newer engine. Keep it at or above every catalog `minVersion`.
9. Update `appliesTo.maxVersion` when a backend fix makes a rule obsolete.

The headless API accepts a candidate `knownVersion`. External grammar CI should
pass the backend version being validated rather than relying on Dashboards'
default horizon.

## Maintain the SQL compatibility gate

The OpenSearch SQL repository owns the cross-repository
[`[Linter] PPL compatibility`](https://github.com/opensearch-project/sql/blob/main/.github/workflows/ppl-lint-multiversion-validation.yml)
workflow and
[PPL lint contracts](https://github.com/opensearch-project/sql/tree/main/integ-test/src/test/resources/ppl-lint/contracts).
The implementation is tracked in
[opensearch-project/sql#5678](https://github.com/opensearch-project/sql/pull/5678),
and the
[SQL workflow guide](https://github.com/opensearch-project/sql/blob/main/scripts/ppl-lint/README.md)
is authoritative for its commands, artifacts, and failure classes.

The workflow bootstraps OpenSearch Dashboards once as a Node dependency and
runs the production headless linter against backend observations from:

| Configuration      | Frontend grammar surface | Backend                                                           |
| ------------------ | ------------------------ | ----------------------------------------------------------------- |
| OpenSearch 2.19.6  | Compiled simplified      | Official 2.19.6 image                                             |
| Latest eligible GA | Runtime bundle           | Highest official GA version at or below the normalized SQL target |
| SQL pull request   | Runtime bundle           | Candidate grammar and backend built from the SQL pull request     |

The final `PPL compatibility` job always publishes the complete 12-rule by
three-configuration report and evidence artifacts before it enforces drift or
inconclusive cells. Pull request runs use OSD `main`; manual runs can target an
OSD fork and branch for pre-merge evidence; nightly runs also observe four
default-off static contracts as report-only cases. The two explain-backed
rules, analytics backend behavior, syntax diagnostics, discovery tooling, and
AI actions are outside the blocking matrix.

### Keep the SQL contracts synchronized

The SQL contract corpus is a second source of truth for cross-repository
compatibility, not a generated copy of the OSD tests:

- `manifest.json` must contain exactly the active enabled static rules. Its
  `defaultError` set must equal the enabled error-severity catalog rules.
  Default-off static rules may remain in `dormantContracts`; explain-backed
  rules are not currently represented.
- Each contract's `wiring` block is normalized and compared with the bundled
  catalog entry. Update it when changing the detector key, enabled state,
  severity, `runtimeOnly`, `needsContext`, `needsExplain`, `sourceScoped`, or
  `appliesTo`.
- Version-scoped expectations pin diagnostic counts, severity, exact message,
  deterministic fix behavior where applicable, and standard-backend outcomes
  for trigger and control queries. Keep old and new version ranges when backend
  behavior changes across a release boundary.
- Contract queries are sent to both sides. Do not use a pipe-first trigger when
  OSD would prepend a synthetic source and thereby change the grammar context;
  use a query-initial form that both sides evaluate identically.
- A new, enabled, disabled, renamed, or retired static rule requires a matching
  SQL manifest and contract update. A grammar-anchor, catalog-wiring,
  diagnostic, fix, context, version-scope, or backend-semantic change requires
  reviewing the existing contract even when the rule ID is unchanged.

CI never rewrites expectations from observed behavior. Update a contract only
after deciding that the OSD and backend behavior change is intentional.

### Validate a coordinated change

1. Push the OSD change to a branch that GitHub can fetch.
2. Dispatch the SQL workflow with `osd_repo` and `osd_ref` targeting that
   branch. A manual run provides pre-merge evidence but cannot satisfy SQL
   branch protection.
3. Inspect the final `PPL compatibility` summary and its drift report and
   evidence artifacts. Do not infer compatibility from an individual
   observation job.
4. Update the SQL contract, manifest, or detector as directed by the reported
   drift class. Keep OSD rule and SQL expectation changes in linked pull
   requests.
5. If the SQL change depends on the OSD change, merge OSD first. Then rerun the
   required SQL pull request workflow against OSD `main`.

For local reproduction from a SQL checkout, use
`OSD_SOURCE_PATH=/path/to/OpenSearch-Dashboards ./scripts/ppl-lint-rule-validation.sh`.
The SQL workflow guide documents reuse of artifacts and individual backend or
detector passes.

## Maintain explain-backed rules

Explain outcome detection is coupled to Calcite plan formats. It recognizes
tree and legacy text plans, pushdown tags, relation-name suffixes, and the
`opensearch_compounded_script` discriminator. When that interpretation
changes, update fixtures and increment `EXPLAIN_OUTCOME_DETECTOR_VERSION` so
probe results from the old detector are not reused.

Attribution currently supports outer-pipeline filter/`where`,
aggregation/`stats`, and `sort` candidates. Unsupported branching, alternate
sources, alias flows, or stage shapes fail closed. An incompatible serialized
snapshot change requires incrementing
`EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION`.

The execution-query preparer in query enhancements is manually coupled to the
search path. It currently has no search-request context, so it cannot reproduce
request-specific filter/time-filter skips, index overrides, or the S3
asynchronous `head` insertion. Its stable cache key also excludes the entire
injected time predicate. Changes to source insertion or quoting, filter-manager
application IDs, dashboard filters, time filters, request options, or S3
execution behavior must update the preparer and its tests in the same change.

Operational limits are deliberate: 50 cached baseline plans, 50 cached probe
plans, three ambiguous candidates, four probe requests, two concurrent probe
requests, and a two-second probe budget. Revisit tests and network-cost
assumptions when changing any limit.

## Add an editor host

A new PPL editor host must:

1. Build context with `buildPPLLintContext`.
2. Load and provenance-stamp fields, unambiguous types, disabled objects, and
   visible names as needed.
3. Attach validation and lint context to the current Monaco model.
4. Refresh and revalidate after grammar, version, Calcite setting, metadata, or
   Advanced Settings changes.
5. Clear host-owned contexts, refresh subscriptions, and hover-persistence
   hooks on model replacement and unmount. If the host owns the model lifecycle,
   dispose abandoned Monaco models; the language-layer disposal hook then
   clears its debounce timer, abort controller, generations, fixes, markers,
   and telemetry state.
6. Provide `_explain` with an execution-equivalent query. Reuse the shared
   preparer only when the host has no request-specific execution variants that
   the preparer cannot observe.
7. Cover stale async metadata, data-source switches, failures, and teardown.

## Test the rule

At minimum, test:

- A positive query that fires through the analyzer or runtime lint entry point.
- A nearby valid query that does not fire.
- Every applicability gate: version, engine, grammar surface, and required
  metadata.
- The exact diagnostic range.
- Missing grammar rules and missing context returning no findings.
- A deterministic fix's title, replacement text, range, and pipe-first remap.
- Source mismatch suppression when `sourceScoped` is set.

Prefer product-path tests that call `PPLLanguageAnalyzer.lint`, `runLint`, or
`lintWithGrammar`. A direct detector test is useful for narrow branches but
does not prove catalog and registry wiring.

Choose suites based on the changed surface:

| Change                                  | Required focused coverage                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Detector behavior                       | Rule test plus analyzer or `runLint` product path                                                                |
| Registry or catalog                     | Catalog tests and a real-registry product path                                                                   |
| Default, severity, or setting shape     | Query enhancements `ui_settings.test.ts` and data-plugin `lint_overrides.test.ts`                                |
| Context field or metadata loader        | `src/plugins/data/public/ppl_lint`, worker hydration, and both editor host tests                                 |
| Grammar navigation or runtime-only rule | Lint package, command/field-slot guards, grammar-surface equivalence, runtime lint, and headless lint            |
| Range or deterministic fix              | Range utilities, pipe-first case, marker conversion, fix registry, code action, and rule round trip              |
| Explain outcome or attribution          | Explain fixtures, outcomes, snapshot, probes, range resolver, cache, and language explain-layer tests            |
| Query preparation                       | Explain-query-preparer and search-interceptor cases for source, dashboard filters, time filter, and dataset type |
| Documentation URL                       | Catalog test and offline doc-link test; manually verify the live page and anchor                                 |
| Developer documentation                 | Formatting plus `docs:generateDevDocs`; review manual status surfaces                                            |
| Catalog wiring or static rule behavior  | Matching SQL contract and manifest; manual workflow dispatch against the OSD branch                              |

For a broad rule or integration change, run from the repository root:

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

## Review checklist

- The rule ID is unique and its persisted-setting compatibility is understood.
- Catalog and Advanced Settings defaults match; manual status docs were
  reviewed separately.
- The correct tree or explain registry contains the detector.
- The behavior is verified against the engine versions named in `appliesTo`.
- The rule fails closed when evidence is missing.
- Both grammar surfaces are covered or `runtimeOnly` is explicit.
- Nested or alternate sources are not evaluated with outer-source metadata.
- The detector uses duck-typed parse-tree helpers.
- Any shared command, created-field, field-slot, type, or plan assumption is
  updated at its owning map rather than duplicated locally.
- New context is serialized, hydrated, provenance-checked, refreshed, and
  cleaned up in every host.
- Explain changes update protocol or outcome versions when cache compatibility
  changes.
- Positive, negative, range, and applicability tests exist.
- SQL compatibility contracts and the active/dormant manifest were reviewed;
  coordinated changes have pre-merge workflow evidence.
- The rule page records the reviewed default, severity, exact message and fix
  guidance, documentation link, implementation path, shared dependencies,
  assumptions, maintenance requirements, current limitations, and focused
  tests.
- The settings default, doc-link snapshot, rule page, and README table are in
  sync.
