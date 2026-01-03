/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as sharedUtils from '../shared/utils';

// Mock parseQuery in shared/utils
jest.mock('../shared/utils', () => ({
  parseQuery: jest.fn(),
}));

// Ensure Monaco languages constants are available in tests
jest.mock('@osd/monaco', () => {
  const actual = jest.requireActual('@osd/monaco');
  return {
    ...actual,
    monaco: {
      ...actual.monaco,
      languages: {
        ...actual.monaco?.languages,
        CompletionItemKind: {
          Function: 1,
          Field: 4,
          Class: 6,
          Interface: 7,
          Unit: 12,
          Keyword: 14,
        },
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 4,
        },
      },
      Range: actual.monaco?.Range || jest.fn(),
    },
  };
});

const mockParseQuery = sharedUtils.parseQuery as jest.Mock;

describe('promql code_completion', () => {
  describe('getSuggestions', () => {
    const mockIndexPattern = {
      id: 'test-datasource-id',
      title: 'test-index',
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
        { name: 'field2', type: 'boolean' },
      ],
    } as IndexPattern;

    const mockPrometheusClient = {
      getMetricMetadata: jest.fn().mockResolvedValue({
        prometheus_http_requests_total: [
          {
            type: 'counter',
            help: 'Total number of HTTP requests',
          },
        ],
      }),
      getLabels: jest.fn().mockResolvedValue([]),
      getLabelValues: jest.fn().mockResolvedValue([]),
    };

    const mockServices = ({
      appName: 'test-app',
      data: {
        resourceClientFactory: {
          get: jest.fn().mockReturnValue(mockPrometheusClient),
        },
      },
    } as unknown) as IDataPluginServices;

    const mockPosition = {
      lineNumber: 1,
      column: 1,
    } as monaco.Position;

    beforeEach(() => {
      jest.clearAllMocks();

      // Re-setup ALL mocks that were cleared
      (mockServices.data.resourceClientFactory.get as jest.Mock).mockReturnValue(
        mockPrometheusClient
      );
      mockPrometheusClient.getMetricMetadata.mockResolvedValue({
        prometheus_http_requests_total: [
          {
            type: 'counter',
            help: 'Total number of HTTP requests',
          },
        ],
      });
      mockPrometheusClient.getLabels.mockResolvedValue([]);
      mockPrometheusClient.getLabelValues.mockResolvedValue([]);

      // Default mock: return suggestions for metrics, functions, and aggregations
      mockParseQuery.mockReturnValue({
        errors: [],
        suggestKeywords: [],
        suggestMetrics: true,
        suggestFunctionNames: true,
        suggestAggregationOperators: true,
      });
    });

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
        type: monaco.languages.CompletionItemKind.Function,
      });
    });

    it('should suggest metrics when suggestMetrics is true', async () => {
      const result = await getSimpleSuggestions('');

      checkSuggestionsContain(result, {
        text: 'prometheus_http_requests_total',
        type: monaco.languages.CompletionItemKind.Field,
      });
    });

    it('should set detail field on suggestions', async () => {
      const result = await getSimpleSuggestions('');

      const functionSuggestion = result.find((s) => s.text === 'rate');
      expect(functionSuggestion).toBeDefined();
      expect(functionSuggestion?.detail).toBeDefined();
      expect(typeof functionSuggestion?.detail).toBe('string');
    });

    it('should set documentation field on all suggestions', async () => {
      const result = await getSimpleSuggestions('');

      expect(result.length).toBeGreaterThan(0);
      result.forEach((suggestion) => {
        expect(suggestion.documentation).toBeDefined();
        expect(typeof suggestion.documentation).toBe('string');
      });
    });

    it('should include insertText snippet for function suggestions', async () => {
      const result = await getSimpleSuggestions('');

      const functionSuggestion = result.find((s) => s.text === 'rate');
      expect(functionSuggestion).toBeDefined();
      expect(functionSuggestion?.insertText).toBe('rate($0)');
      expect(functionSuggestion?.insertTextRules).toBe(
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      );
    });

    it('should call prometheus client with indexPattern.id', async () => {
      await getSimpleSuggestions('');

      expect(mockPrometheusClient.getMetricMetadata).toHaveBeenCalledWith(mockIndexPattern.id);
    });
  });
});
