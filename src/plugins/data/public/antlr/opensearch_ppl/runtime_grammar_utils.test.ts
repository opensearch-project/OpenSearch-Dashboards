/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token } from 'antlr4ng';
import { CachedGrammar } from './ppl_grammar_cache';
import {
  getRuleIndex,
  pickStartRuleIndex,
  resolveSpaceToken,
  tokenTypeBySymbolic,
} from './runtime_grammar_utils';

const RULE_NAMES = ['root', 'commands', 'subPipeline'];

function createMockGrammar(overrides?: Partial<CachedGrammar>): CachedGrammar {
  const runtimeRuleNameToIndex = new Map<string, number>();
  RULE_NAMES.forEach((name, idx) => runtimeRuleNameToIndex.set(name, idx));

  const runtimeSymbolicNameToTokenType = new Map<string, number>([
    ['SOURCE', 1],
    ['PIPE', 3],
    ['SPACE', 8],
  ]);

  return {
    lexerATN: {} as any,
    parserATN: {} as any,
    vocabulary: {} as any,
    lexerRuleNames: [],
    parserRuleNames: RULE_NAMES,
    channelNames: [],
    modeNames: [],
    startRuleIndex: 0,
    grammarHash: 'test-hash',
    // @ts-expect-error partial tokenDictionary is fine for these unit tests
    tokenDictionary: {} as Record<string, number>,
    ignoredTokens: [],
    rulesToVisit: [],
    runtimeSymbolicNameToTokenType,
    runtimeRuleNameToIndex,
    ...overrides,
  };
}

describe('runtime_grammar_utils', () => {
  describe('tokenTypeBySymbolic', () => {
    it('returns the mapped token type', () => {
      expect(tokenTypeBySymbolic(createMockGrammar(), 'PIPE')).toBe(3);
    });

    it('returns INVALID_TYPE for an unknown symbolic name', () => {
      expect(tokenTypeBySymbolic(createMockGrammar(), 'NOPE')).toBe(Token.INVALID_TYPE);
    });
  });

  describe('getRuleIndex', () => {
    it('returns the mapped rule index', () => {
      expect(getRuleIndex(createMockGrammar(), 'commands')).toBe(1);
    });

    it('returns -1 for an unknown rule name', () => {
      expect(getRuleIndex(createMockGrammar(), 'nope')).toBe(-1);
    });
  });

  describe('resolveSpaceToken', () => {
    it('resolves WHITESPACE from the token dictionary', () => {
      const grammar = createMockGrammar({ tokenDictionary: { WHITESPACE: 42 } as any });
      expect(resolveSpaceToken(grammar)).toBe(42);
    });

    it('resolves SPACE from the token dictionary when WHITESPACE absent', () => {
      const grammar = createMockGrammar({ tokenDictionary: { SPACE: 7 } as any });
      expect(resolveSpaceToken(grammar)).toBe(7);
    });

    it('falls back to symbolic-name lookup when the dictionary has no space token', () => {
      expect(resolveSpaceToken(createMockGrammar())).toBe(8);
    });

    it('returns INVALID_TYPE when no space token can be resolved', () => {
      const grammar = createMockGrammar({ runtimeSymbolicNameToTokenType: new Map() });
      expect(resolveSpaceToken(grammar)).toBe(Token.INVALID_TYPE);
    });

    it('rejects non-positive dictionary values and falls through to symbolic lookup', () => {
      const grammar = createMockGrammar({ tokenDictionary: { WHITESPACE: 0 } as any });
      expect(resolveSpaceToken(grammar)).toBe(8);
    });
  });

  describe('pickStartRuleIndex', () => {
    it('returns the default start rule for a non-pipe-first query', () => {
      expect(pickStartRuleIndex('source = t', createMockGrammar())).toBe(0);
    });

    it('uses pipeStartRuleIndex for a pipe-first query when present', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: 42 });
      expect(pickStartRuleIndex('| where x > 1', grammar)).toBe(42);
    });

    it('falls back to the commands rule for pipe-first when no pipeStartRuleIndex', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: undefined });
      expect(pickStartRuleIndex('| where x > 1', grammar)).toBe(1);
    });

    it('does NOT use subPipeline by default when commands is absent', () => {
      const runtimeRuleNameToIndex = new Map<string, number>([
        ['root', 0],
        ['subPipeline', 2],
      ]);
      const grammar = createMockGrammar({
        pipeStartRuleIndex: undefined,
        runtimeRuleNameToIndex,
      });
      expect(pickStartRuleIndex('| sort x', grammar)).toBe(0);
    });

    it('uses subPipeline when commands is absent and the fallback is enabled', () => {
      const runtimeRuleNameToIndex = new Map<string, number>([
        ['root', 0],
        ['subPipeline', 2],
      ]);
      const grammar = createMockGrammar({
        pipeStartRuleIndex: undefined,
        runtimeRuleNameToIndex,
      });
      expect(pickStartRuleIndex('| sort x', grammar, true)).toBe(2);
    });

    it('handles leading whitespace before the pipe', () => {
      const grammar = createMockGrammar({ pipeStartRuleIndex: 42 });
      expect(pickStartRuleIndex('  | where x', grammar)).toBe(42);
    });

    it('returns 0 when startRuleIndex is missing and not pipe-first', () => {
      const grammar = createMockGrammar({ startRuleIndex: undefined as any });
      expect(pickStartRuleIndex('source = t', grammar)).toBe(0);
    });
  });
});
