/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Node-safe, bundle-injected headless PPL lint API.
 *
 * This is the entry point the SQL `ppl-lint-rule-validation` GitHub Actions
 * workflow loads (by deep path, via `createRequire` from the OSD checkout root)
 * to run OSD's *production* lint detectors against the *candidate* runtime
 * grammar bundle built by a SQL pull request — without launching OSD, Monaco, a
 * browser, or an HTTP server.
 *
 * It exposes two operations, matching the design's §4.3 contract:
 *
 *   1. deserialize + validate a supplied runtime grammar bundle
 *      (`deserializeGrammarBundle` / `deserializeBundleOrThrow`); and
 *   2. lint one query with that grammar and return structured diagnostics
 *      (`lintQueryWithBundle`).
 *
 * Both operations reuse OSD's production machinery — the same ATN
 * deserialization (`ppl_grammar_deserialize`), start-rule selection and
 * pipe-first handling (`runtime_grammar_utils`), syntax-error listener
 * (`GeneralErrorListener`), runtime rule-name-to-index mapping, and `runLint`
 * with the bundled catalog + detector registry. There is deliberately no
 * simplified benchmark parser here: a divergent copy would let a real
 * detector/backend regression pass CI vacuously.
 *
 * Node-safety: every import below is Monaco-free. `@osd/monaco/ppl-lint` is the
 * engine-only subpath (no `monaco-editor`); `general_error_listerner` and
 * `cursor` pull in only `antlr4ng` / `antlr4-c3` plus type-only `@osd/monaco`
 * imports that babel erases. This module never imports `pplGrammarCache` (the
 * HTTP- and singleton-coupled browser cache) or `opensearch-dashboards/public`.
 */

import type { LintResult, LintRunContext, BundleRuleOverrides } from '@osd/monaco/ppl-lint';
import {
  runLint,
  createRuntimeRuleNameToIndex,
  PIPE_FIRST_PREFIX,
  remapPipeFirstColumns,
} from '@osd/monaco/ppl-lint';
import {
  CharStream,
  CommonTokenStream,
  LexerInterpreter,
  ParserInterpreter,
  ParserRuleContext,
} from 'antlr4ng';
import { GeneralErrorListener } from '../shared/general_error_listerner';
import { CachedGrammar, deserializeGrammarBundle } from './ppl_grammar_deserialize';
import { pickStartRuleIndex, resolveSpaceToken } from './runtime_grammar_utils';

export { deserializeGrammarBundle };
export type { CachedGrammar } from './ppl_grammar_deserialize';

/**
 * The lint context the headless API accepts. It is a subset of the engine's
 * `LintRunContext` (minus the browser-only `dataSourceId`/`sourceText` and the
 * internally-stamped `grammarSurface`/`grammarHash`) plus an optional
 * `knownVersion`.
 *
 * `knownVersion` is forwarded to `runLint` so callers can pin the "latest
 * verified engine version" to the candidate backend version under test, rather
 * than the hardcoded `OSD_KNOWN_VERSION` ('3.7.0'), which can mis-filter rules
 * near a version boundary. When omitted, `runLint` falls back to that default —
 * matching the browser path.
 */
export interface HeadlessLintContext {
  dataSourceVersion?: string;
  knownVersion?: string;
  isCalcite?: boolean;
  fields?: Set<string>;
  typeMap?: Map<string, string>;
  visibleIndices?: string[];
  disabledObjectFields?: Set<string>;
  settings?: { allJoinTypesAllowed?: boolean };
  overrides?: BundleRuleOverrides;
}

/**
 * Build a parse tree for `query` using the interpreter-backed runtime grammar.
 *
 * Shared by the browser runtime-lint fallback and the headless CI API so both
 * produce byte-identical trees. Mirrors the compiled fallback: a partial tree
 * from ANTLR error recovery is still returned (rules walk it best-effort); only
 * a thrown parse (no tree at all) yields `undefined`.
 */
export function buildRuntimeTree(
  query: string,
  grammar: CachedGrammar
): ParserRuleContext | undefined {
  const isPipeFirst = query.trimStart().startsWith('|');
  const effective = isPipeFirst ? PIPE_FIRST_PREFIX + query : query;

  const spaceToken = resolveSpaceToken(grammar);
  const startRuleIndex = isPipeFirst
    ? (grammar.startRuleIndex ?? 0)
    : pickStartRuleIndex(query, grammar);
  const errorListener = new GeneralErrorListener(spaceToken);

  const lexer = new LexerInterpreter(
    'PPL',
    grammar.vocabulary,
    grammar.lexerRuleNames,
    grammar.channelNames,
    grammar.modeNames,
    grammar.lexerATN,
    CharStream.fromString(effective)
  );
  lexer.removeErrorListeners();
  lexer.addErrorListener(errorListener);

  const tokenStream = new CommonTokenStream(lexer);
  tokenStream.fill();

  const parser = new ParserInterpreter(
    'PPL',
    grammar.vocabulary,
    grammar.parserRuleNames,
    grammar.parserATN,
    tokenStream
  );
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);
  parser.buildParseTrees = true;

  try {
    // Keep the tree even when the parse had errors. ANTLR's error recovery still
    // produces a usable (partial) tree, and the lint rules are written to walk it
    // best-effort — a semantically-valid query the runtime ATN can't fully parse
    // (e.g. `eval x = <field> + 1`, which the engine accepts) must still be
    // field-validated. This mirrors the compiled fallback path, which runs the
    // rules unconditionally on whatever `root()` returns. Only a thrown exception
    // (no tree at all) suppresses linting.
    const tree = parser.parse(startRuleIndex);
    return tree ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse `query` with the supplied runtime grammar and run the production lint
 * detectors against the resulting tree. Shared core used by both the browser
 * runtime-lint fallback (`runtime_lint.ts`) and the headless CI API below.
 *
 * Always stamps `grammarSurface: 'runtime-bundle'` so `runtimeOnly` rules
 * (multisearch/union/replace arity checks) are NOT skipped — that surface flag
 * is the anti-vacuous guard the whole validation exists to protect.
 */
export function lintWithGrammar(
  query: string,
  grammar: CachedGrammar,
  context: LintRunContext | undefined,
  knownVersion?: string
): LintResult {
  if (!query.trim()) {
    return { diagnostics: [] };
  }

  const tree = buildRuntimeTree(query, grammar);
  if (!tree) {
    return { diagnostics: [] };
  }

  // Derived before the run, not just for the column remap: the runner reads
  // `context.isPipeFirst` to classify the query's top-level source, and defaults
  // it to false. Omitting it would silently disable source-scoped suppression on
  // every pipe-first query.
  const isPipeFirst = query.trimStart().startsWith('|');

  const diagnostics = runLint(tree, {
    ruleNameToIndex: createRuntimeRuleNameToIndex(grammar.runtimeRuleNameToIndex),
    dataSourceVersion: context?.dataSourceVersion,
    knownVersion,
    context: {
      ...context,
      grammarSurface: 'runtime-bundle',
      grammarHash: grammar.grammarHash,
      isPipeFirst,
    },
  });

  return { diagnostics: isPipeFirst ? remapPipeFirstColumns(diagnostics) : diagnostics };
}

/**
 * Deserialize a runtime grammar bundle, throwing on any invalid input.
 *
 * The CI validation path has no compiled fallback: a silently-empty grammar
 * would make every detector emit zero diagnostics and let a real regression
 * pass vacuously. So — unlike the browser cache, which degrades to the compiled
 * grammar on failure — this throws a descriptive error. Prefer this over the
 * nullable `deserializeGrammarBundle` in a CI runner.
 */
export function deserializeBundleOrThrow(bundle: unknown): CachedGrammar {
  const grammar = deserializeGrammarBundle(bundle);
  if (!grammar) {
    throw new Error(
      '[ppl-lint] failed to deserialize runtime grammar bundle: bundle did not pass shape validation'
    );
  }
  return grammar;
}

/**
 * Lint one query against an already-deserialized candidate runtime grammar and
 * return structured diagnostics. This is the second headless operation the SQL
 * detector-validation job calls per test case; it asserts on
 * `ruleId`/`severity`/`range` in the returned `LintResult.diagnostics`.
 *
 * The returned diagnostics are exactly what OSD later renders in Monaco (the
 * diagnostic→marker adapter is a downstream, presentation-only step).
 */
export function lintQueryWithBundle(
  query: string,
  grammar: CachedGrammar,
  context: HeadlessLintContext = {}
): LintResult {
  const { knownVersion, ...lintContext } = context;
  return lintWithGrammar(query, grammar, lintContext, knownVersion);
}
