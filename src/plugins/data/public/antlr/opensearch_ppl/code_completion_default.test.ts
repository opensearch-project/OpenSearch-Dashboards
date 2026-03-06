/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CharStream, CommonTokenStream, ParserInterpreter } from 'antlr4ng';
import { OpenSearchPPLLexer, OpenSearchPPLParser } from '@osd/antlr-grammar';
import { getDefaultSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';
import { PPL_AGGREGATE_FUNCTIONS } from './constants';
import { pplGrammarCache, CachedGrammar } from './ppl_grammar_cache';
import { openSearchPplAutocompleteData as defaultPplAutocompleteData } from './default_ppl_grammar/opensearch_ppl_autocomplete';

describe('ppl code_completion', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const buildRuntimeGrammar = (overrides: Partial<CachedGrammar> = {}): CachedGrammar => {
    const lexer = new OpenSearchPPLLexer(CharStream.fromString(''));
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new OpenSearchPPLParser(tokenStream);

    const runtimeSymbolicNameToTokenType = new Map<string, number>();
    for (let i = 0; i <= parser.vocabulary.maxTokenType; i++) {
      const symbolicName = parser.vocabulary.getSymbolicName(i);
      if (symbolicName) runtimeSymbolicNameToTokenType.set(symbolicName, i);
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
      grammarHash: 'runtime-default-test-grammar',
      lastUsed: Date.now(),
      backendVersion: '3.6.0',
      tokenDictionary: defaultPplAutocompleteData.tokenDictionary,
      ignoredTokens: Array.from(defaultPplAutocompleteData.ignoredTokens),
      rulesToVisit: Array.from(defaultPplAutocompleteData.rulesToVisit),
      runtimeSymbolicNameToTokenType,
      runtimeRuleNameToIndex,
      ...overrides,
    };
  };

  describe('getSuggestions', () => {
    const mockIndexPattern = {
      title: 'test-index',
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
        { name: 'field3', type: 'boolean' },
      ],
    } as IndexPattern;

    const mockServices = {
      appName: 'test-app',
    } as IDataPluginServices;

    const mockPosition = {
      lineNumber: 1,
      column: 1,
    } as monaco.Position;

    const getSimpleSuggestions = async (
      query: string,
      position: monaco.Position = new monaco.Position(1, query.length + 1)
    ) => {
      return getDefaultSuggestions({
        query,
        indexPattern: mockIndexPattern,
        position,
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: mockServices,
      });
    };

    const checkSuggestionsContain = (
      result: QuerySuggestion[],
      expected: Partial<QuerySuggestion>
    ) => {
      expect(
        result.some(
          (suggestion) => suggestion.text === expected.text && suggestion.type === expected.type
        )
      ).toBeTruthy();
    };

    it('should return empty array when required parameters are missing', async () => {
      const result = await getDefaultSuggestions({
        query: '',
        indexPattern: (null as unknown) as IndexPattern,
        position: mockPosition,
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: (null as unknown) as IDataPluginServices,
      });

      expect(result).toEqual([]);
    });

    it('should suggest table name when suggestSourcesOrTables is true', async () => {
      const result = await getSimpleSuggestions('source = ');

      checkSuggestionsContain(result, {
        text: 'test-index',
        type: monaco.languages.CompletionItemKind.Struct,
      });
    });

    it('should suggest columns when suggestColumns is true', async () => {
      const result = await getSimpleSuggestions('source = test-index | where ');

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should suggest values after column names', async () => {
      const mockedValues = ['value1', 'value2'];
      jest.spyOn(utils, 'fetchColumnValues').mockResolvedValue(mockedValues);

      const result = await getSimpleSuggestions('source = test-index | where field1 = ');

      expect(utils.fetchColumnValues).toHaveBeenCalled();
      mockedValues.forEach((val) => {
        checkSuggestionsContain(result, {
          text: val,
          type: monaco.languages.CompletionItemKind.Value,
        });
      });
    });

    it('should suggest aggregate functions for stats', async () => {
      const result = await getSimpleSuggestions('source = test-index | stats ');
      Object.keys(PPL_AGGREGATE_FUNCTIONS).forEach((af) => {
        checkSuggestionsContain(result, {
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Function,
        });
      });
    });

    it('should suggest "as" for rename command', async () => {
      const result = await getSimpleSuggestions('source = test-index | rename field1 ');

      checkSuggestionsContain(result, {
        text: 'as',
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    it('should use runtime grammar when cache is available for supported datasource versions', async () => {
      const runtimeParseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
      jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
      jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

      const runtimeIndexPattern = {
        ...mockIndexPattern,
        dataSourceRef: { id: 'runtime-ds', version: '3.6.0' },
      } as IndexPattern;

      const result = await getDefaultSuggestions({
        query: 'source ',
        indexPattern: runtimeIndexPattern,
        position: new monaco.Position(1, 'source '.length + 1),
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: mockServices,
      });

      expect(runtimeParseSpy).toHaveBeenCalled();
      checkSuggestionsContain(result, {
        text: '=',
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    it('should fall back to compiled default grammar when runtime cache is missing', async () => {
      const runtimeParseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
      jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
      jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(null);

      const runtimeIndexPattern = {
        ...mockIndexPattern,
        dataSourceRef: { id: 'runtime-ds', version: '3.6.0' },
      } as IndexPattern;

      const result = await getDefaultSuggestions({
        query: 'source = ',
        indexPattern: runtimeIndexPattern,
        position: new monaco.Position(1, 'source = '.length + 1),
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: mockServices,
      });

      expect(runtimeParseSpy).not.toHaveBeenCalled();
      checkSuggestionsContain(result, {
        text: 'test-index',
        type: monaco.languages.CompletionItemKind.Struct,
      });
    });
  });
});
