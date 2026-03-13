/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  KeywordSuggestion,
  AutocompleteResultBase,
} from '../../shared/types';
import { removePotentialBackticks } from '../../shared/utils';
import { SuggestionItemDetailsTags } from '../../shared/constants';
import { PPL_SUGGESTION_IMPORTANCE, SUPPORTED_NON_LITERAL_KEYWORDS } from '../constants';
import { pplGrammarCache, CachedGrammar } from '../ppl_grammar_cache';
import { findCursorTokenIndex } from '../../shared/cursor';
import { GeneralErrorListener } from '../../shared/general_error_listerner';
import { quotesRegex } from '../../shared/constants';

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

/** Sentinel for "rule not found". -1 avoids collision with 0-based rule indices. */
const INVALID_RULE_INDEX = -1;

// ─── C3 cache isolation for runtime grammars ──────────────────────────────────

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

// ─── Keyword suggestion details resolution ────────────────────────────────────

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

export function resolveKeywordSuggestionDetails(
  sk: KeywordSuggestion
): KeywordSuggestionDetails | null {
  // Prefer name-based lookup (stable across grammar versions) over ID lookup.
  if (sk.value) {
    const detailsByLiteral = _keywordDetailsByLiteral.get(sk.value.toUpperCase());
    if (detailsByLiteral) return detailsByLiteral;
  }

  if (sk.symbolicName) {
    const detailsBySymbolic = _keywordDetailsBySymbolic.get(sk.symbolicName.toUpperCase());
    if (detailsBySymbolic) return detailsBySymbolic;
  }

  // Fall back to ID lookup only when no names are available.
  if (!sk.value && !sk.symbolicName) {
    return PPL_SUGGESTION_IMPORTANCE.get(sk.id) ?? null;
  }

  return null;
}

export function resolveSupportedNonLiteralKeywordDetails(sk: KeywordSuggestion) {
  // Prefer symbolic name (stable across grammar versions) over ID.
  if (sk.symbolicName) {
    const bySymbolic = _supportedNonLiteralBySymbolic.get(sk.symbolicName.toUpperCase());
    if (bySymbolic) return bySymbolic;
  }
  return SUPPORTED_NON_LITERAL_KEYWORDS.get(sk.id);
}

export function isCommandPositionInCurrentSegment(queryTillCursor: string): boolean {
  const currentSegment = queryTillCursor.split('|').pop() ?? '';
  const trimmed = currentSegment.trimStart();
  if (!trimmed) return true;
  return !/\s/.test(trimmed);
}

export function isLikelyCommandKeyword(sk: KeywordSuggestion): boolean {
  return !!sk.value && /^[A-Z][A-Z0-9_]*$/.test(sk.value) && sk.value.length > 2;
}

export function isLikelyExpressionFunctionKeyword(sk: KeywordSuggestion): boolean {
  if (!sk.value) return false;
  if (!/^[A-Z][A-Z0-9_]*$/.test(sk.value)) return false;
  if (sk.value.length <= 2) return false;
  return !['AS', 'BY', 'ON', 'IN', 'OR', 'AND', 'NOT', 'TRUE', 'FALSE'].includes(sk.value);
}

export function isRuntimeFunctionRuleContext(
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

export function deriveKeywordFromSymbolicName(symbolicName?: string | null): string {
  if (!symbolicName) return '';
  if (!/^[A-Z][A-Z0-9_]*$/.test(symbolicName)) return '';
  if (/_STRING$/.test(symbolicName)) return '';
  // Exclude internal/structural token names that could leak as visible suggestions.
  // These are tokens without literal names whose symbolic names look word-like.
  if (
    /^(ID|WS|SPACE|EOF|ERROR_RECOGNITION|ERROR|UNRECOGNIZED|NUMBER|INTEGER|DECIMAL|DOT|COMMA|PIPE|EQUAL|NOT_EQUAL|LESS|GREATER|NOT_LESS|NOT_GREATER|LT_PRTHS|RT_PRTHS|LT_SQR_PRTHS|RT_SQR_PRTHS|STAR|PLUS|MINUS|DIV|MODULE|SINGLE_QUOTE|DOUBLE_QUOTE|BACKTICK)$/.test(
      symbolicName
    )
  ) {
    return '';
  }
  return symbolicName;
}

// Filter out delimiter/punctuation noise while keeping operator tokens.
export function isRuntimeNoisySuggestion(sk: KeywordSuggestion): boolean {
  const value = (sk.value || '').trim();
  if (!value) return false;

  const hasWordLike = /[A-Za-z0-9_]/.test(value);
  if (hasWordLike) return false;

  if (/^[(){}[\]'"`.,]+$/.test(value)) return true;

  // Keep operator-character tokens, filter everything else.
  return !/^[=!<>+*\/%&|~^\\-]+$/.test(value);
}

// ─── Grammar resolution helpers ────────────────────────────────────────────────

/**
 * Resolve the whitespace token type from the grammar.
 * Tries WHITESPACE, SPACE, and WS in order (backend vs compiled naming).
 */
export function resolveSpaceToken(grammar: CachedGrammar): number {
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
 * Filter backend ignoredTokens to keep only non-literal token IDs,
 * ensuring keywords/operators are never accidentally suppressed.
 */
export function getSafeRuntimeIgnoredTokens(grammar: CachedGrammar): Set<number> {
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

function ruleIndex(grammar: CachedGrammar, name: string): number {
  return grammar.runtimeRuleNameToIndex.get(name) ?? INVALID_RULE_INDEX;
}

function tokenTypeBySymbolic(grammar: CachedGrammar, symName: string): number {
  return grammar.runtimeSymbolicNameToTokenType.get(symName) ?? Token.INVALID_TYPE;
}

/**
 * Resolve a token type by symbolic name, with tokenDictionary fallback.
 * tokenDictionary uses friendly keys (e.g. BACKTICK_QUOTE) while symbolic
 * names use ANTLR names (e.g. BQUOTA_STRING), so we try both.
 */
function resolveToken(grammar: CachedGrammar, symbolicName: string, dictKey?: string): number {
  if (dictKey) {
    const fromDict = (grammar.tokenDictionary as any)?.[dictKey];
    if (typeof fromDict === 'number' && fromDict > Token.INVALID_TYPE) return fromDict;
  }
  return tokenTypeBySymbolic(grammar, symbolicName);
}

/**
 * Synthetic parser context for C3 completion when no parse tree is available.
 * Subclasses ParserRuleContext to override the getter-only ruleIndex.
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
 * Pick the start rule for C3/parsing based on query shape.
 * Pipe-first queries (`|...`) use `commands` (or backend-provided pipeStartRuleIndex)
 * so pipeline commands become reachable. Normal queries use the root rule.
 * `commands` is preferred over `subPipeline` because the leading `|` is stripped
 * before lexing, and `commands` expects input after the pipe.
 */
export function pickStartRuleIndex(query: string, grammar: CachedGrammar): number {
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

// ─── C3 preferred rules logic ──────────────────────────────────────────────────

/**
 * C3 preferred rules: rules we want as rule candidates instead of exploding
 * into many token candidates. Three categories:
 *
 * 1. **Leaf concepts** — field/table/function/literal rules that commands compose.
 * 2. **Noise suppression** — rules whose children expand to hundreds of keywords
 *    (e.g. `searchableKeyWord`, `keywordsCanBeId`).
 * 3. **Structural rules** — rules that control completion scope (e.g. `searchCommand`).
 *
 * Missing names are silently skipped, so this stays compatible across grammar
 * versions as long as equivalent concepts keep the same rule names. New commands
 * that reuse these leaf rules get completion support automatically; commands
 * that introduce new structural rules may need additions here.
 */
const PREFERRED_RULE_NAMES: readonly string[] = [
  // ── Leaf concepts ──
  'qualifiedName',
  'wcQualifiedName',
  'tableQualifiedName',
  'statsFunctionName',
  'renameClasue',
  'renameClause',
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

/** Build the C3 preferredRules set by resolving PREFERRED_RULE_NAMES against the runtime grammar. */
export function buildRuntimePreferredRules(grammar: CachedGrammar): Set<number> {
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
 * Determine which preferred rules to remove for a C3 rerun, mirroring the
 * compiled rerun logic but using rule names for grammar independence.
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

  // Rerun without logicalExpression when it appears via pipeline (not search start).
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

  // searchCommand: rerun to expand tokens (skip in pipe-first or DESCRIBE/SHOW context).
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

  // Rerun comparison operators when last token is an identifier, to expose pipe/comma tokens.
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
 * Generic rerun: remove any preferred rules that appeared as candidates,
 * exposing token candidates hidden behind them.
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

// ─── Runtime token-stream helpers (name-based, no compiled constants) ─────────

/**
 * Check if a token is effectively whitespace. Also matches tokens that
 * LexerInterpreter may mis-classify (e.g. ERROR_RECOGNITION for spaces).
 */
export function isEffectivelyWhitespace(token: Token, spaceToken: number): boolean {
  if (token.type === spaceToken || token.type === Token.EOF) return true;
  const text = token.text;
  return typeof text === 'string' && text.length > 0 && text.trim().length === 0;
}

export function findLastNonSpaceTokenRT(
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
  // Skip operator tokens (mirrors compiled operatorsToInclude)
  const operators = getRuntimeOperatorTokens(grammar);
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (token && !isEffectivelyWhitespace(token, spaceToken) && !operators.has(token.type)) {
      return { token, index: i };
    }
  }
  return null;
}

/**
 * Walk backward from cursor looking for the nearest pipe token. If found,
 * return the first non-space token after that pipe. If no pipe is found,
 * return the last non-space token encountered (i.e. nearest meaningful token
 * before cursor) — so callers in root queries get the context token rather
 * than null.
 */
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
export function isAtFirstArgumentPositionInSegmentRT(
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

/** Cache for runtime skip-backward token sets, keyed by grammarHash */
const _operatorTokenCache = new Map<string, Set<number>>();

/**
 * Tokens to skip when walking backward for the last semantically meaningful token.
 * Includes operators, parentheses, and structural tokens like SQUOTA_STRING.
 * The name list is curated, not dynamically grammar-adaptive.
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

// ─── Runtime result enrichment ─────────────────────────────────────────────────

/**
 * Enrich autocomplete results using runtime grammar rule/token names.
 * All lookups are by name, so this works across grammar versions without
 * coupling to compiled parser constants.
 */
export function enrichRuntimeResult(
  baseResult: AutocompleteResultBase,
  grammar: CachedGrammar,
  rules: Map<number, any>,
  tokenStream: TokenStream,
  cursorTokenIndex: number
): OpenSearchPplAutocompleteResult {
  const spaceToken = resolveSpaceToken(grammar);

  // Resolve token types and rule indices by name
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

        // After SOURCE token, suggest tables instead of columns
        const lastTokenResult = findLastNonSpaceOperatorTokenRT(
          tokenStream,
          cursorTokenIndex,
          spaceToken,
          grammar
        );
        if (lastTokenResult?.token.type === SOURCE) break;

        // In field list context: only suggest if last token is not an identifier
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

        // Skip column suggestion after identifier, unless preceded by SOURCE
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

      case 'renameClasue':
      case 'renameClause': {
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

  // When context is `FIELD =` (e.g. `rex field =`), force column suggestions.
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

// ─── Main entry point ──────────────────────────────────────────────────────────

/**
 * Try runtime grammar suggestions using cached backend grammar metadata.
 * Returns null if grammar is not cached — caller falls through to compiled grammar path.
 */
export function tryRuntimeGrammarSuggestions(
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

    // Parse (non-fatal) — C3 uses a synthetic context if parse fails.
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

    // Use synthetic context for empty pipe-first (`|`) or failed parses.
    // With actual command text, prefer the parse tree for deeper semantics.
    let c3Context: ParserRuleContext;
    const hasPipeContent = isPipeFirst && effectiveQuery.trim().length > 0;
    if (!parseTree || (isPipeFirst && !hasPipeContent)) {
      const firstToken = tokenStream.size > 0 ? tokenStream.get(0) : undefined;
      c3Context = new RuntimeCompletionContext(startRuleIndex, firstToken);
    } else {
      c3Context = parseTree;
    }

    const { tokens, rules } = core.collectCandidates(cursorTokenIndex, c3Context);

    // Rerun C3 without preferred rules that hide token candidates behind them.
    // Mirrors the compiled path's rerun loop, using rule names for grammar independence.
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

      // Merge: union follow lists so metadata like followsOpeningParen isn't lost
      second.tokens.forEach((followList, tokenType) => {
        const existing = tokens.get(tokenType);
        if (!existing) {
          tokens.set(tokenType, followList);
          return;
        }
        tokens.set(tokenType, [...new Set([...(existing ?? []), ...(followList ?? [])])]);
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
      // Skip EOF and unresolvable tokens.
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

    return enrichRuntimeResult(baseResult, grammar, rules, tokenStream, cursorTokenIndex);
  } catch {
    return null;
  }
}

export { INFERRED_RUNTIME_FUNCTION_DETAILS };
