/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { CachedGrammar, pplGrammarCache } from './ppl_grammar_cache';
import { validateRuntimePPLQuery } from './runtime_validation';
import { openSearchPplAutocompleteData as simplifiedPplAutocompleteData } from './simplified_ppl_grammar/opensearch_ppl_autocomplete';

describe('validateRuntimePPLQuery', () => {
  const buildRuntimeGrammar = (overrides: Partial<CachedGrammar> = {}): CachedGrammar => {
    const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(''));
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new SimplifiedOpenSearchPPLParser(tokenStream);

    const runtimeSymbolicNameToTokenType = new Map<string, number>();
    for (let i = 0; i <= parser.vocabulary.maxTokenType; i++) {
      const symbolicName = parser.vocabulary.getSymbolicName(i);
      if (symbolicName) {
        runtimeSymbolicNameToTokenType.set(symbolicName, i);
      }
    }

    const runtimeRuleNameToIndex = new Map<string, number>();
    parser.ruleNames.forEach((name, idx) => runtimeRuleNameToIndex.set(name, idx));

    return {
      lexerATN: lexer.interpreter.atn,
      parserATN: parser.interpreter.atn,
      vocabulary: parser.vocabulary,
      lexerRuleNames: lexer.ruleNames,
      parserRuleNames: parser.ruleNames,
      channelNames: lexer.channelNames,
      modeNames: lexer.modeNames,
      startRuleIndex: 0,
      pipeStartRuleIndex: parser.ruleNames.indexOf('commands'),
      grammarHash: 'runtime-validation-test-grammar',
      lastUsed: Date.now(),
      backendVersion: '3.6.0',
      tokenDictionary: simplifiedPplAutocompleteData.tokenDictionary,
      ignoredTokens: Array.from(simplifiedPplAutocompleteData.ignoredTokens),
      rulesToVisit: Array.from(simplifiedPplAutocompleteData.rulesToVisit),
      runtimeSymbolicNameToTokenType,
      runtimeRuleNameToIndex,
      ...overrides,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return null when runtime validation is not enabled for the model', () => {
    expect(
      validateRuntimePPLQuery({
        content: '| head 10',
        context: undefined,
        model: {} as any,
      })
    ).toBeNull();
  });

  it('should return null when no cached runtime grammar is available', () => {
    jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(null);

    expect(
      validateRuntimePPLQuery({
        content: '| head 10',
        context: {
          useRuntimeGrammar: true,
          dataSourceId: 'ds-1',
          dataSourceVersion: '3.6.0',
        },
        model: {} as any,
      })
    ).toBeNull();
  });

  it('should validate pipe-first queries with the cached runtime grammar', () => {
    jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

    const result = validateRuntimePPLQuery({
      content: '| head 10',
      context: {
        useRuntimeGrammar: true,
      },
      model: {} as any,
    });

    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('should remap runtime pipe-first errors back to the original query offsets', () => {
    jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

    const result = validateRuntimePPLQuery({
      content: '| where',
      context: {
        useRuntimeGrammar: true,
      },
      model: {} as any,
    });

    expect(result?.isValid).toBe(false);
    expect((result?.errors.length ?? 0) > 0).toBe(true);
    expect(result?.errors[0].column).toBeGreaterThanOrEqual(1);
  });
});
