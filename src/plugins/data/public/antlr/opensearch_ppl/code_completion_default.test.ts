/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getDefaultSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';
import { PPL_AGGREGATE_FUNCTIONS } from './constants';

describe('ppl code_completion', () => {
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

    describe('pipe-first queries', () => {
      it('should suggest pipeline commands when query starts with pipe', async () => {
        const result = await getSimpleSuggestions('| ');

        // Should suggest pipeline commands
        checkSuggestionsContain(result, {
          text: 'where',
          type: monaco.languages.CompletionItemKind.Keyword,
        });
        checkSuggestionsContain(result, {
          text: 'fields',
          type: monaco.languages.CompletionItemKind.Keyword,
        });
        checkSuggestionsContain(result, {
          text: 'stats',
          type: monaco.languages.CompletionItemKind.Keyword,
        });
        checkSuggestionsContain(result, {
          text: 'sort',
          type: monaco.languages.CompletionItemKind.Keyword,
        });
      });

      it('should suggest columns for pipe-first where command', async () => {
        const result = await getSimpleSuggestions('| where ');

        checkSuggestionsContain(result, {
          text: 'field1',
          type: monaco.languages.CompletionItemKind.Field,
        });
      });

      it('should suggest aggregate functions for pipe-first stats command', async () => {
        const result = await getSimpleSuggestions('| stats ');

        Object.keys(PPL_AGGREGATE_FUNCTIONS).forEach((af) => {
          checkSuggestionsContain(result, {
            text: `${af}()`,
            type: monaco.languages.CompletionItemKind.Function,
          });
        });
      });

      it('should suggest columns for pipe-first fields command', async () => {
        const result = await getSimpleSuggestions('| fields ');

        checkSuggestionsContain(result, {
          text: 'field1',
          type: monaco.languages.CompletionItemKind.Field,
        });
      });

      it('should handle pipe with leading whitespace', async () => {
        const result = await getSimpleSuggestions('  | ');

        checkSuggestionsContain(result, {
          text: 'where',
          type: monaco.languages.CompletionItemKind.Keyword,
        });
      });

      it('should not affect normal source-prefixed queries', async () => {
        const result = await getSimpleSuggestions('source = test-index | where ');

        checkSuggestionsContain(result, {
          text: 'field1',
          type: monaco.languages.CompletionItemKind.Field,
        });
      });
    });
  });
});
