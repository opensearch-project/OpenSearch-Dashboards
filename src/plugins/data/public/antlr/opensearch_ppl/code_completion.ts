/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { monaco } from '@osd/monaco';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import {
  LexerInterpreter,
  ParserInterpreter,
  CharStream,
  CommonTokenStream,
  ParserRuleContext,
  PredictionMode,
  Token,
  TokenStream,
} from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import {
  CursorPosition,
  OpenSearchPplAutocompleteResult,
  SourceOrTableSuggestion,
  TableContextSuggestion,
} from '../shared/types';
import {
  fetchColumnValues,
  formatAvailableFieldsToSuggestions,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
  parseQuery,
  removePotentialBackticks,
} from '../shared/utils';
import { openSearchPplAutocompleteData as simplifiedPplAutocompleteData } from './simplified_ppl_grammar/opensearch_ppl_autocomplete';
import { openSearchPplAutocompleteData as defaultPplAutocompleteData } from './default_ppl_grammar/opensearch_ppl_autocomplete';
import { getAvailableFieldsForAutocomplete } from './simplified_ppl_grammar/symbol_table_parser';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';
import {
  PPL_AGGREGATE_FUNCTIONS,
  PPL_SUGGESTION_IMPORTANCE,
  SUPPORTED_NON_LITERAL_KEYWORDS,
  KEYWORD_ITEM_KIND_MAP,
} from './constants';
import { Documentation } from './ppl_documentation';
import { getPPLQuerySnippetForSuggestions } from '../../query_snippet_suggestions/ppl/suggestions';
import { pplGrammarCache, CachedGrammar } from './ppl_grammar_cache';
import { findCursorTokenIndex } from '../shared/cursor';
import { GeneralErrorListener } from '../shared/general_error_listerner';
import { KeywordSuggestion, AutocompleteResultBase } from '../shared/types';
import { quotesRegex } from '../shared/constants';

interface KeywordSuggestionDetails {
  importance: string;
  type: string;
  isFunction: boolean;
  optionalParam?: boolean;
}

const INFERRED_RUNTIME_FUNCTION_DETAILS: KeywordSuggestionDetails = {
  importance: '92',
  type: SuggestionItemDetailsTags.Function,
  isFunction: true,
};

// ─── C3 follow-set cache isolation for runtime grammars ──────────────────────
// CodeCompletionCore.followSetsByATN caches by parser.constructor.name.
// All ParserInterpreter instances share "ParserInterpreter" as the key, so
// different runtime grammars can pollute each other. Keep one follow-set bucket
// per grammar hash and swap the active bucket before each runtime collect.
const _runtimeC3BucketsByGrammarHash = new Map<string, unknown>();
let _activeRuntimeC3GrammarHash: string | undefined;
let _activeRuntimeC3ParserKey: string | undefined;

interface C3FollowSetsCacheContainer {
  followSetsByATN?: unknown;
}

function getC3FollowSetsCache(): Map<string, unknown> | null {
  const maybeCache = ((CodeCompletionCore as unknown) as C3FollowSetsCacheContainer)
    .followSetsByATN;
  return maybeCache instanceof Map ? maybeCache : null;
}

function isolateC3CacheForRuntimeGrammar(grammarHash: string, parser: ParserInterpreter) {
  const cache = getC3FollowSetsCache();
  if (!cache) return;

  const parserKey = parser.constructor?.name ?? 'ParserInterpreter';
  if (_activeRuntimeC3GrammarHash === grammarHash && _activeRuntimeC3ParserKey === parserKey) {
    return;
  }

  if (_activeRuntimeC3GrammarHash && _activeRuntimeC3ParserKey === parserKey) {
    const activeBucket = cache.get(parserKey);
    if (activeBucket !== undefined) {
      _runtimeC3BucketsByGrammarHash.set(_activeRuntimeC3GrammarHash, activeBucket);
    }
  }

  const bucketForGrammar = _runtimeC3BucketsByGrammarHash.get(grammarHash) ?? new Map();
  cache.set(parserKey, bucketForGrammar);
  _runtimeC3BucketsByGrammarHash.set(grammarHash, bucketForGrammar);
  _activeRuntimeC3GrammarHash = grammarHash;
  _activeRuntimeC3ParserKey = parserKey;
}

const _keywordDetailsByLiteral = new Map<string, KeywordSuggestionDetails>();
const _keywordDetailsBySymbolic = new Map<string, KeywordSuggestionDetails>();
const _supportedNonLiteralBySymbolic = new Map<
  string,
  { insertText: string; label: string; sortText: string }
>();

{
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(''));
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new SimplifiedOpenSearchPPLParser(tokenStream);
  const vocabulary = parser.vocabulary;

  for (const [tokenId, details] of PPL_SUGGESTION_IMPORTANCE.entries()) {
    const literalName = vocabulary.getLiteralName(tokenId)?.replace(quotesRegex, '$1');
    if (literalName) {
      _keywordDetailsByLiteral.set(literalName.toUpperCase(), details);
    }
    const symbolicName = vocabulary.getSymbolicName(tokenId);
    if (symbolicName) {
      _keywordDetailsBySymbolic.set(symbolicName.toUpperCase(), details);
    }
  }

  for (const [tokenId, details] of SUPPORTED_NON_LITERAL_KEYWORDS.entries()) {
    const symbolicName = vocabulary.getSymbolicName(tokenId);
    if (symbolicName) {
      _supportedNonLiteralBySymbolic.set(symbolicName.toUpperCase(), details);
    }
  }
}

function resolveKeywordSuggestionDetails(sk: KeywordSuggestion): KeywordSuggestionDetails | null {
  // Runtime grammar token IDs can drift from compiled IDs. Name-based lookup
  // (literal/symbolic) is stable across grammar versions, so prefer it.
  if (sk.value) {
    const detailsByLiteral = _keywordDetailsByLiteral.get(sk.value.toUpperCase());
    if (detailsByLiteral) return detailsByLiteral;
  }

  if (sk.symbolicName) {
    const detailsBySymbolic = _keywordDetailsBySymbolic.get(sk.symbolicName.toUpperCase());
    if (detailsBySymbolic) return detailsBySymbolic;
  }

  // Keep ID lookup only as a last resort when no names are available.
  if (!sk.value && !sk.symbolicName) {
    return PPL_SUGGESTION_IMPORTANCE.get(sk.id) ?? null;
  }

  return null;
}

function resolveSupportedNonLiteralKeywordDetails(sk: KeywordSuggestion) {
  const byId = SUPPORTED_NON_LITERAL_KEYWORDS.get(sk.id);
  if (byId) return byId;
  if (!sk.symbolicName) return undefined;
  return _supportedNonLiteralBySymbolic.get(sk.symbolicName.toUpperCase());
}

function isCommandPositionInCurrentSegment(queryTillCursor: string): boolean {
  const currentSegment = queryTillCursor.split('|').pop() ?? '';
  const trimmed = currentSegment.trimStart();
  if (!trimmed) return true;
  return !/\s/.test(trimmed);
}

function isLikelyCommandKeyword(sk: KeywordSuggestion): boolean {
  return !!sk.value && /^[A-Z][A-Z0-9_]*$/.test(sk.value) && sk.value.length > 2;
}

function isLikelyExpressionFunctionKeyword(sk: KeywordSuggestion): boolean {
  if (!sk.value) return false;
  if (!/^[A-Z][A-Z0-9_]*$/.test(sk.value)) return false;
  if (sk.value.length <= 2) return false;
  return !['AS', 'BY', 'ON', 'IN', 'OR', 'AND', 'NOT', 'TRUE', 'FALSE'].includes(sk.value);
}

function isRuntimeFunctionRuleContext(
  grammar: CachedGrammar,
  rules: Map<number, unknown>
): boolean {
  for (const ruleIdx of rules.keys()) {
    const ruleName = grammar.parserRuleNames[ruleIdx];
    if (ruleName?.toLowerCase().includes('function')) {
      return true;
    }
  }
  return false;
}

function deriveKeywordFromSymbolicName(symbolicName?: string | null): string {
  if (!symbolicName) return '';
  if (!/^[A-Z][A-Z0-9_]*$/.test(symbolicName)) return '';
  if (/_STRING$/.test(symbolicName)) return '';
  if (
    /^(ID|WS|SPACE|EOF|ERROR_RECOGNITION|ERROR|UNRECOGNIZED|NUMBER|INTEGER|DECIMAL)$/.test(
      symbolicName
    )
  ) {
    return '';
  }
  return symbolicName;
}

// Generic runtime suggestion sanitation:
// Keep operator-like tokens (including single and multi-char operators), while filtering
// delimiter-like tokens and punctuation fragments that are unlikely intended user inputs
// (e.g. standalone dot/quotes/parens/brackets noise).
function isRuntimeNoisySuggestion(sk: KeywordSuggestion): boolean {
  const value = (sk.value || '').trim();
  if (!value) return false;

  const hasWordLike = /[A-Za-z0-9_]/.test(value);
  if (hasWordLike) return false;

  // Remove tokens that are just delimiter/punctuation wrappers, regardless of context.
  if (/^[(){}[\]'"`.,]+$/.test(value)) return true;

  // If this is a non-word token made of known operators, keep it.
  // This remains grammar-adaptive because it is based on character class, not fixed token names.
  return !/^[=!<>+*\/%&|~^\\-]+$/.test(value);
}

/**
 * Sentinel for "rule not found". Rule indices are 0-based (rule 0 = root),
 * so Token.INVALID_TYPE (0) would collide with root. -1 is safe here because
 * EOF (-1) is a *token type* concept, not a rule index — they live in
 * different domains and are never compared.
 */
const INVALID_RULE_INDEX = -1;

/**
 * Resolve the SPACE/WHITESPACE token type from the grammar's tokenDictionary.
 * Backend sends WHITESPACE; compiled grammar uses SPACE. Normalize here.
 * Guards against backend sending ≤0 (which could be EOF=-1 or INVALID_TYPE=0).
 */
function resolveSpaceToken(grammar: CachedGrammar): number {
  const dict = grammar.tokenDictionary as any;
  const v = dict?.WHITESPACE ?? dict?.SPACE;
  if (typeof v === 'number' && v > Token.INVALID_TYPE) return v;

  // Fallback for bundles that omit tokenDictionary or use symbolic names only.
  const WHITESPACE = tokenTypeBySymbolic(grammar, 'WHITESPACE');
  if (WHITESPACE > Token.INVALID_TYPE) return WHITESPACE;
  const SPACE = tokenTypeBySymbolic(grammar, 'SPACE');
  if (SPACE > Token.INVALID_TYPE) return SPACE;
  const WS = tokenTypeBySymbolic(grammar, 'WS');
  if (WS > Token.INVALID_TYPE) return WS;

  return Token.INVALID_TYPE;
}

/**
 * Backend is source-of-truth for ignoredTokens, but runtime safety requires
 * that literal tokens (keywords/operators) are never suppressed by mistake.
 * Keep only valid non-literal token IDs from the backend ignore list.
 */
function getSafeRuntimeIgnoredTokens(grammar: CachedGrammar): Set<number> {
  const safe = new Set<number>();
  const ignored = Array.isArray(grammar.ignoredTokens) ? grammar.ignoredTokens : [];

  for (const tokenType of ignored) {
    if (typeof tokenType !== 'number') continue;
    if (tokenType <= Token.INVALID_TYPE || tokenType === Token.EOF) continue;
    if (grammar.vocabulary.getLiteralName(tokenType)) continue;
    safe.add(tokenType);
  }

  return safe;
}

// ─── Lazy-cached name→index lookups ──────────────────────────────────────────
// runtimeRuleNameToIndex / runtimeSymbolicNameToTokenType are Maps built
// client-side in PPLGrammarCache.doFetch. But if for any reason
// the CachedGrammar comes from a code path that didn't build them (e.g.
// raw JSON), these lazy caches rebuild from the arrays / vocabulary
// directly, keyed by grammarHash so they're built at most once per grammar.

const _lazyRuleIndexCache = new Map<string, Map<string, number>>();
function ruleIndex(grammar: CachedGrammar, name: string): number {
  // Fast path: use the pre-built map if available
  if (grammar.runtimeRuleNameToIndex?.size > 0) {
    return grammar.runtimeRuleNameToIndex.get(name) ?? INVALID_RULE_INDEX;
  }
  // Lazy rebuild from parserRuleNames array
  let m = _lazyRuleIndexCache.get(grammar.grammarHash);
  if (!m) {
    m = new Map(grammar.parserRuleNames.map((n, i) => [n, i]));
    _lazyRuleIndexCache.set(grammar.grammarHash, m);
  }
  return m.get(name) ?? INVALID_RULE_INDEX;
}

const _lazyTokenTypeCache = new Map<string, Map<string, number>>();
function tokenTypeBySymbolic(grammar: CachedGrammar, symName: string): number {
  // Fast path: use the pre-built map if available
  if (grammar.runtimeSymbolicNameToTokenType?.size > 0) {
    return grammar.runtimeSymbolicNameToTokenType.get(symName) ?? Token.INVALID_TYPE;
  }
  // Lazy rebuild from vocabulary (API-safe: handle both property and method)
  let m = _lazyTokenTypeCache.get(grammar.grammarHash);
  if (!m) {
    m = new Map<string, number>();
    const vocab = grammar.vocabulary;
    const max =
      (vocab as any).maxTokenType ??
      (typeof (vocab as any).getMaxTokenType === 'function' ? (vocab as any).getMaxTokenType() : 0);
    for (let i = 0; i <= max; i++) {
      const sym = vocab.getSymbolicName(i);
      if (sym) m.set(sym, i);
    }
    _lazyTokenTypeCache.set(grammar.grammarHash, m);
  }
  return m.get(symName) ?? Token.INVALID_TYPE;
}

/**
 * Resolve a token type by symbolic name, with tokenDictionary fallback.
 * tokenDictionary uses friendly keys (e.g. BACKTICK_QUOTE), symbolic names
 * use ANTLR names (e.g. BQUOTA_STRING). We try both.
 * Guards against backend providing ≤0 values (e.g. -1 for missing tokens).
 */
function resolveToken(grammar: CachedGrammar, symbolicName: string, dictKey?: string): number {
  if (dictKey) {
    const fromDict = (grammar.tokenDictionary as any)?.[dictKey];
    if (typeof fromDict === 'number' && fromDict > Token.INVALID_TYPE) return fromDict;
  }
  return tokenTypeBySymbolic(grammar, symbolicName);
}

/**
 * Synthetic parser context used for runtime C3 completion when a parse tree
 * is unavailable/unreliable (e.g. pipe-first stripped input).
 * ParserRuleContext.ruleIndex is getter-only, so we override it in a subclass.
 */
class RuntimeCompletionContext extends ParserRuleContext {
  constructor(private readonly syntheticRuleIndex: number, startToken?: Token) {
    super(null, -1);
    if (startToken) {
      (this as any).start = startToken;
    }
  }

  public get ruleIndex(): number {
    return this.syntheticRuleIndex;
  }
}

/**
 * Pick the best start rule for C3 and parsing based on query shape.
 * - `|`-first queries (pipe-first, no source=): start from commands or subPipeline
 *   so pipeline commands (WHERE, SORT, FIELDS, etc.) become reachable candidates.
 * - Normal queries: use the grammar's default start rule (root).
 *
 * Prefers backend-provided pipeStartRuleIndex if available (future-proof:
 * backend is source of truth and knows the correct pipe-first entry for
 * its grammar version, avoiding coupling to specific rule names).
 *
 * Since the leading `|` is stripped before lexing, the selected entry rule must
 * expect input *after* the pipe. `commands` is the strip-compatible choice;
 * `subPipeline` may expect the pipe token itself, so it's a secondary fallback.
 */
function pickStartRuleIndex(query: string, grammar: CachedGrammar): number {
  const trimmed = query.trimStart();
  if (trimmed.startsWith('|')) {
    // Prefer backend-declared pipe start rule if available
    const pipeStart = grammar.pipeStartRuleIndex;
    if (typeof pipeStart === 'number' && pipeStart >= 0) return pipeStart;

    // Fallback: resolve by rule name.
    // Prefer `commands` first — it expects input after the pipe (strip-compatible).
    // `subPipeline` may expect the leading pipe token itself, so it's secondary.
    const commands = grammar.parserRuleNames.indexOf('commands');
    if (commands >= 0) return commands;
    const subPipeline = grammar.parserRuleNames.indexOf('subPipeline');
    if (subPipeline >= 0) return subPipeline;
  }
  return grammar.startRuleIndex ?? 0;
}

// ─── Name-based helpers for runtime enrichment ────────────────────────────────
// All lookups use rule/token NAMES from the grammar bundle, never compiled
// constants. This ensures the frontend works out of the box when the backend
// grammar version changes — no code changes required on the frontend.

/**
 * Preferred rule names for C3, resolved against the runtime grammar.
 *
 * These fall into three categories:
 *
 * 1. **Leaf concepts** — stable field/table/function/literal rules that new
 *    commands compose.  Adding a new PPL command that uses `qualifiedName`
 *    works automatically.
 *
 * 2. **Noise suppression** — rules whose children expand to hundreds of
 *    keyword tokens (e.g. `searchableKeyWord`, `keywordsCanBeId`).  Without
 *    these as preferred rules, C3 floods with ~400 keyword tokens instead of
 *    returning the parent rule for enrichment.
 *
 * 3. **Structural rules** — rules that control token scoping (e.g.
 *    `searchCommand` controls root vs. pipe positions).
 *
 * Each name is resolved against `grammar.parserRuleNames` at runtime; names
 * that don't exist in the current grammar version are silently skipped.
 */
const PREFERRED_RULE_NAMES: readonly string[] = [
  // ── Leaf concepts ──
  'qualifiedName',
  'wcQualifiedName',
  'tableQualifiedName',
  'statsFunctionName',
  'renameClasue',
  'stringLiteral',
  'integerLiteral',
  'decimalLiteral',
  // ── Expression rule that gates field suggestions ──
  'fieldExpression',
  // ── Noise suppression ──
  'keywordsCanBeId',
  'searchableKeyWord',
  'takeAggFunction',
  'positionFunctionName',
  'sqlLikeJoinType',
  // ── Structural rules ──
  'searchCommand',
  'comparisonOperator',
  'searchComparisonOperator',
];

/**
 * Build the C3 preferredRules set from the runtime grammar's rule names.
 * Includes stable leaf concepts plus structural rules needed for correct
 * token scoping.  New commands work automatically as long as they compose
 * existing leaf concepts (qualifiedName, etc.).
 */
function buildRuntimePreferredRules(grammar: CachedGrammar): Set<number> {
  const rules = new Set<number>();
  for (const name of PREFERRED_RULE_NAMES) {
    const idx = ruleIndex(grammar, name);
    if (idx !== INVALID_RULE_INDEX) {
      rules.add(idx);
    }
  }
  return rules;
}

/**
 * Determine which preferred rules should be removed for a C3 rerun.
 * Mirrors the compiled processVisitedRules rerun logic, but uses rule names.
 *
 * In pipe-first mode, search-oriented rules (searchCommand) are unreachable
 * from the commands entry point and should be skipped. However, command-local
 * reruns (e.g. comparisonOperator for `| where field `) are still useful and
 * should not be suppressed.
 */
function getRuntimeRerunRules(
  grammar: CachedGrammar,
  rules: Map<number, any>,
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  isPipeFirst: boolean = false
): number[] {
  const rerun: number[] = [];
  const spaceToken = resolveSpaceToken(grammar);

  const ruleLogicalExpression = ruleIndex(grammar, 'logicalExpression');
  const rulePplCommands = ruleIndex(grammar, 'pplCommands');
  const ruleSearchCommand = ruleIndex(grammar, 'searchCommand');
  const ruleSearchComparisonOperator = ruleIndex(grammar, 'searchComparisonOperator');
  const ruleComparisonOperator = ruleIndex(grammar, 'comparisonOperator');

  // Mirror compiled behavior: when logicalExpression appears via pipeline commands
  // (not via pplCommands/search start), rerun without this preferred rule so C3
  // can expose descendants like fieldExpression/qualifiedName.
  if (
    ruleLogicalExpression !== INVALID_RULE_INDEX &&
    rules.has(ruleLogicalExpression) &&
    rulePplCommands !== INVALID_RULE_INDEX
  ) {
    const logicalRule = rules.get(ruleLogicalExpression) as { ruleList?: number[] } | undefined;
    const parentRuleList = logicalRule?.ruleList ?? [];
    if (!parentRuleList.includes(rulePplCommands)) {
      rerun.push(ruleLogicalExpression);
    }
  }

  // searchCommand: rerun to expand SEARCH/SOURCE/INDEX tokens
  // (unless the context is DESCRIBE/SHOW which has its own path)
  // In pipe-first mode, searchCommand is unreachable — skip this rerun entirely.
  if (!isPipeFirst && ruleSearchCommand !== INVALID_RULE_INDEX && rules.has(ruleSearchCommand)) {
    const DESCRIBE = tokenTypeBySymbolic(grammar, 'DESCRIBE');
    const SHOW = tokenTypeBySymbolic(grammar, 'SHOW');
    const PIPE = resolveToken(grammar, 'PIPE', 'PIPE');

    const firstAfterPipe = findFirstNonSpaceTokenAfterPipeRT(
      tokenStream,
      cursorTokenIndex,
      spaceToken,
      PIPE
    );
    if (!firstAfterPipe || ![DESCRIBE, SHOW].includes(firstAfterPipe.token.type)) {
      rerun.push(ruleSearchCommand);
    }
  }

  // searchComparisonOperator / comparisonOperator: rerun when last token
  // is an identifier (expression end), to get pipe/comma suggestions.
  // This is useful in both normal and pipe-first mode (e.g. `| where field `).
  if (
    ruleSearchComparisonOperator !== INVALID_RULE_INDEX &&
    rules.has(ruleSearchComparisonOperator)
  ) {
    const ID = resolveToken(grammar, 'ID', 'ID');
    const BQUOTA = resolveToken(grammar, 'BQUOTA_STRING', 'BACKTICK_QUOTE');
    const lastToken = findLastNonSpaceTokenRT(tokenStream, cursorTokenIndex, spaceToken);
    if (lastToken && (lastToken.token.type === ID || lastToken.token.type === BQUOTA)) {
      rerun.push(ruleSearchComparisonOperator);
      if (ruleComparisonOperator !== INVALID_RULE_INDEX) rerun.push(ruleComparisonOperator);
      // Only include searchCommand parent when not in pipe-first mode
      if (!isPipeFirst) {
        rerun.push(ruleSearchCommand); // parent of searchComparison
      }
    }
  }

  return rerun;
}

/**
 * Generic rerun fallback:
 * if C3 returns preferred-rule candidates, rerun without those rules to expose
 * token candidates hidden behind them. This keeps runtime behavior robust when
 * backend grammar versions add/rename preferred rules.
 */
function getGenericPreferredRuleReruns(
  grammar: CachedGrammar,
  rules: Map<number, any>,
  preferredRules: Set<number>,
  isPipeFirst: boolean
): number[] {
  const rerun: number[] = [];
  for (const ruleIdx of rules.keys()) {
    if (!preferredRules.has(ruleIdx)) continue;
    // In pipe-first mode, never force search-entry reruns.
    if (isPipeFirst && grammar.parserRuleNames[ruleIdx] === 'searchCommand') {
      continue;
    }
    rerun.push(ruleIdx);
  }
  return rerun;
}

/**
 * Name-based enrichment of autocomplete results using runtime grammar.
 * Replaces compiled enrichAutocompleteResult — no coupling to OpenSearchPPLParser constants.
 * When the grammar adds/removes/renumbers rules or tokens, this still works because
 * all lookups are by name from the grammar bundle.
 */
function enrichRuntimeResult(
  baseResult: AutocompleteResultBase,
  grammar: CachedGrammar,
  rules: Map<number, any>,
  tokenStream: TokenStream,
  cursorTokenIndex: number
): OpenSearchPplAutocompleteResult {
  const spaceToken = resolveSpaceToken(grammar);

  // Resolve token types by name (Token.INVALID_TYPE=0 for tokens, INVALID_RULE_INDEX=-1 for rules)
  const ID = resolveToken(grammar, 'ID', 'ID');
  const SOURCE = resolveToken(grammar, 'SOURCE', 'SOURCE');
  const PIPE = resolveToken(grammar, 'PIPE', 'PIPE');
  const BQUOTA = resolveToken(grammar, 'BQUOTA_STRING', 'BACKTICK_QUOTE');
  const DQUOTA = tokenTypeBySymbolic(grammar, 'DQUOTA_STRING');
  const SQUOTA = tokenTypeBySymbolic(grammar, 'SQUOTA_STRING');
  const EQUAL = resolveToken(grammar, 'EQUAL', 'EQUAL');
  const FIELD = resolveToken(grammar, 'FIELD', 'FIELD');
  const DOT = resolveToken(grammar, 'DOT', 'DOT');
  const OPENING_BRACKET = resolveToken(grammar, 'LT_PRTHS', 'OPENING_BRACKET');
  const COMMA = resolveToken(grammar, 'COMMA', 'COMMA');

  // Resolve rule indices by name
  const ruleStatsFunction = ruleIndex(grammar, 'statsFunction');
  const ruleFieldList = ruleIndex(grammar, 'fieldList');
  const ruleWcFieldList = ruleIndex(grammar, 'wcFieldList');
  const ruleSortField = ruleIndex(grammar, 'sortField');
  const fieldRules = [ruleFieldList, ruleWcFieldList, ruleSortField].filter(
    (r) => r !== INVALID_RULE_INDEX
  );

  let suggestSourcesOrTables: OpenSearchPplAutocompleteResult['suggestSourcesOrTables'];
  let suggestAggregateFunctions = false;
  let shouldSuggestColumns = false;
  let suggestFieldsInAggregateFunction = false;
  let suggestValuesForColumn: string | undefined;
  let suggestRenameAs = false;
  let suggestSingleQuotes = false;
  let preferColumnSuggestionsOnly = false;

  const lastNonOperatorToken = findLastNonSpaceOperatorTokenRT(
    tokenStream,
    cursorTokenIndex,
    spaceToken,
    grammar
  );

  for (const [ruleId, rule] of rules) {
    const parentRuleList: number[] = rule.ruleList ?? [];
    const ruleName = grammar.parserRuleNames[ruleId];

    switch (ruleName) {
      case 'sqlLikeJoinType':
      case 'positionFunctionName':
      case 'integerLiteral':
      case 'decimalLiteral':
      case 'keywordsCanBeId':
      case 'takeAggFunction':
        break;

      case 'statsFunctionName':
        suggestAggregateFunctions = true;
        break;

      case 'comparisonOperator':
      case 'searchComparisonOperator':
      case 'searchCommand':
        // Structural stop-points — enrichment is handled by rerun logic
        break;

      case 'searchableKeyWord': {
        const isFirstArgumentPosition = isAtFirstArgumentPositionInSegmentRT(
          tokenStream,
          cursorTokenIndex,
          spaceToken,
          PIPE
        );
        if (isFirstArgumentPosition) {
          shouldSuggestColumns = true;
        }
        break;
      }

      case 'fieldExpression': {
        const lastFieldToken = findLastNonSpaceTokenRT(tokenStream, cursorTokenIndex, spaceToken);
        if (!lastFieldToken || ![ID, BQUOTA, DOT].includes(lastFieldToken.token.type)) {
          shouldSuggestColumns = true;
        }
        break;
      }

      case 'wcQualifiedName':
      case 'qualifiedName': {
        const isInStatsFunction =
          ruleStatsFunction !== INVALID_RULE_INDEX && parentRuleList.includes(ruleStatsFunction);
        if (isInStatsFunction) suggestFieldsInAggregateFunction = true;

        // Don't suggest columns when last token is SOURCE (should suggest table)
        const lastTokenResult = findLastNonSpaceOperatorTokenRT(
          tokenStream,
          cursorTokenIndex,
          spaceToken,
          grammar
        );
        if (lastTokenResult?.token.type === SOURCE) break;

        // In field list context: suggest field only if last token is not an identifier
        if (parentRuleList.some((parentRule) => fieldRules.includes(parentRule))) {
          const lastNonSpace = findLastNonSpaceTokenRT(tokenStream, cursorTokenIndex, spaceToken);
          if (
            lastNonSpace &&
            (lastNonSpace.token.type === ID || lastNonSpace.token.type === BQUOTA)
          )
            break;
          shouldSuggestColumns = true;
          break;
        }

        // When last non-operator token is an identifier (plain or backtick-quoted),
        // don't suggest columns (unless second-last is SOURCE, for "source = tablename <field>")
        if (
          lastNonOperatorToken?.token.type === ID ||
          lastNonOperatorToken?.token.type === BQUOTA
        ) {
          const secondLast = findLastNonSpaceOperatorTokenRT(
            tokenStream,
            lastNonOperatorToken.index,
            spaceToken,
            grammar
          );
          if (secondLast?.token.type !== SOURCE) break;
        }
        shouldSuggestColumns = true;
        break;
      }

      case 'tableQualifiedName': {
        const lastToken = findLastNonSpaceTokenRT(tokenStream, cursorTokenIndex, spaceToken);
        if (lastToken && ![ID, BQUOTA].includes(lastToken.token.type)) {
          suggestSourcesOrTables = SourceOrTableSuggestion.TABLES;
        }
        break;
      }

      case 'renameClasue': {
        const expressionStart = rule.startTokenIndex;
        if (expressionStart === cursorTokenIndex) {
          shouldSuggestColumns = true;
          break;
        }
        if (expressionStart + 2 === cursorTokenIndex) {
          suggestRenameAs = true;
          break;
        }
        break;
      }

      case 'stringLiteral': {
        if (cursorTokenIndex < 2) break;
        suggestSingleQuotes = true;

        let currentIndex = cursorTokenIndex - 1;
        const currentToken = currentIndex >= 0 ? tokenStream.get(currentIndex) : undefined;
        const previousToken = currentIndex > 0 ? tokenStream.get(currentIndex - 1) : undefined;
        const lastToken = currentToken?.type === spaceToken ? previousToken : currentToken;

        if (!lastToken || ![EQUAL, OPENING_BRACKET, COMMA].includes(lastToken.type)) break;

        while (currentIndex > -1) {
          const token = tokenStream.get(currentIndex);
          if (!token || token.type === PIPE || token.type === SOURCE) break;

          if (token.type === ID || token.type === BQUOTA) {
            let combinedText = removePotentialBackticks(token.text ?? '');
            let lookBehindIndex = currentIndex;
            while (lookBehindIndex > 0) {
              lookBehindIndex--;
              const prevToken = tokenStream.get(lookBehindIndex);
              if (!prevToken || prevToken.type !== DOT) break;
              lookBehindIndex--;
              if (lookBehindIndex < 0) break;
              const leftToken = tokenStream.get(lookBehindIndex);
              if (!leftToken) break;
              combinedText = `${removePotentialBackticks(leftToken.text ?? '')}.${combinedText}`;
            }
            suggestValuesForColumn = removePotentialBackticks(combinedText);
            break;
          }
          currentIndex--;
        }
        break;
      }

      default:
        // Unknown rule from a newer grammar version — no-op, doesn't break anything
        break;
    }
  }

  // Runtime fallback/context narrowing: when token context is `FIELD =`,
  // force column suggestions and suppress generic keyword/snippet noise.
  // This keeps `rex field =` focused on schema fields across grammar versions.
  const lastToken = findLastNonSpaceTokenRT(tokenStream, cursorTokenIndex, spaceToken);
  if (lastToken?.token.type === EQUAL) {
    const previousToken = findLastNonSpaceTokenRT(tokenStream, lastToken.index, spaceToken);
    if (previousToken?.token.type === FIELD) {
      shouldSuggestColumns = true;
      preferColumnSuggestionsOnly = true;
    }
  }

  // Detect quote context
  const currentToken = tokenStream?.get(cursorTokenIndex);
  const isInBackQuote = currentToken?.type === BQUOTA;
  const isInQuote = currentToken?.type === DQUOTA || currentToken?.type === SQUOTA;

  return {
    ...baseResult,
    suggestSourcesOrTables,
    suggestAggregateFunctions,
    suggestColumns: shouldSuggestColumns ? ({} as TableContextSuggestion) : undefined,
    suggestFieldsInAggregateFunction,
    suggestValuesForColumn,
    suggestRenameAs,
    suggestSingleQuotes,
    preferColumnSuggestionsOnly,
    isInQuote,
    isInBackQuote,
  };
}

// ─── Runtime token-stream helpers (name-based, no compiled constants) ─────────

/**
 * Check if a token is effectively whitespace. The runtime LexerInterpreter may
 * tokenize spaces as ERROR_RECOGNITION or other non-WHITESPACE types when mode
 * transitions don't match compiled behaviour. Checking the token text catches
 * these edge cases so skip-space helpers work consistently.
 */
function isEffectivelyWhitespace(token: Token, spaceToken: number): boolean {
  if (token.type === spaceToken || token.type === Token.EOF) return true;
  const text = token.text;
  return typeof text === 'string' && text.length > 0 && text.trim().length === 0;
}

function findLastNonSpaceTokenRT(
  tokenStream: TokenStream,
  currentIndex: number,
  spaceToken: number
): { token: Token; index: number } | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (!isEffectivelyWhitespace(token, spaceToken)) {
      return { token, index: i };
    }
  }
  return null;
}

function findLastNonSpaceOperatorTokenRT(
  tokenStream: TokenStream,
  currentIndex: number,
  spaceToken: number,
  grammar: CachedGrammar
): { token: Token; index: number } | null {
  // Build the set of operator tokens to skip (same as compiled operatorsToInclude)
  const operators = getRuntimeOperatorTokens(grammar);
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (token && !isEffectivelyWhitespace(token, spaceToken) && !operators.has(token.type)) {
      return { token, index: i };
    }
  }
  return null;
}

function findFirstNonSpaceTokenAfterPipeRT(
  tokenStream: TokenStream,
  cursorIndex: number,
  spaceToken: number,
  pipeToken: number
): { token: Token; index: number } | null {
  let firstNonSpaceToken: { token: Token; index: number } | null = null;

  for (let i = cursorIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (!token) continue;

    if (!isEffectivelyWhitespace(token, spaceToken)) {
      firstNonSpaceToken = { token, index: i };

      if (token.type === pipeToken) {
        for (let j = i + 1; j < tokenStream.size; j++) {
          const nextToken = tokenStream.get(j);
          if (!nextToken) break;
          if (!isEffectivelyWhitespace(nextToken, spaceToken)) {
            return { token: nextToken, index: j };
          }
        }
        break;
      }
    }
  }

  return firstNonSpaceToken;
}

/**
 * Returns true when the cursor is at the first argument position within the
 * current query segment (after the most recent pipe, if any).
 *
 * Example:
 * - `| where ` -> true (one non-space token in segment: `where`)
 * - `| where field` -> false
 */
function isAtFirstArgumentPositionInSegmentRT(
  tokenStream: TokenStream,
  cursorIndex: number,
  spaceToken: number,
  pipeToken: number
): boolean {
  let segmentStart = 0;
  for (let i = cursorIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (token?.type === pipeToken) {
      segmentStart = i + 1;
      break;
    }
  }

  let nonSpaceTokenCount = 0;
  for (let i = segmentStart; i < cursorIndex; i++) {
    const token = tokenStream.get(i);
    if (!token || isEffectivelyWhitespace(token, spaceToken)) continue;
    nonSpaceTokenCount++;
    if (nonSpaceTokenCount > 1) return false;
  }

  return nonSpaceTokenCount === 1;
}

/** Cache for runtime operator token sets, keyed by grammarHash */
const _operatorTokenCache = new Map<string, Set<number>>();

/**
 * Build the set of operator token type IDs that should be skipped
 * when searching for the last non-space, non-operator token.
 * Uses symbolic names from the grammar — no compiled constants.
 */
function getRuntimeOperatorTokens(grammar: CachedGrammar): Set<number> {
  const cached = _operatorTokenCache.get(grammar.grammarHash);
  if (cached) return cached;

  const names = [
    'PIPE',
    'EQUAL',
    'COMMA',
    'NOT_EQUAL',
    'LESS',
    'NOT_LESS',
    'GREATER',
    'NOT_GREATER',
    'OR',
    'AND',
    'LT_PRTHS',
    'RT_PRTHS',
    'IN',
    'SPAN',
    'MATCH',
    'MATCH_PHRASE',
    'MATCH_BOOL_PREFIX',
    'MATCH_PHRASE_PREFIX',
    'SQUOTA_STRING',
  ];
  const set = new Set<number>();
  for (const name of names) {
    const id = tokenTypeBySymbolic(grammar, name);
    if (id > Token.INVALID_TYPE) set.add(id);
  }

  _operatorTokenCache.set(grammar.grammarHash, set);
  return set;
}

/**
 * Try runtime grammar suggestions using cached backend grammar.
 * Creates LexerInterpreter/ParserInterpreter instances directly (with tokenStream.fill()),
 * bypassing createParser which doesn't handle interpreter instances correctly.
 * Returns null if grammar not cached or version unsupported — caller falls through to compiled.
 */
function tryRuntimeGrammarSuggestions(
  query: string,
  cursor: CursorPosition,
  services: any,
  indexPattern: any,
  skipSymbolicKeywords: boolean
): OpenSearchPplAutocompleteResult | null {
  try {
    const currentQuery = services?.data?.query?.queryString?.getQuery?.();
    const dataSourceId = indexPattern?.dataSourceRef?.id ?? currentQuery?.dataset?.dataSource?.id;

    const grammar = pplGrammarCache.getCachedGrammar(dataSourceId);
    if (!grammar) return null;

    // Normalize token dictionary
    const spaceToken = resolveSpaceToken(grammar);

    // Pick start rule based on query shape
    const isPipeFirst = query.trimStart().startsWith('|');
    const startRuleIndex = pickStartRuleIndex(query, grammar);

    // Pipe-first: strip leading pipe so token stream matches start rule
    let effectiveQuery = query;
    let effectiveCursor = cursor;

    if (isPipeFirst) {
      const pipePos = query.indexOf('|');
      effectiveQuery = query.substring(pipePos + 1);
      const strippedPrefix = query.substring(0, pipePos + 1);
      const prefixLines = strippedPrefix.split(/\r\n|\n|\r/);
      const numStrippedNewlines = prefixLines.length - 1;
      const lastPrefixLineLen = prefixLines[prefixLines.length - 1].length;

      effectiveCursor = {
        line: Math.max(1, cursor.line - numStrippedNewlines),
        column:
          cursor.line === numStrippedNewlines + 1
            ? Math.max(1, cursor.column - lastPrefixLineLen)
            : cursor.column,
      };
    }

    // Create lexer + parser
    const lexer = new LexerInterpreter(
      'PPL',
      grammar.vocabulary,
      grammar.lexerRuleNames,
      grammar.channelNames,
      grammar.modeNames,
      grammar.lexerATN,
      CharStream.fromString(effectiveQuery)
    );

    const tokenStream = new CommonTokenStream(lexer);
    tokenStream.fill();

    const parser = new ParserInterpreter(
      'PPL',
      grammar.vocabulary,
      grammar.parserRuleNames,
      grammar.parserATN,
      tokenStream
    );

    parser.interpreter.predictionMode = PredictionMode.SLL;

    // Parse using the selected start rule (non-fatal)
    // ParserInterpreter can throw on malformed/partial inputs.
    // Completion should still work even if parse fails — C3 can use a
    // synthetic context when no parse tree is available.
    const errorListener = new GeneralErrorListener(spaceToken);
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);
    parser.buildParseTrees = true;
    let parseTree: ParserRuleContext | undefined;
    try {
      parseTree = parser.parse(startRuleIndex);
    } catch {
      // Parse failed — keep errors from listener, continue with completion
    }

    // Collect C3 candidates
    const core = new CodeCompletionCore(parser);
    core.ignoredTokens = getSafeRuntimeIgnoredTokens(grammar);
    core.preferredRules = buildRuntimePreferredRules(grammar);
    const cursorTokenIndex = findCursorTokenIndex(tokenStream, effectiveCursor, spaceToken);
    if (cursorTokenIndex === undefined) return null;

    // Switch C3 follow-set cache bucket to the current runtime grammar.
    isolateC3CacheForRuntimeGrammar(grammar.grammarHash, parser);

    // For empty pipe-first (`|`) use a synthetic context anchored at the
    // selected start rule so command discovery is not constrained by an empty
    // recovery parse tree. Once there is actual command text after the pipe,
    // prefer parse-tree context to preserve deep command semantics
    // (e.g. `| rex field =` expecting a field/qualifiedName).
    let c3Context: ParserRuleContext;
    const hasPipeContent = isPipeFirst && effectiveQuery.trim().length > 0;
    if (!parseTree || (isPipeFirst && !hasPipeContent)) {
      const firstToken = tokenStream.size > 0 ? tokenStream.get(0) : undefined;
      c3Context = new RuntimeCompletionContext(startRuleIndex, firstToken);
    } else {
      c3Context = parseTree;
    }

    const { tokens, rules } = core.collectCandidates(cursorTokenIndex, c3Context);

    // Rerun without preferred rules that hide tokens
    // When a preferred rule appears at the cursor, C3 returns it as a rule
    // candidate and does NOT return the tokens inside it. The compiled path
    // handles this via processVisitedRules + parseQuery's rerun loop.
    // Here we replicate the logic generically using rule names from the grammar.
    // For pipe-first mode, only search-oriented reruns (searchCommand) are
    // suppressed; command-local reruns still apply (e.g. comparisonOperator).
    const rerunRules = getRuntimeRerunRules(
      grammar,
      rules,
      tokenStream,
      cursorTokenIndex,
      isPipeFirst
    );
    const genericReruns = getGenericPreferredRuleReruns(
      grammar,
      rules,
      core.preferredRules,
      isPipeFirst
    );
    for (const ruleIdx of genericReruns) {
      if (!rerunRules.includes(ruleIdx)) rerunRules.push(ruleIdx);
    }
    if (rerunRules.length > 0) {
      const rerunPreferred = new Set(core.preferredRules);
      for (const ruleIdx of rerunRules) rerunPreferred.delete(ruleIdx);

      const savedPreferred = core.preferredRules;
      core.preferredRules = rerunPreferred;

      const second = core.collectCandidates(cursorTokenIndex, c3Context);

      // Merge: add tokens/rules from second pass that first pass didn't have
      second.tokens.forEach((followList, tokenType) => {
        if (!tokens.has(tokenType)) tokens.set(tokenType, followList);
      });
      second.rules.forEach((ruleData, ruleIdx) => {
        if (!rules.has(ruleIdx)) rules.set(ruleIdx, ruleData);
      });

      core.preferredRules = savedPreferred;
    }

    // ─── Build keyword suggestions from token candidates ──────────────────
    const suggestKeywords: KeywordSuggestion[] = [];
    const inRuntimeFunctionContext = isRuntimeFunctionRuleContext(grammar, rules);
    const openingParenToken = tokenTypeBySymbolic(grammar, 'LT_PRTHS');
    tokens.forEach((followingTokens, tokenType) => {
      // Skip EOF and junk tokens where vocab can't resolve the ID.
      if (tokenType === Token.EOF) return;
      const literalName = parser.vocabulary.getLiteralName(tokenType)?.replace(quotesRegex, '$1');
      const symbolicName = parser.vocabulary.getSymbolicName(tokenType);
      if (!literalName && !symbolicName) return;
      const candidate: KeywordSuggestion = {
        value: literalName || '',
        symbolicName: (!skipSymbolicKeywords && symbolicName) || '',
        followsOpeningParen:
          openingParenToken > Token.INVALID_TYPE &&
          Array.isArray(followingTokens) &&
          followingTokens.includes(openingParenToken),
        inRuntimeFunctionContext,
        id: tokenType,
      };

      const fallbackValue = deriveKeywordFromSymbolicName(symbolicName);
      candidate.value = candidate.value || fallbackValue;
      if (!candidate.value) return;
      if (isRuntimeNoisySuggestion({ ...candidate, symbolicName: symbolicName ?? undefined })) {
        return;
      }

      suggestKeywords.push(candidate);
    });

    const baseResult: AutocompleteResultBase = {
      errors: errorListener.errors,
      suggestKeywords,
    };

    // ─── Name-based enrichment (no compiled grammar coupling) ─────────────
    return enrichRuntimeResult(baseResult, grammar, rules, tokenStream, cursorTokenIndex);
  } catch {
    return null;
  }
}

// Utility function to extract query text up to cursor position
const extractQueryTillCursor = (
  fullQuery: string,
  cursorPosition: { lineNumber: number; column: number }
) => {
  const lines = fullQuery.split('\n');

  // Get all lines before the cursor line
  const linesBefore = lines.slice(0, cursorPosition.lineNumber - 1);

  // Get the current line up to cursor position
  const currentLine = lines[cursorPosition.lineNumber - 1] || '';
  const currentLineUpToCursor = currentLine.slice(0, cursorPosition.column - 1);

  // Combine all text up to cursor
  return [...linesBefore, currentLineUpToCursor].join('\n');
};
// Centralized function to generate appropriate insertion text based on context
function getInsertText(
  text: string,
  type: 'field' | 'value' | 'keyword' | 'function' | 'table',
  plainInsert: boolean = false,
  options: {
    needsBackticks?: boolean;
    isStringValue?: boolean;
    hasOptionalParam?: boolean;
    isSnippet?: boolean;
  } = {}
): string {
  const {
    needsBackticks = false,
    isStringValue = false,
    hasOptionalParam = false,
    isSnippet = false,
  } = options;

  if (plainInsert) {
    return text;
  } else {
    // Normal behavior when not in quotes
    switch (type) {
      case 'field':
        return needsBackticks ? `\`${text}\` ` : `${text} `;
      case 'value':
        return isStringValue ? `"${text}" ` : `${text} `;
      case 'keyword':
        return `${text} `;
      case 'function':
        if (isSnippet) {
          return hasOptionalParam ? `${text}() $0` : `${text}($0)`;
        }
        return `${text}()`;
      case 'table':
        return `${text} `;
      default:
        return `${text} `;
    }
  }
}

function hasActionableContent(result: AutocompleteResultBase): boolean {
  if (result.suggestKeywords && result.suggestKeywords.length > 0) return true;
  const r = result as OpenSearchPplAutocompleteResult;
  return !!(
    r.suggestColumns ||
    r.suggestSourcesOrTables ||
    r.suggestValuesForColumn ||
    r.suggestAggregateFunctions ||
    r.suggestRenameAs
  );
}

export const getDefaultSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs) => {
  if (!services || !services.appName || !indexPattern) return [];

  try {
    const { lineNumber, column } = position || {};
    const cursor: CursorPosition = {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    };

    const runtimeResult = tryRuntimeGrammarSuggestions(query, cursor, services, indexPattern, true);
    // Fall back to compiled grammar when the runtime path returns an empty result.
    // A non-null but empty result would suppress the compiled grammar otherwise.
    const suggestions =
      runtimeResult && hasActionableContent(runtimeResult)
        ? runtimeResult
        : getDefaultOpenSearchPplAutoCompleteSuggestions(query, cursor);

    const finalSuggestions: QuerySuggestion[] = [];

    if (suggestions.suggestColumns) {
      finalSuggestions.push(...formatFieldsToSuggestions(indexPattern, (f: any) => `${f} `, '3'));
    }

    if (suggestions.suggestValuesForColumn) {
      finalSuggestions.push(
        ...formatValuesToSuggestions(
          await fetchColumnValues(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern,
            datasetType
          ).catch(() => []),
          (val: any) => (typeof val === 'string' ? `"${val}" ` : `${val} `)
        )
      );
    }

    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...Object.entries(PPL_AGGREGATE_FUNCTIONS).map(([af]) => ({
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Function,
          insertText: af + ' ',
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    if (suggestions.suggestSourcesOrTables) {
      finalSuggestions.push({
        text: indexPattern.title,
        type: monaco.languages.CompletionItemKind.Struct,
        insertText: `${indexPattern.title} `,
        detail: SuggestionItemDetailsTags.Table,
      });
    }

    if (suggestions.suggestRenameAs) {
      finalSuggestions.push({
        text: 'as',
        insertText: 'as ',
        type: monaco.languages.CompletionItemKind.Keyword,
        detail: SuggestionItemDetailsTags.Keyword,
      });
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value.toLowerCase(),
          insertText: `${sk.value.toLowerCase()} `,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: SuggestionItemDetailsTags.Keyword,
          // sortText is the only option to sort suggestions, compares strings
          sortText:
            PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '9' + sk.value.toLowerCase(), // '9' used to devalue every other suggestion
        }))
      );
    }

    return finalSuggestions;
  } catch (e) {
    return [];
  }
};

export const getSimplifiedPPLSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs) => {
  if (!services || !services.appName || !indexPattern) return [];

  try {
    const { lineNumber, column } = position || {};
    const cursor: CursorPosition = {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    };

    const runtimeSuggestions = tryRuntimeGrammarSuggestions(
      query,
      cursor,
      services,
      indexPattern,
      false
    );
    const suggestions =
      runtimeSuggestions || getSimplifiedOpenSearchPplAutoCompleteSuggestions(query, cursor);
    const finalSuggestions: QuerySuggestion[] = [];
    const queryTillCursor =
      position && position.lineNumber && position.column
        ? extractQueryTillCursor(query, {
            lineNumber: position.lineNumber,
            column: position.column,
          })
        : query.slice(0, selectionEnd);
    const isCommandPosition = isCommandPositionInCurrentSegment(queryTillCursor);
    const isInQuotes = suggestions.isInQuote || false;
    const isInBackQuote = suggestions.isInBackQuote || false;
    const isRuntimeGrammar = Boolean(runtimeSuggestions);
    const isRexFieldEqualsContext =
      isRuntimeGrammar && /(?:^|\|)\s*rex\s+field\s*=\s*$/i.test(queryTillCursor);
    const preferColumnSuggestionsOnly =
      suggestions.preferColumnSuggestionsOnly === true || isRexFieldEqualsContext;
    const shouldSuggestColumns = Boolean(suggestions.suggestColumns || isRexFieldEqualsContext);

    if (shouldSuggestColumns && (isInBackQuote || !isInQuotes)) {
      const initialFields = indexPattern.fields;

      // Use absolute query length up to cursor (line/column safe for multiline).
      const cursorPosition = queryTillCursor.length;
      const fieldFilter = preferColumnSuggestionsOnly
        ? undefined
        : (field: { subType?: unknown }) => !field?.subType;
      const availableFields = getAvailableFieldsForAutocomplete(
        query,
        cursorPosition,
        initialFields,
        fieldFilter
      );

      finalSuggestions.push(
        ...formatAvailableFieldsToSuggestions(
          availableFields,
          (f: string) => {
            if (suggestions.suggestFieldsInAggregateFunction) {
              return getInsertText(f, 'field', true);
            }
            const needsBackticks = f.includes('.') || f.includes('@');
            return getInsertText(f, 'field', isInBackQuote, { needsBackticks });
          },
          (f: string) => {
            return f.startsWith('_') ? `99` : `3`; // This devalues all the Field Names that start _ so that appear further down the autosuggest wizard
          }
        )
      );
    }

    if (suggestions.suggestValuesForColumn && (isInQuotes || !isInBackQuote)) {
      finalSuggestions.push(
        ...formatValuesToSuggestions(
          await fetchColumnValues(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern,
            datasetType
          ).catch(() => []),
          (val: any) => {
            const isStringValue = typeof val === 'string';
            return getInsertText(val?.toString() || '', 'value', isInQuotes, { isStringValue });
          }
        )
      );
    }

    if (preferColumnSuggestionsOnly) {
      return finalSuggestions;
    }

    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...Object.entries(PPL_AGGREGATE_FUNCTIONS).map(([af, prop]) => ({
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Module,
          insertText: getInsertText(af, 'function', isInQuotes, {
            hasOptionalParam: prop?.optionalParam,
            isSnippet: true,
          }),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
          sortText: '67',
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    if (suggestions.suggestSourcesOrTables) {
      finalSuggestions.push({
        text: indexPattern.title,
        type: monaco.languages.CompletionItemKind.Struct,
        insertText: getInsertText(indexPattern.title, 'table', isInQuotes),
        detail: SuggestionItemDetailsTags.Table,
      });
    }

    if (suggestions.suggestRenameAs) {
      finalSuggestions.push({
        text: 'as',
        insertText: getInsertText('as', 'keyword', isInQuotes),
        type: monaco.languages.CompletionItemKind.Keyword,
        detail: SuggestionItemDetailsTags.Keyword,
      });
    }

    // Handle single quote suggestions when suggestSingleQuotes flag is set
    if (suggestions.suggestSingleQuotes) {
      const singleQuoteDetails = SUPPORTED_NON_LITERAL_KEYWORDS.get(
        SimplifiedOpenSearchPPLLexer.SQUOTA_STRING
      );
      if (singleQuoteDetails) {
        finalSuggestions.push({
          text: singleQuoteDetails.label,
          insertText: singleQuoteDetails.insertText,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: SuggestionItemDetailsTags.Keyword,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
          sortText: singleQuoteDetails.sortText,
        });
      }
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      const literalKeywords = suggestions.suggestKeywords.filter((sk) => sk.value);
      finalSuggestions.push(
        ...literalKeywords.map((sk) => {
          const keywordDetails = resolveKeywordSuggestionDetails(sk);
          const inferredFunctionDetails =
            !keywordDetails &&
            isRuntimeGrammar &&
            !isCommandPosition &&
            (sk.followsOpeningParen ||
              sk.inRuntimeFunctionContext ||
              isLikelyExpressionFunctionKeyword(sk))
              ? INFERRED_RUNTIME_FUNCTION_DETAILS
              : null;
          const functionDetails = keywordDetails?.isFunction
            ? keywordDetails
            : inferredFunctionDetails;
          const shouldTreatAsCommand =
            !keywordDetails && isCommandPosition && isLikelyCommandKeyword(sk);
          if (functionDetails) {
            const functionName = sk.value;
            return {
              text: `${functionName}()`,
              type:
                KEYWORD_ITEM_KIND_MAP.get(functionDetails.type) ??
                monaco.languages.CompletionItemKind.Function,
              insertText: getInsertText(functionName, 'function', isInQuotes, {
                hasOptionalParam: functionDetails?.optionalParam,
                isSnippet: true,
              }),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
              detail: functionDetails.type,
              sortText: functionDetails.importance,
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          } else if (keywordDetails && !keywordDetails.isFunction) {
            return {
              text: sk.value,
              type:
                KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
                monaco.languages.CompletionItemKind.Keyword,
              insertText: getInsertText(sk.value, 'keyword', isInQuotes),
              detail: keywordDetails.type,
              sortText: keywordDetails.importance,
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          } else if (shouldTreatAsCommand) {
            return {
              text: sk.value,
              type:
                KEYWORD_ITEM_KIND_MAP.get(SuggestionItemDetailsTags.Command) ??
                monaco.languages.CompletionItemKind.Function,
              insertText: getInsertText(sk.value, 'keyword', isInQuotes),
              detail: SuggestionItemDetailsTags.Command,
              sortText: '98' + sk.value,
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          } else {
            return {
              text: sk.value,
              insertText: getInsertText(sk.value, 'keyword', isInQuotes),
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: SuggestionItemDetailsTags.Keyword,
              // sortText is the only option to sort suggestions, compares strings
              sortText: PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '98' + sk.value, // '98' used to devalue every other suggestion
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          }
        })
      );

      const supportedSymbolicKeywords = suggestions.suggestKeywords
        .filter((sk) => !sk.value)
        .map((sk) => resolveSupportedNonLiteralKeywordDetails(sk))
        .filter((details): details is { insertText: string; label: string; sortText: string } =>
          Boolean(details)
        );

      if (supportedSymbolicKeywords.length > 0) {
        finalSuggestions.push(
          ...supportedSymbolicKeywords.map((details) => {
            return {
              text: details.label,
              insertText: details.insertText,
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: SuggestionItemDetailsTags.Keyword,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
              // sortText is the only option to sort suggestions, compares strings
              sortText: details.sortText,
            };
          })
        );
      }
    }

    const querySnippetSuggestions = await getPPLQuerySnippetForSuggestions(queryTillCursor);

    return [...finalSuggestions, ...querySnippetSuggestions];
  } catch (e) {
    return [];
  }
};

export const getDefaultOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchPplAutocompleteResult => {
  return parseQuery({
    Lexer: defaultPplAutocompleteData.Lexer,
    Parser: defaultPplAutocompleteData.Parser,
    tokenDictionary: defaultPplAutocompleteData.tokenDictionary,
    ignoredTokens: defaultPplAutocompleteData.ignoredTokens,
    rulesToVisit: defaultPplAutocompleteData.rulesToVisit,
    getParseTree: defaultPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: defaultPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};

export const getSimplifiedOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchPplAutocompleteResult => {
  return parseQuery({
    Lexer: simplifiedPplAutocompleteData.Lexer,
    Parser: simplifiedPplAutocompleteData.Parser,
    tokenDictionary: simplifiedPplAutocompleteData.tokenDictionary,
    ignoredTokens: simplifiedPplAutocompleteData.ignoredTokens,
    rulesToVisit: simplifiedPplAutocompleteData.rulesToVisit,
    getParseTree: simplifiedPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: simplifiedPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
    skipSymbolicKeywords: false,
  });
};
