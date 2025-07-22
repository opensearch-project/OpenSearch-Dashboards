/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSimplifiedPPLSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';
import { PPL_AGGREGATE_FUNCTIONS } from './constants';

describe('ppl code_completion', () => {
  const mockIndexPattern = {
    title: 'test-index',
    fields: [
      { name: '_field5', type: 'string' },
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'number' },
      { name: 'field3', type: 'boolean' },
      { name: 'field4', type: 'string' },
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
        text: 'source',
        type: monaco.languages.CompletionItemKind.Keyword,
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
        type: monaco.languages.CompletionItemKind.Keyword,
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
        type: monaco.languages.CompletionItemKind.Keyword,
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

      const resultField = results.find((result) => result.text === 'where');
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
        text: 'span()',
        type: monaco.languages.CompletionItemKind.Function,
      });
    });

    it('should suggest match method in where clause', async () => {
      const results = await getSimpleSuggestions('source = test-index | where ');

      checkSuggestionsContain(results, {
        text: 'match()',
        type: monaco.languages.CompletionItemKind.Function,
      });

      checkSuggestionsContain(results, {
        text: 'match_phrase()',
        type: monaco.languages.CompletionItemKind.Function,
      });

      checkSuggestionsContain(results, {
        text: 'match_phrase_prefix()',
        type: monaco.languages.CompletionItemKind.Function,
      });

      checkSuggestionsContain(results, {
        text: 'match_bool_prefix()',
        type: monaco.languages.CompletionItemKind.Function,
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
  });
});
