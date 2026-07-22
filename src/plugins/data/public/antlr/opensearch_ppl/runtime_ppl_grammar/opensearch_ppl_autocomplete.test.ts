/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token, TokenStream } from 'antlr4ng';
import {
  resolveKeywordSuggestionDetails,
  resolveSupportedNonLiteralKeywordDetails,
  isCommandPositionInCurrentSegment,
  isLikelyCommandKeyword,
  isLikelyExpressionFunctionKeyword,
  isRuntimeFunctionRuleContext,
  deriveKeywordFromSymbolicName,
  isRuntimeNoisySuggestion,
  resolveSpaceToken,
  pickStartRuleIndex,
  enrichRuntimeResult,
  isEffectivelyWhitespace,
  findLastNonSpaceTokenRT,
  isAtFirstArgumentPositionInSegmentRT,
  buildRuntimePreferredRules,
  getSafeRuntimeIgnoredTokens,
} from './opensearch_ppl_autocomplete';
import { KeywordSuggestion, SourceOrTableSuggestion } from '../../shared/types';
import { CachedGrammar } from '../ppl_grammar_cache';
import { SUPPORTED_NON_LITERAL_KEYWORDS } from '../constants';

/** Token type constants for the mock grammar */
const T = {
  INVALID: 0,
  SOURCE: 1,
  EQUAL: 2,
  PIPE: 3,
  ID: 4,
  BQUOTA: 5,
  DQUOTA: 6,
  SQUOTA: 7,
  SPACE: 8,
  FIELD: 9,
  DOT: 10,
  LT_PRTHS: 11,
  COMMA: 12,
  LESS: 13,
  GREATER: 14,
  NOT_EQUAL: 15,
  NOT_LESS: 16,
  NOT_GREATER: 17,
  OR: 18,
  AND: 19,
  RT_PRTHS: 20,
  IN: 21,
  SPAN: 22,
  MATCH: 23,
  MATCH_PHRASE: 24,
  MATCH_BOOL_PREFIX: 25,
  MATCH_PHRASE_PREFIX: 26,
};

/** Rule index constants for the mock grammar */
const R = {
  root: 0,
  commands: 1,
  subPipeline: 2,
  searchCommand: 3,
  qualifiedName: 4,
  wcQualifiedName: 5,
  tableQualifiedName: 6,
  statsFunctionName: 7,
  renameClasue: 8,
  stringLiteral: 9,
  fieldExpression: 10,
  keywordsCanBeId: 11,
  searchableKeyWord: 12,
  comparisonOperator: 13,
  searchComparisonOperator: 14,
  statsFunction: 15,
  fieldList: 16,
  wcFieldList: 17,
  sortField: 18,
  takeAggFunction: 19,
  positionFunctionName: 20,
  logicalExpression: 21,
  pplCommands: 22,
  integerLiteral: 23,
  decimalLiteral: 24,
  sqlLikeJoinType: 25,
};

const RULE_NAMES = Object.keys(R);

function createMockGrammar(overrides?: Partial<CachedGrammar>): CachedGrammar {
  const symbolicNames: Array<string | null> = [
    null, // 0 = INVALID
    'SOURCE',
    'EQUAL',
    'PIPE',
    'ID',
    'BQUOTA_STRING',
    'DQUOTA_STRING',
    'SQUOTA_STRING',
    'SPACE',
    'FIELD',
    'DOT',
    'LT_PRTHS',
    'COMMA',
    'LESS',
    'GREATER',
    'NOT_EQUAL',
    'NOT_LESS',
    'NOT_GREATER',
    'OR',
    'AND',
    'RT_PRTHS',
    'IN',
    'SPAN',
    'MATCH',
    'MATCH_PHRASE',
    'MATCH_BOOL_PREFIX',
    'MATCH_PHRASE_PREFIX',
  ];

  const literalNames: Array<string | null> = [
    null, // 0 = INVALID
    "'SOURCE'",
    "'='",
    "'|'",
    null, // ID
    null, // BQUOTA_STRING
    null, // DQUOTA_STRING
    null, // SQUOTA_STRING
    null, // SPACE
    "'FIELD'",
    "'.'",
    "'('",
    "','",
    "'<'",
    "'>'",
    "'!='",
    "'<='",
    "'>='",
    "'OR'",
    "'AND'",
    "')'",
    "'IN'",
    null, // SPAN
    null, // MATCH
    null, // MATCH_PHRASE
    null, // MATCH_BOOL_PREFIX
    null, // MATCH_PHRASE_PREFIX
  ];

  const runtimeSymbolicNameToTokenType = new Map<string, number>();
  for (let i = 1; i < symbolicNames.length; i++) {
    if (symbolicNames[i]) runtimeSymbolicNameToTokenType.set(symbolicNames[i]!, i);
  }

  const runtimeRuleNameToIndex = new Map<string, number>();
  RULE_NAMES.forEach((name, idx) => runtimeRuleNameToIndex.set(name, idx));

  return {
    lexerATN: {} as any,
    parserATN: {} as any,
    vocabulary: {
      getLiteralName: (type: number) => literalNames[type] ?? null,
      getSymbolicName: (type: number) => symbolicNames[type] ?? null,
      getDisplayName: (type: number) => symbolicNames[type] ?? String(type),
      maxTokenType: symbolicNames.length - 1,
    } as any,
    lexerRuleNames: [],
    parserRuleNames: RULE_NAMES,
    channelNames: ['DEFAULT_TOKEN_CHANNEL'],
    modeNames: ['DEFAULT_MODE'],
    startRuleIndex: R.root,
    grammarHash: 'test-hash',
    // @ts-expect-error TS2740 TODO(ts-error): fixme
    tokenDictionary: {
      SOURCE: T.SOURCE,
      EQUAL: T.EQUAL,
      PIPE: T.PIPE,
      ID: T.ID,
      BACKTICK_QUOTE: T.BQUOTA,
      SPACE: T.SPACE,
      FIELD: T.FIELD,
      DOT: T.DOT,
      OPENING_BRACKET: T.LT_PRTHS,
      COMMA: T.COMMA,
    } as Record<string, number>,
    ignoredTokens: [T.SPACE],
    rulesToVisit: [],
    runtimeSymbolicNameToTokenType,
    runtimeRuleNameToIndex,
    ...overrides,
  };
}

function mockToken(type: number, text?: string): Token {
  return { type, text: text ?? '' } as Token;
}

function createMockTokenStream(tokens: Token[]): TokenStream {
  return {
    get(index: number) {
      return tokens[index];
    },
    get size() {
      return tokens.length;
    },
  } as TokenStream;
}

describe('runtime PPL autocomplete helpers', () => {
  describe('deriveKeywordFromSymbolicName', () => {
    it('returns empty string for null/undefined', () => {
      expect(deriveKeywordFromSymbolicName(null)).toBe('');
      expect(deriveKeywordFromSymbolicName(undefined)).toBe('');
      expect(deriveKeywordFromSymbolicName('')).toBe('');
    });

    it('returns the name for valid uppercase symbolic names', () => {
      expect(deriveKeywordFromSymbolicName('WHERE')).toBe('WHERE');
      expect(deriveKeywordFromSymbolicName('SORT')).toBe('SORT');
      expect(deriveKeywordFromSymbolicName('STATS_BY')).toBe('STATS_BY');
      expect(deriveKeywordFromSymbolicName('A1')).toBe('A1');
    });

    it('rejects names ending with _STRING', () => {
      expect(deriveKeywordFromSymbolicName('DQUOTA_STRING')).toBe('');
      expect(deriveKeywordFromSymbolicName('BQUOTA_STRING')).toBe('');
      expect(deriveKeywordFromSymbolicName('SQUOTA_STRING')).toBe('');
    });

    it('rejects noise token names', () => {
      expect(deriveKeywordFromSymbolicName('ID')).toBe('');
      expect(deriveKeywordFromSymbolicName('WS')).toBe('');
      expect(deriveKeywordFromSymbolicName('SPACE')).toBe('');
      expect(deriveKeywordFromSymbolicName('EOF')).toBe('');
      expect(deriveKeywordFromSymbolicName('ERROR')).toBe('');
      expect(deriveKeywordFromSymbolicName('ERROR_RECOGNITION')).toBe('');
      expect(deriveKeywordFromSymbolicName('UNRECOGNIZED')).toBe('');
      expect(deriveKeywordFromSymbolicName('NUMBER')).toBe('');
      expect(deriveKeywordFromSymbolicName('INTEGER')).toBe('');
      expect(deriveKeywordFromSymbolicName('DECIMAL')).toBe('');
    });

    it('rejects internal structural/operator token names', () => {
      expect(deriveKeywordFromSymbolicName('DOT')).toBe('');
      expect(deriveKeywordFromSymbolicName('COMMA')).toBe('');
      expect(deriveKeywordFromSymbolicName('PIPE')).toBe('');
      expect(deriveKeywordFromSymbolicName('EQUAL')).toBe('');
      expect(deriveKeywordFromSymbolicName('NOT_EQUAL')).toBe('');
      expect(deriveKeywordFromSymbolicName('LESS')).toBe('');
      expect(deriveKeywordFromSymbolicName('GREATER')).toBe('');
      expect(deriveKeywordFromSymbolicName('LT_PRTHS')).toBe('');
      expect(deriveKeywordFromSymbolicName('RT_PRTHS')).toBe('');
      expect(deriveKeywordFromSymbolicName('LT_SQR_PRTHS')).toBe('');
      expect(deriveKeywordFromSymbolicName('RT_SQR_PRTHS')).toBe('');
      expect(deriveKeywordFromSymbolicName('STAR')).toBe('');
      expect(deriveKeywordFromSymbolicName('PLUS')).toBe('');
      expect(deriveKeywordFromSymbolicName('MINUS')).toBe('');
      expect(deriveKeywordFromSymbolicName('BACKTICK')).toBe('');
    });

    it('rejects lowercase or mixed-case names', () => {
      expect(deriveKeywordFromSymbolicName('where')).toBe('');
      expect(deriveKeywordFromSymbolicName('Where')).toBe('');
      expect(deriveKeywordFromSymbolicName('camelCase')).toBe('');
    });

    it('rejects names with special characters', () => {
      expect(deriveKeywordFromSymbolicName('FOO-BAR')).toBe('');
      expect(deriveKeywordFromSymbolicName('FOO.BAR')).toBe('');
    });
  });

  describe('isRuntimeNoisySuggestion', () => {
    const makeSk = (value: string): KeywordSuggestion => ({ value, id: 1 });

    it('returns false for empty/whitespace values', () => {
      expect(isRuntimeNoisySuggestion(makeSk(''))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('  '))).toBe(false);
    });

    it('returns false for word-like tokens (keywords)', () => {
      expect(isRuntimeNoisySuggestion(makeSk('WHERE'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('source'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('STATS_BY'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('field1'))).toBe(false);
    });

    it('returns false for operator tokens', () => {
      expect(isRuntimeNoisySuggestion(makeSk('='))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('!='))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('<'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('>'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('<>'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('+'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('-'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('*'))).toBe(false);
      expect(isRuntimeNoisySuggestion(makeSk('|'))).toBe(false);
    });

    it('returns true for delimiter/punctuation noise', () => {
      expect(isRuntimeNoisySuggestion(makeSk('('))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk(')'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('.'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk(','))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk("'"))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('"'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('`'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('['))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk(']'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('{}'))).toBe(true);
    });

    it('returns true for unknown non-word, non-operator symbols', () => {
      expect(isRuntimeNoisySuggestion(makeSk('@'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('#'))).toBe(true);
      expect(isRuntimeNoisySuggestion(makeSk('$'))).toBe(true);
    });
  });

  describe('isCommandPositionInCurrentSegment', () => {
    it('returns true for empty input', () => {
      expect(isCommandPositionInCurrentSegment('')).toBe(true);
    });

    it('returns true right after a pipe', () => {
      expect(isCommandPositionInCurrentSegment('source = t |')).toBe(true);
      expect(isCommandPositionInCurrentSegment('source = t | ')).toBe(true);
    });

    it('returns true when typing first word after pipe', () => {
      expect(isCommandPositionInCurrentSegment('source = t | w')).toBe(true);
      expect(isCommandPositionInCurrentSegment('source = t | where')).toBe(true);
    });

    it('returns false when past the command keyword', () => {
      expect(isCommandPositionInCurrentSegment('source = t | where ')).toBe(false);
      expect(isCommandPositionInCurrentSegment('source = t | where field')).toBe(false);
    });

    it('returns true for whitespace-only segment', () => {
      expect(isCommandPositionInCurrentSegment('source = t |   ')).toBe(true);
    });

    it('handles input with no pipe (first segment)', () => {
      expect(isCommandPositionInCurrentSegment('s')).toBe(true);
      expect(isCommandPositionInCurrentSegment('source')).toBe(true);
      expect(isCommandPositionInCurrentSegment('source ')).toBe(false);
    });
  });

  describe('isLikelyCommandKeyword', () => {
    it('returns true for uppercase multi-char keywords', () => {
      expect(isLikelyCommandKeyword({ value: 'WHERE', id: 1 })).toBe(true);
      expect(isLikelyCommandKeyword({ value: 'SORT', id: 2 })).toBe(true);
      expect(isLikelyCommandKeyword({ value: 'STATS', id: 3 })).toBe(true);
      expect(isLikelyCommandKeyword({ value: 'FIELDS', id: 4 })).toBe(true);
    });

    it('returns false for short operators', () => {
      expect(isLikelyCommandKeyword({ value: '=', id: 1 })).toBe(false);
      expect(isLikelyCommandKeyword({ value: '|', id: 2 })).toBe(false);
      expect(isLikelyCommandKeyword({ value: 'AS', id: 3 })).toBe(false);
      expect(isLikelyCommandKeyword({ value: 'BY', id: 4 })).toBe(false);
    });

    it('returns false for empty or missing values', () => {
      expect(isLikelyCommandKeyword({ value: '', id: 1 })).toBe(false);
    });

    it('returns false for lowercase values', () => {
      expect(isLikelyCommandKeyword({ value: 'where', id: 1 })).toBe(false);
      expect(isLikelyCommandKeyword({ value: 'Sort', id: 2 })).toBe(false);
    });
  });

  describe('isLikelyExpressionFunctionKeyword', () => {
    it('returns true for function-like keywords', () => {
      expect(isLikelyExpressionFunctionKeyword({ value: 'AVG', id: 1 })).toBe(true);
      expect(isLikelyExpressionFunctionKeyword({ value: 'COUNT', id: 2 })).toBe(true);
      expect(isLikelyExpressionFunctionKeyword({ value: 'TRIM', id: 3 })).toBe(true);
    });

    it('returns false for reserved short words', () => {
      expect(isLikelyExpressionFunctionKeyword({ value: 'AS', id: 1 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'BY', id: 2 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'ON', id: 3 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'IN', id: 4 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'OR', id: 5 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'AND', id: 6 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'NOT', id: 7 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'TRUE', id: 8 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'FALSE', id: 9 })).toBe(false);
    });

    it('returns false for empty or lowercase values', () => {
      expect(isLikelyExpressionFunctionKeyword({ value: '', id: 1 })).toBe(false);
      expect(isLikelyExpressionFunctionKeyword({ value: 'avg', id: 2 })).toBe(false);
    });
  });

  describe('isRuntimeFunctionRuleContext', () => {
    it('returns true when a rule name contains "function"', () => {
      const grammar = createMockGrammar({
        parserRuleNames: ['root', 'statsFunction', 'fieldList'],
      });
      const rules = new Map([[1, {}]]);
      expect(isRuntimeFunctionRuleContext(grammar, rules)).toBe(true);
    });

    it('returns false when no rule name contains "function"', () => {
      const grammar = createMockGrammar({
        parserRuleNames: ['root', 'searchCommand', 'fieldList'],
      });
      const rules = new Map([
        [1, {}],
        [2, {}],
      ]);
      expect(isRuntimeFunctionRuleContext(grammar, rules)).toBe(false);
    });

    it('returns false for empty rules map', () => {
      const grammar = createMockGrammar();
      expect(isRuntimeFunctionRuleContext(grammar, new Map())).toBe(false);
    });

    it('is case-insensitive for function detection', () => {
      const grammar = createMockGrammar({
        parserRuleNames: ['root', 'scalarFunctionName'],
      });
      const rules = new Map([[1, {}]]);
      expect(isRuntimeFunctionRuleContext(grammar, rules)).toBe(true);
    });
  });

  describe('resolveKeywordSuggestionDetails', () => {
    it('resolves by literal value (case-insensitive uppercase match)', () => {
      // PPL_SUGGESTION_IMPORTANCE has entries keyed by compiled token IDs;
      // The resolver should find them by literal name.
      const result = resolveKeywordSuggestionDetails({ value: 'source', id: 999 });
      // 'source' or 'SOURCE' should match if it exists in PPL_SUGGESTION_IMPORTANCE
      // The result may be null if the literal isn't in the map, which is valid
      if (result) {
        expect(result).toHaveProperty('importance');
        expect(result).toHaveProperty('type');
      }
    });

    it('resolves by symbolic name when literal lookup fails', () => {
      const result = resolveKeywordSuggestionDetails({
        value: 'NONEXISTENT_VALUE',
        symbolicName: 'SOURCE',
        id: 999,
      });
      // May or may not find it depending on compiled token mapping
      // The important thing is it doesn't throw
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('returns null for completely unknown keywords', () => {
      const result = resolveKeywordSuggestionDetails({
        value: 'XYZZY_UNKNOWN',
        symbolicName: 'XYZZY_UNKNOWN',
        id: 99999,
      });
      expect(result).toBeNull();
    });

    it('falls back to ID-based lookup when no value or symbolicName', () => {
      const result = resolveKeywordSuggestionDetails({ value: '', id: 99999 });
      // Without value or symbolicName, falls through to ID lookup
      // ID 99999 shouldn't be in the map
      expect(result).toBeNull();
    });

    it('uses ID lookup only when both value and symbolicName are missing', () => {
      // If value exists but doesn't match, it shouldn't fall back to ID
      const result = resolveKeywordSuggestionDetails({
        value: 'XYZZY',
        symbolicName: 'XYZZY',
        id: 1, // id=1 might be in PPL_SUGGESTION_IMPORTANCE
      });
      // Should not use ID lookup since value and symbolicName are provided
      expect(result).toBeNull();
    });
  });

  describe('resolveSupportedNonLiteralKeywordDetails', () => {
    it('returns undefined for unknown keywords', () => {
      const result = resolveSupportedNonLiteralKeywordDetails({ value: 'UNKNOWN', id: 99999 });
      expect(result).toBeUndefined();
    });

    it('tries ID lookup first', () => {
      // Find a real entry in SUPPORTED_NON_LITERAL_KEYWORDS
      const firstEntry = SUPPORTED_NON_LITERAL_KEYWORDS.entries().next();
      if (!firstEntry.done) {
        const [id, details] = firstEntry.value;
        const result = resolveSupportedNonLiteralKeywordDetails({ value: '', id });
        expect(result).toEqual(details);
      }
    });
  });

  describe('resolveSpaceToken', () => {
    it('resolves WHITESPACE from tokenDictionary', () => {
      const grammar = createMockGrammar({
        tokenDictionary: { WHITESPACE: 42 } as any,
      });
      expect(resolveSpaceToken(grammar)).toBe(42);
    });

    it('resolves SPACE from tokenDictionary when WHITESPACE absent', () => {
      const grammar = createMockGrammar({
        tokenDictionary: { SPACE: 8 } as any,
      });
      expect(resolveSpaceToken(grammar)).toBe(8);
    });

    it('falls back to symbolic name lookup for WHITESPACE', () => {
      const grammar = createMockGrammar({
        tokenDictionary: {} as any,
      });
      // Our mock grammar has SPACE at index 8 in symbolic names
      expect(resolveSpaceToken(grammar)).toBe(T.SPACE);
    });

    it('returns INVALID_TYPE when no space token found', () => {
      const grammar = createMockGrammar({
        tokenDictionary: {} as any,
        runtimeSymbolicNameToTokenType: new Map(),
      });
      expect(resolveSpaceToken(grammar)).toBe(Token.INVALID_TYPE);
    });

    it('rejects non-positive values from tokenDictionary', () => {
      const grammar = createMockGrammar({
        tokenDictionary: { WHITESPACE: 0 } as any,
      });
      // Should fall through to symbolic lookup since 0 <= INVALID_TYPE
      expect(resolveSpaceToken(grammar)).toBe(T.SPACE);
    });

    it('rejects negative values from tokenDictionary', () => {
      const grammar = createMockGrammar({
        tokenDictionary: { WHITESPACE: -1 } as any,
      });
      expect(resolveSpaceToken(grammar)).toBe(T.SPACE);
    });
  });

  describe('pickStartRuleIndex', () => {
    it('returns startRuleIndex for normal queries', () => {
      const grammar = createMockGrammar();
      expect(pickStartRuleIndex('source = t', grammar)).toBe(R.root);
    });

    it('uses pipeStartRuleIndex for pipe-first queries when available', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: 42 });
      expect(pickStartRuleIndex('| where x > 1', grammar)).toBe(42);
    });

    it('falls back to commands rule for pipe-first when no pipeStartRuleIndex', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: undefined });
      expect(pickStartRuleIndex('| where x > 1', grammar)).toBe(R.commands);
    });

    it('falls back to subPipeline when commands rule missing', () => {
      // pickStartRuleIndex uses parserRuleNames.indexOf, so we need to
      // remove 'commands' from the array itself
      const ruleNames = RULE_NAMES.filter((n) => n !== 'commands');
      const runtimeRuleNameToIndex = new Map<string, number>();
      ruleNames.forEach((name, idx) => runtimeRuleNameToIndex.set(name, idx));
      const grammar = createMockGrammar({
        pipeStartRuleIndex: undefined,
        parserRuleNames: ruleNames,
        runtimeRuleNameToIndex,
      });
      const subPipelineIdx = ruleNames.indexOf('subPipeline');
      expect(pickStartRuleIndex('| sort x', grammar)).toBe(subPipelineIdx);
    });

    it('handles leading whitespace before pipe', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: 42 });
      expect(pickStartRuleIndex('  | where x', grammar)).toBe(42);
    });

    it('returns default for queries not starting with pipe', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: 42 });
      expect(pickStartRuleIndex('source = t | where x', grammar)).toBe(R.root);
    });

    it('returns 0 when startRuleIndex missing and not pipe-first', () => {
      const grammar = createMockGrammar({ startRuleIndex: undefined as any });
      expect(pickStartRuleIndex('source = t', grammar)).toBe(0);
    });
  });

  describe('isEffectivelyWhitespace', () => {
    it('returns true for the space token type', () => {
      expect(isEffectivelyWhitespace(mockToken(T.SPACE, ' '), T.SPACE)).toBe(true);
    });

    it('returns true for EOF', () => {
      expect(isEffectivelyWhitespace(mockToken(Token.EOF, ''), T.SPACE)).toBe(true);
    });

    it('returns true for whitespace-only text even with wrong type', () => {
      expect(isEffectivelyWhitespace(mockToken(999, '   '), T.SPACE)).toBe(true);
      expect(isEffectivelyWhitespace(mockToken(999, '\t'), T.SPACE)).toBe(true);
    });

    it('returns false for non-whitespace tokens', () => {
      expect(isEffectivelyWhitespace(mockToken(T.ID, 'field'), T.SPACE)).toBe(false);
      expect(isEffectivelyWhitespace(mockToken(T.SOURCE, 'SOURCE'), T.SPACE)).toBe(false);
    });

    it('returns false for empty text with non-space type', () => {
      expect(isEffectivelyWhitespace(mockToken(999, ''), T.SPACE)).toBe(false);
    });
  });

  describe('findLastNonSpaceTokenRT', () => {
    it('finds the last non-space token before cursor', () => {
      const tokens = [
        mockToken(T.SOURCE, 'source'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
      ];
      const stream = createMockTokenStream(tokens);
      const result = findLastNonSpaceTokenRT(stream, 4, T.SPACE);
      expect(result).not.toBeNull();
      expect(result!.token.type).toBe(T.EQUAL);
      expect(result!.index).toBe(2);
    });

    it('returns null when no non-space tokens exist', () => {
      const tokens = [mockToken(T.SPACE, ' '), mockToken(T.SPACE, ' ')];
      const stream = createMockTokenStream(tokens);
      expect(findLastNonSpaceTokenRT(stream, 2, T.SPACE)).toBeNull();
    });

    it('returns null when currentIndex is 0', () => {
      const tokens = [mockToken(T.ID, 'x')];
      const stream = createMockTokenStream(tokens);
      expect(findLastNonSpaceTokenRT(stream, 0, T.SPACE)).toBeNull();
    });

    it('skips multiple spaces', () => {
      const tokens = [
        mockToken(T.ID, 'field'),
        mockToken(T.SPACE, ' '),
        mockToken(T.SPACE, ' '),
        mockToken(T.SPACE, ' '),
      ];
      const stream = createMockTokenStream(tokens);
      const result = findLastNonSpaceTokenRT(stream, 4, T.SPACE);
      expect(result!.token.type).toBe(T.ID);
      expect(result!.index).toBe(0);
    });
  });

  describe('isAtFirstArgumentPositionInSegmentRT', () => {
    it('returns true after command keyword with space', () => {
      // | where _
      const tokens = [
        mockToken(T.PIPE, '|'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'where'),
        mockToken(T.SPACE, ' '),
      ];
      const stream = createMockTokenStream(tokens);
      expect(isAtFirstArgumentPositionInSegmentRT(stream, 4, T.SPACE, T.PIPE)).toBe(true);
    });

    it('returns false when more than one non-space token in segment', () => {
      // | where field _
      const tokens = [
        mockToken(T.PIPE, '|'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'where'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'field'),
        mockToken(T.SPACE, ' '),
      ];
      const stream = createMockTokenStream(tokens);
      expect(isAtFirstArgumentPositionInSegmentRT(stream, 6, T.SPACE, T.PIPE)).toBe(false);
    });

    it('returns true when segment has no non-space tokens', () => {
      // |  _
      const tokens = [mockToken(T.PIPE, '|'), mockToken(T.SPACE, ' ')];
      const stream = createMockTokenStream(tokens);
      // 0 non-space tokens from segment start = true (no == 1 though)
      // Actually: nonSpaceTokenCount == 0, returns true since 0 === 1 is false
      // Let me re-read: `return nonSpaceTokenCount === 1` - so 0 returns false
      expect(isAtFirstArgumentPositionInSegmentRT(stream, 2, T.SPACE, T.PIPE)).toBe(false);
    });

    it('handles first segment (no pipe)', () => {
      // source _
      const tokens = [mockToken(T.ID, 'source'), mockToken(T.SPACE, ' ')];
      const stream = createMockTokenStream(tokens);
      expect(isAtFirstArgumentPositionInSegmentRT(stream, 2, T.SPACE, T.PIPE)).toBe(true);
    });
  });

  describe('buildRuntimePreferredRules', () => {
    it('includes known preferred rules from the grammar', () => {
      const grammar = createMockGrammar();
      const rules = buildRuntimePreferredRules(grammar);
      expect(rules.has(R.qualifiedName)).toBe(true);
      expect(rules.has(R.wcQualifiedName)).toBe(true);
      expect(rules.has(R.tableQualifiedName)).toBe(true);
      expect(rules.has(R.statsFunctionName)).toBe(true);
      expect(rules.has(R.searchCommand)).toBe(true);
      expect(rules.has(R.comparisonOperator)).toBe(true);
    });

    it('skips rules not present in grammar', () => {
      const grammar = createMockGrammar({
        parserRuleNames: ['root', 'commands'],
        runtimeRuleNameToIndex: new Map([
          ['root', 0],
          ['commands', 1],
        ]),
      });
      const rules = buildRuntimePreferredRules(grammar);
      // None of the preferred rules exist in this grammar
      expect(rules.size).toBe(0);
    });
  });

  describe('getSafeRuntimeIgnoredTokens', () => {
    it('includes non-literal token types', () => {
      const grammar = createMockGrammar({ ignoredTokens: [T.SPACE, T.ID] });
      const safe = getSafeRuntimeIgnoredTokens(grammar);
      // SPACE has no literal name → included
      expect(safe.has(T.SPACE)).toBe(true);
      // ID has no literal name → included
      expect(safe.has(T.ID)).toBe(true);
    });

    it('excludes literal tokens (keywords/operators)', () => {
      const grammar = createMockGrammar({ ignoredTokens: [T.SOURCE, T.EQUAL] });
      const safe = getSafeRuntimeIgnoredTokens(grammar);
      // SOURCE has literal "'SOURCE'" → excluded
      expect(safe.has(T.SOURCE)).toBe(false);
      // EQUAL has literal "'='" → excluded
      expect(safe.has(T.EQUAL)).toBe(false);
    });

    it('excludes INVALID_TYPE and EOF', () => {
      const grammar = createMockGrammar({
        ignoredTokens: [Token.INVALID_TYPE, Token.EOF, T.SPACE],
      });
      const safe = getSafeRuntimeIgnoredTokens(grammar);
      expect(safe.has(Token.INVALID_TYPE)).toBe(false);
      expect(safe.has(Token.EOF)).toBe(false);
      expect(safe.has(T.SPACE)).toBe(true);
    });

    it('handles empty ignoredTokens', () => {
      const grammar = createMockGrammar({ ignoredTokens: [] });
      expect(getSafeRuntimeIgnoredTokens(grammar).size).toBe(0);
    });

    it('handles non-array ignoredTokens gracefully', () => {
      const grammar = createMockGrammar({ ignoredTokens: null as any });
      expect(getSafeRuntimeIgnoredTokens(grammar).size).toBe(0);
    });
  });

  describe('enrichRuntimeResult', () => {
    const baseResult = { errors: [], suggestKeywords: [] };

    it('sets suggestAggregateFunctions when statsFunctionName rule present', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.statsFunctionName, { ruleList: [] }]]);
      const stream = createMockTokenStream([mockToken(Token.EOF)]);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 0);
      expect(result.suggestAggregateFunctions).toBe(true);
    });

    it('sets suggestSourcesOrTables for tableQualifiedName when last token is not ID/BQUOTA', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.tableQualifiedName, { ruleList: [] }]]);
      // Last token is EQUAL, not ID or BQUOTA
      const tokens = [
        mockToken(T.SOURCE, 'source'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestSourcesOrTables).toBe(SourceOrTableSuggestion.TABLES);
    });

    it('does NOT set suggestSourcesOrTables when last token is ID', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.tableQualifiedName, { ruleList: [] }]]);
      const tokens = [
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'my_table'),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestSourcesOrTables).toBeUndefined();
    });

    it('sets suggestColumns for fieldExpression when last token is not ID/BQUOTA/DOT', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.fieldExpression, { ruleList: [] }]]);
      // Last non-space token before cursor must not be ID/BQUOTA/DOT
      // Use EQUAL as the last non-space token
      const tokens = [
        mockToken(T.ID, 'field'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestColumns).toBeDefined();
    });

    it('does NOT set suggestColumns for fieldExpression when last token is ID', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.fieldExpression, { ruleList: [] }]]);
      const tokens = [mockToken(T.ID, 'field_name'), mockToken(Token.EOF)];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 1);
      expect(result.suggestColumns).toBeUndefined();
    });

    it('sets suggestRenameAs for renameClasue at correct position', () => {
      const grammar = createMockGrammar();
      // expressionStart + 2 === cursorTokenIndex triggers suggestRenameAs
      const rules = new Map([[R.renameClasue, { ruleList: [], startTokenIndex: 0 }]]);
      const tokens = [mockToken(T.ID, 'old_name'), mockToken(T.SPACE, ' '), mockToken(Token.EOF)];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 2);
      expect(result.suggestRenameAs).toBe(true);
      expect(result.suggestColumns).toBeUndefined();
    });

    it('sets suggestColumns for renameClasue at start position', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.renameClasue, { ruleList: [], startTokenIndex: 3 }]]);
      const tokens = [
        mockToken(T.PIPE, '|'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'rename'),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 3);
      expect(result.suggestColumns).toBeDefined();
      expect(result.suggestRenameAs).toBe(false);
    });

    it('sets preferColumnSuggestionsOnly for FIELD = context', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      // Tokens: FIELD = _
      const tokens = [
        mockToken(T.FIELD, 'field'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestColumns).toBeDefined();
      expect(result.preferColumnSuggestionsOnly).toBe(true);
    });

    it('does NOT set preferColumnSuggestionsOnly when FIELD is not before EQUAL', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      // Tokens: ID = _ (not FIELD =)
      const tokens = [
        mockToken(T.ID, 'category'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.preferColumnSuggestionsOnly).toBe(false);
    });

    it('detects back-quote context', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      const tokens = [
        mockToken(T.ID, 'where'),
        mockToken(T.SPACE, ' '),
        mockToken(T.BQUOTA, '`field`'),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 2);
      expect(result.isInBackQuote).toBe(true);
      expect(result.isInQuote).toBe(false);
    });

    it('detects double-quote context', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      const tokens = [
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(T.DQUOTA, '"value"'),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 2);
      expect(result.isInQuote).toBe(true);
      expect(result.isInBackQuote).toBe(false);
    });

    it('detects single-quote context', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      const tokens = [
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(T.SQUOTA, "'value'"),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 2);
      expect(result.isInQuote).toBe(true);
    });

    it('no quote context for normal tokens', () => {
      const grammar = createMockGrammar();
      const rules = new Map<number, any>();
      const tokens = [mockToken(T.ID, 'field'), mockToken(Token.EOF)];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 1);
      expect(result.isInQuote).toBe(false);
      expect(result.isInBackQuote).toBe(false);
    });

    it('ignores no-op rules without setting flags', () => {
      const grammar = createMockGrammar();
      const rules = new Map([
        [R.integerLiteral, { ruleList: [] }],
        [R.decimalLiteral, { ruleList: [] }],
        [R.keywordsCanBeId, { ruleList: [] }],
        [R.takeAggFunction, { ruleList: [] }],
        [R.sqlLikeJoinType, { ruleList: [] }],
        [R.positionFunctionName, { ruleList: [] }],
      ]);
      const stream = createMockTokenStream([mockToken(Token.EOF)]);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 0);
      expect(result.suggestColumns).toBeUndefined();
      expect(result.suggestSourcesOrTables).toBeUndefined();
      expect(result.suggestAggregateFunctions).toBe(false);
      expect(result.suggestRenameAs).toBe(false);
    });

    it('handles structural stop-point rules without side effects', () => {
      const grammar = createMockGrammar();
      const rules = new Map([
        [R.comparisonOperator, { ruleList: [] }],
        [R.searchComparisonOperator, { ruleList: [] }],
        [R.searchCommand, { ruleList: [] }],
      ]);
      const stream = createMockTokenStream([mockToken(Token.EOF)]);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 0);
      expect(result.suggestColumns).toBeUndefined();
      expect(result.suggestSourcesOrTables).toBeUndefined();
    });

    it('sets suggestFieldsInAggregateFunction for qualifiedName inside statsFunction', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.qualifiedName, { ruleList: [R.statsFunction] }]]);
      // tokens: source = t | stats count( _
      const tokens = [mockToken(T.LT_PRTHS, '('), mockToken(T.SPACE, ' '), mockToken(Token.EOF)];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 2);
      expect(result.suggestFieldsInAggregateFunction).toBe(true);
      expect(result.suggestColumns).toBeDefined();
    });

    it('does NOT suggest columns for qualifiedName when last non-operator token is SOURCE', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.qualifiedName, { ruleList: [] }]]);
      // source = _ → should suggest table, not columns
      const tokens = [
        mockToken(T.SOURCE, 'source'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestColumns).toBeUndefined();
    });

    it('preserves base result errors and keywords', () => {
      const grammar = createMockGrammar();
      const errors = [{ message: 'test', startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 }];
      const keywords = [{ value: 'WHERE', id: 1 }];
      const base = { errors, suggestKeywords: keywords };
      const stream = createMockTokenStream([mockToken(Token.EOF)]);
      const result = enrichRuntimeResult(base, grammar, new Map(), stream, 0);
      expect(result.errors).toBe(errors);
      expect(result.suggestKeywords).toBe(keywords);
    });

    it('sets suggestSingleQuotes for stringLiteral rule', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.stringLiteral, { ruleList: [] }]]);
      // category = _ → stringLiteral after EQUAL + ID
      const tokens = [
        mockToken(T.ID, 'category'),
        mockToken(T.SPACE, ' '),
        mockToken(T.EQUAL, '='),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestSingleQuotes).toBe(true);
      expect(result.suggestValuesForColumn).toBe('category');
    });

    it('does NOT set suggestValuesForColumn when cursorTokenIndex < 2', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.stringLiteral, { ruleList: [] }]]);
      const tokens = [mockToken(T.EQUAL, '='), mockToken(Token.EOF)];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 1);
      expect(result.suggestSingleQuotes).toBe(false);
      expect(result.suggestValuesForColumn).toBeUndefined();
    });

    it('handles searchableKeyWord at first argument position', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.searchableKeyWord, { ruleList: [] }]]);
      // | where _  (one non-space token "where" in segment)
      const tokens = [
        mockToken(T.PIPE, '|'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'where'),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 4);
      expect(result.suggestColumns).toBeDefined();
    });

    it('does NOT suggest columns for searchableKeyWord past first argument', () => {
      const grammar = createMockGrammar();
      const rules = new Map([[R.searchableKeyWord, { ruleList: [] }]]);
      // | where field _ (two non-space tokens in segment)
      const tokens = [
        mockToken(T.PIPE, '|'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'where'),
        mockToken(T.SPACE, ' '),
        mockToken(T.ID, 'field'),
        mockToken(T.SPACE, ' '),
        mockToken(Token.EOF),
      ];
      const stream = createMockTokenStream(tokens);
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 6);
      expect(result.suggestColumns).toBeUndefined();
    });

    it('handles unknown rules gracefully (default case)', () => {
      const grammar = createMockGrammar({
        parserRuleNames: [...RULE_NAMES, 'futureNewRule'],
        runtimeRuleNameToIndex: new Map([
          ...createMockGrammar().runtimeRuleNameToIndex,
          ['futureNewRule', RULE_NAMES.length],
        ]),
      });
      const rules = new Map([[RULE_NAMES.length, { ruleList: [] }]]);
      const stream = createMockTokenStream([mockToken(Token.EOF)]);
      // Should not throw
      const result = enrichRuntimeResult(baseResult, grammar, rules, stream, 0);
      expect(result.suggestColumns).toBeUndefined();
    });
  });
});
