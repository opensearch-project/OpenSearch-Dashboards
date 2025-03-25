/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';

describe('promql code_completion', () => {
  describe('getSuggestions', () => {
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
      return getSuggestions({
        query,
        indexPattern: mockIndexPattern,
        position,
        language: 'PROMQL',
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
      const result = await getSuggestions({
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

    it('should suggest functions', async () => {
      const result = await getSimpleSuggestions('');

      checkSuggestionsContain(result, {
        text: 'rate',
        type: monaco.languages.CompletionItemKind.Keyword,
      });
    });

    // TODO: update with a mocked metrics api call
    it('should suggest metrics when suggestMetrics is true', async () => {
      const result = await getSimpleSuggestions('');

      checkSuggestionsContain(result, {
        text: 'prometheus_http_requests_total',
        type: monaco.languages.CompletionItemKind.Method,
      });
    });

    it.skip('should suggest all labels when suggestLabels is true and NO metric specified', async () => {});

    it.skip('should suggest only necessary labels when suggestLabels is true and HAS metric specified', async () => {});

    it.skip('should suggest label values when suggestLabelValues is true', async () => {});

    it.skip('should suggest time range units', async () => {});

    // TODO: mock like below for real calling of functions

    // it.skip('should suggest values after column names', async () => {
    //   const mockedValues = ['value1', 'value2'];
    //   jest.spyOn(utils, 'fetchColumnValues').mockResolvedValue(mockedValues);

    //   const result = await getSimpleSuggestions('SELECT * FROM test-index WHERE field1 = ');

    //   expect(utils.fetchColumnValues).toHaveBeenCalled();
    //   mockedValues.forEach((val) => {
    //     checkSuggestionsContain(result, {
    //       text: val,
    //       type: monaco.languages.CompletionItemKind.Value,
    //     });
    //   });
    // });
  });
});
