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
    const mockDataSourceMeta = { prometheusUrl: 'http://localhost:9090' };
    // @ts-expect-error TS2352 TODO(ts-error): fixme
    const mockIndexPattern = {
      id: 'test-datasource-id',
      title: 'test-index',
      dataSourceMeta: mockDataSourceMeta,
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
        { name: 'field2', type: 'boolean' },
      ],
    } as IndexPattern;

    const mockPrometheusClient = {
      getMetrics: jest.fn().mockResolvedValue(['prometheus_http_requests_total']),
      getLabels: jest.fn().mockResolvedValue([]),
      getLabelValues: jest.fn().mockResolvedValue([]),
    };

    const mockTimeRange = { from: 'now-15m', to: 'now' };

    const mockServices = {
      appName: 'test-app',
      data: {
        resourceClientFactory: {
          getForDatasetType: jest.fn().mockReturnValue(mockPrometheusClient),
        },
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({}),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue(mockTimeRange),
            },
          },
        },
      },
    } as unknown as IDataPluginServices;

    const mockPosition = {
      lineNumber: 1,
      column: 1,
    } as monaco.Position;

    beforeEach(() => {
      jest.clearAllMocks();

      // Re-setup ALL mocks that were cleared
      (mockServices.data.resourceClientFactory.getForDatasetType as jest.Mock).mockReturnValue(
        mockPrometheusClient
      );
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({});
      mockPrometheusClient.getMetrics.mockResolvedValue(['prometheus_http_requests_total']);
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
        indexPattern: null as unknown as IndexPattern,
        position: mockPosition,
        language: 'SQL',
        selectionStart: 0,
        selectionEnd: 0,
        services: null as unknown as IDataPluginServices,
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
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      expect(functionSuggestion?.detail).toBeDefined();
      // @ts-expect-error TS2339 TODO(ts-error): fixme
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
      // @ts-expect-error TS2551 TODO(ts-error): fixme
      expect(functionSuggestion?.insertTextRules).toBe(
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      );
    });

    it('should call prometheus client with indexPattern.id, dataSourceMeta and timeRange', async () => {
      await getSimpleSuggestions('');

      expect(mockPrometheusClient.getMetrics).toHaveBeenCalledWith(
        mockIndexPattern.id,
        mockDataSourceMeta,
        mockTimeRange
      );
      expect(mockServices.data.resourceClientFactory.getForDatasetType).toHaveBeenCalledWith(
        undefined,
        'prometheus'
      );
    });

    it("lists metrics from the resource client of the dataset's type", async () => {
      const myClient = {
        getMetrics: jest.fn().mockResolvedValue(['my_metric']),
        getLabels: jest.fn().mockResolvedValue([]),
        getLabelValues: jest.fn().mockResolvedValue([]),
      };
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({
        dataset: { id: 'my-dataset', type: 'MY_DATASET_TYPE' },
      });
      (mockServices.data.resourceClientFactory.getForDatasetType as jest.Mock).mockImplementation(
        (datasetType: string) => (datasetType === 'MY_DATASET_TYPE' ? myClient : undefined)
      );

      const result = await getSimpleSuggestions('');

      expect(mockServices.data.resourceClientFactory.getForDatasetType).toHaveBeenCalledWith(
        'MY_DATASET_TYPE',
        'prometheus'
      );
      checkSuggestionsContain(result, {
        text: 'my_metric',
        type: monaco.languages.CompletionItemKind.Field,
      });
      expect(mockPrometheusClient.getMetrics).not.toHaveBeenCalled();
    });

    it('keeps the static suggestions when no resource client is available', async () => {
      (mockServices.data.resourceClientFactory.getForDatasetType as jest.Mock).mockReturnValue(
        undefined
      );

      const result = await getSimpleSuggestions('');

      checkSuggestionsContain(result, {
        text: 'rate',
        type: monaco.languages.CompletionItemKind.Function,
      });
    });
  });
});
