/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSQLSuggestions } from './sql_suggestions';
import { SQL_SYMBOLS } from '../../../data/public';
import { IndexPattern } from '../../../data/public';
import { IDataPluginServices } from '../../../data/public';
import { QuerySuggestion } from '../../../data/public';
import * as utils from '../../../data/public/antlr/shared/utils';

describe('SQL suggestions', () => {
  describe('getSQLSuggestions', () => {
    const mockIndexPattern = {
      title: 'test-index',
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
        { name: 'field2', type: 'boolean' },
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
      return (
        getSQLSuggestions({
          query,
          indexPattern: mockIndexPattern,
          position,
          language: 'SQL',
          selectionStart: 0,
          selectionEnd: 0,
          services: mockServices,
        }) || []
      ); // Ensure we always return an array
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
      const result = await getSQLSuggestions({
        query: '',
        indexPattern: (null as unknown) as IndexPattern,
        position: mockPosition,
        language: 'SQL',
        selectionStart: 0,
        selectionEnd: 0,
        services: (null as unknown) as IDataPluginServices,
      });

      expect(result).toEqual([]);
    });

    it('should suggest table name when suggestViewsOrTables is true', async () => {
      const result = await getSimpleSuggestions('SELECT * FROM ');

      checkSuggestionsContain(result, {
        text: 'test-index',
        type: monaco.languages.CompletionItemKind.Struct,
      });
    });

    it('should suggest columns when suggestColumns is true', async () => {
      const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE ');

      checkSuggestionsContain(result, {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should suggest EQ for column value predicate', async () => {
      const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE field1 ');

      checkSuggestionsContain(result, {
        text: '=',
        type: monaco.languages.CompletionItemKind.Operator,
      });
    });

    it('should suggest LPAREN for column value predicate', async () => {
      const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE field1 IN ');

      checkSuggestionsContain(result, {
        text: '(',
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    it('should suggest END_IN_TERMs for column value predicate', async () => {
      const result = await getSimpleSuggestions(
        "SELECT * FROM test-index WHERE field1 IN ( 'value' "
      );

      [',', ')'].forEach((term) => {
        checkSuggestionsContain(result, {
          text: term,
          type: monaco.languages.CompletionItemKind.Keyword,
        });
      });
    });

    it('should suggest aggregate functions when appropriate', async () => {
      const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE ');

      SQL_SYMBOLS.AGREGATE_FUNCTIONS.forEach((func) => {
        checkSuggestionsContain(result, {
          text: func,
          type: monaco.languages.CompletionItemKind.Function,
        });
      });
    });

    it('should suggest values after column names', async () => {
      const mockedValues = ['value1', 'value2'];
      jest.spyOn(utils, 'fetchColumnValues').mockResolvedValue(mockedValues);

      const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE field1 = ');

      expect(utils.fetchColumnValues).toHaveBeenCalled();
      mockedValues.forEach((val) => {
        checkSuggestionsContain(result, {
          text: val,
          type: monaco.languages.CompletionItemKind.Value,
        });
      });
    });
  });
});
