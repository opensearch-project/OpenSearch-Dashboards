/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CharStream, CommonTokenStream, ParserInterpreter } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { getSimplifiedPPLSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';
import { PPL_AGGREGATE_FUNCTIONS, PPL_SUGGESTION_IMPORTANCE } from './constants';
import * as querySnippets from '../../query_snippet_suggestions/ppl/suggestions';
import { pplGrammarCache, CachedGrammar } from './ppl_grammar_cache';
import { openSearchPplAutocompleteData as simplifiedPplAutocompleteData } from './simplified_ppl_grammar/opensearch_ppl_autocomplete';

describe('ppl code_completion', () => {
  // Mock the query snippet suggestions function at the top level
  beforeEach(() => {
    jest.spyOn(querySnippets, 'getPPLQuerySnippetForSuggestions').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockIndexPattern = {
    title: 'test-index',
    fields: [
      { name: '_field5', type: 'string' },
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'number' },
      { name: 'field3', type: 'boolean' },
      { name: 'field4', type: 'string' },
      // Fields with dots for backtick testing
      { name: 'resource.attributes.host', type: 'string' },
      { name: 'kubernetes.pod.name', type: 'string' },
      // Fields with @ symbols for backtick testing
      { name: 'host@name', type: 'string' },
      { name: 'user@domain', type: 'string' },
      // Fields with both . and @
      { name: 'service.name@env', type: 'string' },
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
    return getSimplifiedPPLSuggestions({
      query,
      indexPattern: mockIndexPattern,
      position,
      language: 'PPL',
      selectionStart: 0,
      selectionEnd: 0,
      services: mockServices,
    });
  };

  const getSimpleSuggestionsForIndexPattern = async (
    query: string,
    indexPattern: IndexPattern,
    position: monaco.Position = new monaco.Position(1, query.length + 1)
  ) => {
    return getSimplifiedPPLSuggestions({
      query,
      indexPattern,
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

  const checkSuggestionsShouldNotContain = (
    result: QuerySuggestion[],
    expected: Partial<QuerySuggestion>
  ) => {
    if (expected.text && expected.type) {
      expect(
        result.some(
          (suggestion) => suggestion.text === expected.text && suggestion.type === expected.type
        )
      ).toBeFalsy();
    } else if (expected.text) {
      expect(result.some((suggestion) => suggestion.text === expected.text)).toBeFalsy();
    } else if (expected.type) {
      expect(result.some((suggestion) => suggestion.type === expected.type)).toBeFalsy();
    }
  };

  const buildRuntimeGrammar = (overrides: Partial<CachedGrammar> = {}): CachedGrammar => {
    const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(''));
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new SimplifiedOpenSearchPPLParser(tokenStream);

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
      grammarHash: 'runtime-test-grammar',
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

  describe('getSuggestions', () => {
    it('should return empty array when services are missing', async () => {
      const result = await getSimplifiedPPLSuggestions({
        query: '',
        indexPattern: mockIndexPattern,
        position: mockPosition,
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: (null as unknown) as IDataPluginServices,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when index pattern are missing', async () => {
      const result = await getSimplifiedPPLSuggestions({
        query: '',
        indexPattern: (null as unknown) as IndexPattern,
        position: mockPosition,
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: mockServices,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when apname are missing', async () => {
      const result = await getSimplifiedPPLSuggestions({
        query: '',
        indexPattern: mockIndexPattern,
        position: mockPosition,
        language: 'PPL',
        selectionStart: 0,
        selectionEnd: 0,
        services: {
          ...mockServices,
          appName: '',
        },
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

    it('should suggest source, columns names when query is empty', async () => {
      const result = await getSimpleSuggestions(' ');
      checkSuggestionsContain(result, {
        text: 'SOURCE',
        type: monaco.languages.CompletionItemKind.Function,
      });

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should support query containing only fields, suggest other columns and Pipe comaands', async () => {
      const result = await getSimpleSuggestions('field1 = "value1" ');

      checkSuggestionsContain(result, {
        text: 'field2',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(result, {
        text: '|',
        type: monaco.languages.CompletionItemKind.Operator,
      });
    });

    it('should support query containing source followed by fields value pairs', async () => {
      const result = await getSimpleSuggestions(
        'source = test-index field1 = "value1" field1 = "value2" '
      );

      checkSuggestionsContain(result, {
        text: 'field3',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(result, {
        text: '|',
        type: monaco.languages.CompletionItemKind.Operator,
      });
    });

    it('should suggest columns when suggestColumns is true', async () => {
      const result = await getSimpleSuggestions('source = test-index | where ');

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should always suggest columns when we have a fieldList command', async () => {
      const result = await getSimpleSuggestions('source = test-index | fields field1, ');

      checkSuggestionsContain(result, {
        text: 'field2',
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
          type: monaco.languages.CompletionItemKind.Module,
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

    it('should not suggest fieldName after a fieldName in fields command', async () => {
      const result = await getSimpleSuggestions('source = test-index | fields field1 ');

      checkSuggestionsShouldNotContain(result, {
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should not suggest fieldName after a fieldName in sort command', async () => {
      const result = await getSimpleSuggestions('source = test-index | sort field1 ');

      checkSuggestionsShouldNotContain(result, {
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should suggest fieldName after a fieldName and operator in sort command', async () => {
      const result = await getSimpleSuggestions('source = test-index | sort field1 , ');

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should only show up fields selcted in fields commands for subsequent commands', async () => {
      const result = await getSimpleSuggestions(
        'source = test-index | fields field1, field2 | where '
      );

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(result, {
        text: 'field2',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should remove fields selcted in fields commands with - for subsequent commands', async () => {
      const result = await getSimpleSuggestions(
        'source = test-index | fields - field1, field2 | where '
      );

      checkSuggestionsContain(result, {
        text: 'field3',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(result, {
        text: 'field4',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsShouldNotContain(result, {
        text: 'field2',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsShouldNotContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('rename a field should remove original fieldName and suggest new field name in subsequent commands', async () => {
      const result = await getSimpleSuggestions(
        'source = test-index | rename field1 as newField1 | where '
      );

      checkSuggestionsContain(result, {
        text: 'newField1',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsShouldNotContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('stats command should only show the fieldName that are referenced by as and by', async () => {
      const result = await getSimpleSuggestions(
        'source = test-index | stats count() as counter by field1 | where '
      );

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(result, {
        text: 'counter',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should devalue the fieldNames starting _', async () => {
      const results = await getSimpleSuggestions('source = test-index | where ');

      const resultField = results.find((result) => result.text === '_field5');
      expect(resultField?.sortText).toBe('99');
    });

    it('should have appropriate insert text corresponding to each of the stats function', async () => {
      const results = await getSimpleSuggestions('source = test-index | stats ');

      const resultAggFunc1 = results.find((result) => result.text === 'count()');
      expect(resultAggFunc1?.insertText).toBe('count() $0');

      const resultAggFunc2 = results.find((result) => result.text === 'avg()');
      expect(resultAggFunc2?.insertText).toBe('avg($0)');
    });

    it('should set the value of suggestFieldsInAggregateFunction appropriately', async () => {
      const results = await getSimpleSuggestions('source = test-index | stats avg( ');

      const resultField = results.find((result) => result.text === 'field1');
      expect(resultField?.insertText).toBe('field1');

      const results1 = await getSimpleSuggestions('source = test-index | where ');

      const resultField1 = results1.find((result) => result.text === 'field1');
      expect(resultField1?.insertText).toBe('field1 ');
    });

    it('should show the documentations for PPL commands', async () => {
      const results = await getSimpleSuggestions('source = test-index | ');

      const resultField = results.find((result) => result.text === 'WHERE');
      expect(resultField?.documentation).not.toBeFalsy();
    });

    it('should not show the documentations unsupported PPL commands', async () => {
      const results = await getSimpleSuggestions('source = test-index ');

      const resultField = results.find((result) => result.text === '|');
      expect(resultField?.documentation).toBeFalsy();
    });

    it('should suggest span method in by clause', async () => {
      const results = await getSimpleSuggestions('source = test-index | stats count() by ');

      checkSuggestionsContain(results, {
        text: 'SPAN()',
        type: monaco.languages.CompletionItemKind.Module,
      });
    });

    it('should suggest match method in where clause', async () => {
      const results = await getSimpleSuggestions('source = test-index | where ');

      checkSuggestionsContain(results, {
        text: 'MATCH()',
        type: monaco.languages.CompletionItemKind.Module,
      });

      checkSuggestionsContain(results, {
        text: 'MATCH_PHRASE()',
        type: monaco.languages.CompletionItemKind.Module,
      });

      checkSuggestionsContain(results, {
        text: 'MATCH_PHRASE_PREFIX()',
        type: monaco.languages.CompletionItemKind.Module,
      });

      checkSuggestionsContain(results, {
        text: 'MATCH_BOOL_PREFIX()',
        type: monaco.languages.CompletionItemKind.Module,
      });
    });

    it('should suggest match method in parse clause', async () => {
      const results = await getSimpleSuggestions('source = test-index | parse ');

      checkSuggestionsContain(results, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });

      checkSuggestionsContain(results, {
        text: 'field4',
        type: monaco.languages.CompletionItemKind.Field,
      });

      const results1 = await getSimpleSuggestions('source = test-index | parse field1 ');

      checkSuggestionsContain(results1, {
        text: "''",
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    it('should suggest aggregate functions with Module completion item kind', async () => {
      const result = await getSimpleSuggestions('source = test-index | stats ');
      Object.keys(PPL_AGGREGATE_FUNCTIONS).forEach((af) => {
        checkSuggestionsContain(result, {
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Module,
        });
      });
    });

    it('should wrap fields with dots and @ symbols in backticks for fields command', async () => {
      const results = await getSimpleSuggestions('source = test-index | fields ');
      const resultField1 = results.find((result) => result.text === 'resource.attributes.host');
      expect(resultField1?.insertText).toBe('`resource.attributes.host` ');

      const resultField2 = results.find((result) => result.text === 'host@name');
      expect(resultField2?.insertText).toBe('`host@name` ');
    });

    it('should suggest fields/values based on context within quotes', async () => {
      // Suggesting Fields
      const query = 'source = test-index | where ``';
      const position = new monaco.Position(1, query.length);

      const results = await getSimpleSuggestions(query, position);
      const resultField = results.find((result) => result.text === 'resource.attributes.host');
      expect(resultField?.insertText).toBe('resource.attributes.host');

      const mockedValues = ['value1', 'value2'];
      jest.spyOn(utils, 'fetchColumnValues').mockResolvedValue(mockedValues);

      // Suggesting Values
      const query1 = 'source = test-index | where field1 = ""';
      const position1 = new monaco.Position(1, query1.length);
      const results1 = await getSimpleSuggestions(query1, position1);

      const resultValue = results1.find((result) => result.text === 'value1');
      expect(resultValue?.insertText).toBe('value1');
    });

    it('should include query snippet suggestions in results', async () => {
      const mockSnippetSuggestions = [
        {
          text: 'stats count() by field1',
          insertText: 'stats count() by field1 ',
          type: monaco.languages.CompletionItemKind.Reference,
          detail: 'Saved Query Snippet',
        },
      ];

      // Override the default mock for this specific test
      (querySnippets.getPPLQuerySnippetForSuggestions as jest.Mock).mockResolvedValue(
        mockSnippetSuggestions
      );

      const result = await getSimpleSuggestions('source = test-index | ');

      expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalled();
      checkSuggestionsContain(result, {
        text: 'stats count() by field1',
        type: monaco.languages.CompletionItemKind.Reference,
      });
    });

    it('should pass correct query text to snippet suggestions', async () => {
      const query = 'source = test-index | where field1 = "value" | ';
      const position = new monaco.Position(1, query.length);

      await getSimpleSuggestions(query, position);

      expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalledWith(query.trim());
    });

    it('should handle multiline queries correctly for snippet suggestions', async () => {
      const query = `source = test-index
      | where field1 = "value"
      | `;
      const position = new monaco.Position(3, 7); // Line 3, column 7

      await getSimpleSuggestions(query, position);

      const expectedQueryTillCursor = `source = test-index
      | where field1 = "value"
      `;
      expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalledWith(
        expectedQueryTillCursor
      );
    });

    describe('runtime grammar pipe-first', () => {
      const runtimeIndexPattern = ({
        ...mockIndexPattern,
        dataSourceRef: { id: 'runtime-ds', version: '3.6.0' },
      } as unknown) as IndexPattern;

      it('should use runtime grammar cache for pipe-first suggestions', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammarSpy = jest
          .spyOn(pplGrammarCache, 'getCachedGrammar')
          .mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        expect(grammarSpy).toHaveBeenCalledWith('runtime-ds');
        checkSuggestionsContain(result, {
          text: 'WHERE',
          type: monaco.languages.CompletionItemKind.Function,
        });
        checkSuggestionsShouldNotContain(result, {
          text: 'SOURCE',
        });
      });

      it('should use runtime grammar cache for source-prefixed suggestions', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const parseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern('source = ', runtimeIndexPattern);

        expect(parseSpy).toHaveBeenCalled();
        checkSuggestionsContain(result, {
          text: 'test-index',
          type: monaco.languages.CompletionItemKind.Struct,
        });
      });

      it('should honor backend pipeStartRuleIndex when provided', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const parseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(
          buildRuntimeGrammar({
            grammarHash: 'runtime-test-root-start',
            pipeStartRuleIndex: 0,
          })
        );

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        expect(result.length).toBeGreaterThan(0);
        expect(parseSpy).toHaveBeenCalledWith(0);
      });

      it('should isolate ParserInterpreter follow-set cache by runtime grammar hash', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest
          .spyOn(pplGrammarCache, 'getCachedGrammar')
          .mockReturnValueOnce(buildRuntimeGrammar({ grammarHash: 'runtime-cache-a' }))
          .mockReturnValueOnce(buildRuntimeGrammar({ grammarHash: 'runtime-cache-b' }))
          .mockReturnValueOnce(buildRuntimeGrammar({ grammarHash: 'runtime-cache-a' }));

        const originalFollowSetsByATN = (CodeCompletionCore as any).followSetsByATN;
        const followSetsByATN = new Map<string, unknown>();
        (CodeCompletionCore as any).followSetsByATN = followSetsByATN;

        try {
          await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);
          const grammarABucket = followSetsByATN.get('ParserInterpreter');
          expect(grammarABucket).toBeDefined();

          await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);
          const grammarBBucket = followSetsByATN.get('ParserInterpreter');
          expect(grammarBBucket).toBeDefined();
          expect(grammarBBucket).not.toBe(grammarABucket);

          await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);
          const grammarABucketAgain = followSetsByATN.get('ParserInterpreter');
          expect(grammarABucketAgain).toBe(grammarABucket);
        } finally {
          (CodeCompletionCore as any).followSetsByATN = originalFollowSetsByATN;
        }
      });

      it('should use cached runtime grammar when datasource version metadata is missing', async () => {
        const parseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
        const shouldFetchSpy = jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend');
        jest.spyOn(pplGrammarCache, 'getCachedVersion').mockReturnValue(undefined);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const indexPatternWithoutVersion = ({
          ...mockIndexPattern,
          dataSourceRef: { id: 'runtime-ds' },
        } as unknown) as IndexPattern;
        const result = await getSimpleSuggestionsForIndexPattern('| ', indexPatternWithoutVersion);

        expect(result.length).toBeGreaterThan(0);
        expect(parseSpy).toHaveBeenCalled();
        expect(shouldFetchSpy).not.toHaveBeenCalled();
      });

      it('should suggest equals after source keyword on runtime path', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern('source ', runtimeIndexPattern);

        expect(result.some((s) => s.text === '=')).toBeTruthy();
      });

      it('should suggest equals after rex field on runtime path', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern(
          '| rex field ',
          runtimeIndexPattern
        );

        expect(result.some((s) => s.text === '=')).toBeTruthy();
      });

      it('should suggest fields after rex field equals on runtime path', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern(
          '| rex field = ',
          runtimeIndexPattern
        );

        checkSuggestionsContain(result, {
          text: 'field1',
          type: monaco.languages.CompletionItemKind.Field,
        });
      });

      it('should suggest full schema fields after rex field equals on runtime path', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const result = await getSimpleSuggestionsForIndexPattern(
          '| rex field = ',
          runtimeIndexPattern
        );
        const suggestedFieldNames = result
          .filter((s) => s.type === monaco.languages.CompletionItemKind.Field)
          .map((s) => s.text);
        const expectedFieldNames = runtimeIndexPattern.fields
          .filter((field) => !field?.subType)
          .map((field) => field.name);

        expectedFieldNames.forEach((name) => {
          expect(suggestedFieldNames).toContain(name);
        });
      });

      it('should keep rex field equals suggestions field-only and include subtype fields', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());
        (querySnippets.getPPLQuerySnippetForSuggestions as jest.Mock).mockResolvedValue([
          {
            text: '{} (()',
            insertText: '{} (() ',
            type: monaco.languages.CompletionItemKind.Reference,
            detail: 'Saved Query Snippet',
          },
        ]);

        const runtimeIndexPatternWithSubtype = ({
          ...runtimeIndexPattern,
          fields: [
            ...(runtimeIndexPattern.fields as Array<{
              name: string;
              type: string;
              subType?: unknown;
            }>),
            {
              name: 'field1.keyword',
              type: 'string',
              subType: {
                multi: {
                  parent: 'field1',
                },
              },
            },
          ],
        } as unknown) as IndexPattern;

        const result = await getSimpleSuggestionsForIndexPattern(
          '| rex field = ',
          runtimeIndexPatternWithSubtype
        );

        checkSuggestionsContain(result, {
          text: 'field1.keyword',
          type: monaco.languages.CompletionItemKind.Field,
        });
        expect(
          result.every((s) => s.type === monaco.languages.CompletionItemKind.Field)
        ).toBeTruthy();
      });

      it('should resolve datasource id from query when index pattern has no dataSourceRef', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammarSpy = jest
          .spyOn(pplGrammarCache, 'getCachedGrammar')
          .mockReturnValue(buildRuntimeGrammar());

        const servicesWithDatasetRef = ({
          ...mockServices,
          data: {
            query: {
              queryString: {
                getQuery: () => ({
                  dataset: {
                    dataSource: {
                      id: 'runtime-ds',
                      version: '3.6.0',
                    },
                  },
                }),
              },
            },
          },
        } as unknown) as IDataPluginServices;

        const result = await getSimplifiedPPLSuggestions({
          query: '| ',
          indexPattern: mockIndexPattern,
          position: new monaco.Position(1, 3),
          language: 'PPL',
          selectionStart: 0,
          selectionEnd: 0,
          services: servicesWithDatasetRef,
        });

        expect(grammarSpy).toHaveBeenCalledWith('runtime-ds');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should keep runtime cursor behavior when tokenDictionary whitespace is missing', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(
          buildRuntimeGrammar({
            tokenDictionary: {} as any,
          })
        );

        const result = await getSimpleSuggestionsForIndexPattern('source ', runtimeIndexPattern);

        expect(result.some((s) => s.text === '=')).toBeTruthy();
      });

      it('should still expose command tokens when backend preferred rules include commands', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammar = buildRuntimeGrammar();
        const commandsRule = grammar.runtimeRuleNameToIndex.get('commands');
        grammar.rulesToVisit =
          typeof commandsRule === 'number' ? [commandsRule] : grammar.rulesToVisit;
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(grammar);

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        checkSuggestionsContain(result, {
          text: 'WHERE',
          type: monaco.languages.CompletionItemKind.Function,
        });
      });

      it('should not suppress literal command tokens even if backend ignoredTokens includes them', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammar = buildRuntimeGrammar();
        const appendToken = grammar.runtimeSymbolicNameToTokenType.get('APPEND');
        if (typeof appendToken === 'number') {
          grammar.ignoredTokens = [...grammar.ignoredTokens, appendToken];
        }
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(grammar);

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        expect(result.some((s) => s.text === 'APPEND')).toBeTruthy();
      });

      it('should include runtime symbolic keywords when literal names are missing', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammar = buildRuntimeGrammar();
        const whereToken = grammar.runtimeSymbolicNameToTokenType.get('WHERE');
        const originalVocabulary = grammar.vocabulary;
        const patchedVocabulary = Object.create(originalVocabulary);
        patchedVocabulary.getLiteralName = (tokenType: number) =>
          tokenType === whereToken ? null : originalVocabulary.getLiteralName(tokenType);
        grammar.vocabulary = patchedVocabulary;
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(grammar);

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        checkSuggestionsContain(result, {
          text: 'WHERE',
          type: monaco.languages.CompletionItemKind.Function,
        });
      });

      it('should classify runtime-only function keywords as functions from runtime context', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        const grammar = buildRuntimeGrammar();
        const runtimeOnlyTokenType = grammar.vocabulary.maxTokenType + 1000;
        const functionRuleIndex = grammar.runtimeRuleNameToIndex.get('collectionFunctionName') ?? 0;
        const originalVocabulary = grammar.vocabulary;
        const patchedVocabulary = Object.create(originalVocabulary);
        patchedVocabulary.getLiteralName = (tokenType: number) =>
          tokenType === runtimeOnlyTokenType
            ? "'mvappend'"
            : originalVocabulary.getLiteralName(tokenType);
        patchedVocabulary.getSymbolicName = (tokenType: number) =>
          tokenType === runtimeOnlyTokenType
            ? 'MVAPPEND'
            : originalVocabulary.getSymbolicName(tokenType);
        grammar.vocabulary = patchedVocabulary;
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(grammar);
        jest.spyOn(CodeCompletionCore.prototype, 'collectCandidates').mockReturnValue({
          tokens: new Map<number, number[]>([[runtimeOnlyTokenType, []]]),
          rules: new Map<number, { startTokenIndex: number; ruleList: number[] }>([
            [functionRuleIndex, { startTokenIndex: 0, ruleList: [functionRuleIndex] }],
          ]),
        } as any);

        const result = await getSimpleSuggestionsForIndexPattern(
          'source = test-index | where ',
          runtimeIndexPattern
        );

        const suggestion = result.find((s) => s.text === 'mvappend()');
        expect(suggestion).toBeTruthy();
        expect(suggestion?.type).toBe(monaco.languages.CompletionItemKind.Module);
      });

      it('should not render punctuation tokens as function calls when runtime ids drift', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const equalToken = SimplifiedOpenSearchPPLParser.EQUAL;
        const originalDetails = PPL_SUGGESTION_IMPORTANCE.get(equalToken);

        PPL_SUGGESTION_IMPORTANCE.set(equalToken, {
          importance: '6',
          type: 'Function',
          isFunction: true,
        });

        try {
          const result = await getSimpleSuggestionsForIndexPattern(
            '| rex field ',
            runtimeIndexPattern
          );
          expect(result.some((s) => s.text === '=()')).toBeFalsy();
          expect(result.some((s) => s.text === '=')).toBeTruthy();
        } finally {
          if (originalDetails) {
            PPL_SUGGESTION_IMPORTANCE.set(equalToken, originalDetails);
          } else {
            PPL_SUGGESTION_IMPORTANCE.delete(equalToken);
          }
        }
      });

      it('should fall back to compiled suggestions when runtime grammar cache is missing', async () => {
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(true);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(null);
        const runtimeParseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');

        const result = await getSimpleSuggestionsForIndexPattern('| ', runtimeIndexPattern);

        expect(runtimeParseSpy).not.toHaveBeenCalled();
        checkSuggestionsContain(result, {
          text: 'WHERE',
          type: monaco.languages.CompletionItemKind.Function,
        });
      });

      it('should use runtime grammar when cached grammar exists even if datasource version is unsupported', async () => {
        const runtimeParseSpy = jest.spyOn(ParserInterpreter.prototype, 'parse');
        jest.spyOn(pplGrammarCache, 'shouldFetchFromBackend').mockReturnValue(false);
        jest.spyOn(pplGrammarCache, 'getCachedGrammar').mockReturnValue(buildRuntimeGrammar());

        const unsupportedIndexPattern = ({
          ...mockIndexPattern,
          dataSourceRef: { id: 'runtime-ds', version: '3.5.0' },
        } as unknown) as IndexPattern;

        const result = await getSimpleSuggestionsForIndexPattern(
          '| rex field = ',
          unsupportedIndexPattern
        );

        expect(runtimeParseSpy).toHaveBeenCalled();
        checkSuggestionsContain(result, {
          text: 'field1',
          type: monaco.languages.CompletionItemKind.Field,
        });
      });
    });

    describe('extractQueryTillCursor behavior', () => {
      it('should handle single line queries correctly', async () => {
        const query = 'source = test-index | where field1 = "value" ';
        const position = new monaco.Position(1, 25); // At "value"

        await getSimpleSuggestions(query, position);

        expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalledWith(
          'source = test-index | wh'
        );
      });

      it('should handle multiline queries and extract text up to cursor', async () => {
        const query = `source = test-index
| where field1 = "value"
| stats count()`;
        const position = new monaco.Position(2, 10); // Line 2, column 10

        await getSimpleSuggestions(query, position);

        const expectedExtracted = `source = test-index
| where f`;
        expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalledWith(
          expectedExtracted
        );
      });

      it('should handle empty lines correctly', async () => {
        const query = `source = test-index

| where field1 = "value"`;
        const position = new monaco.Position(2, 1); // Empty line

        await getSimpleSuggestions(query, position);

        const expectedExtracted = `source = test-index
`;
        expect(querySnippets.getPPLQuerySnippetForSuggestions).toHaveBeenCalledWith(
          expectedExtracted
        );
      });
    });
  });
});
