/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import {
  fetchColumnValues,
  fetchData,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
} from './utils';
import { IQueryStart, QueryStringContract, QueryStringManager } from '../../query';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { monaco } from '@osd/monaco';
import { SuggestionItemDetailsTags } from './constants';
import { DataPublicPluginStart, IDataPluginServices } from '../../types';
import { HttpSetup } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { UI_SETTINGS } from '../../../common';

describe('fetchData', () => {
  it('should fetch data using the dataSourceRequestHandler', async () => {
    const mockTables = ['table1', 'table2'];
    const mockQuery = {
      language: 'kuery',
      dataset: { id: 'db', title: 'db', dataSource: { id: 'testId', title: 'testTitle' } },
    };
    const mockQueryFormatter = jest.fn((table, dataSourceId, title) => ({
      query: {
        query: `formatted ${table}`,
        format: 'jdbc',
        ...mockQuery,
      },
    }));
    const mockApi: any = {
      fetch: jest.fn().mockResolvedValue('fetchedData'),
    };
    const mockQueryString: Partial<QueryStringManager> = {
      getUpdates$: jest.fn().mockReturnValue(of(mockQuery)),
      getQuery: jest.fn().mockReturnValue(mockQuery),
    };

    const result = await fetchData(
      mockTables,
      mockQueryFormatter,
      mockApi,
      mockQueryString as QueryStringManager
    );
    expect(result).toEqual(['fetchedData', 'fetchedData']);
    expect(mockQueryFormatter).toHaveBeenCalledWith('table1', 'testId', 'testTitle');
    expect(mockQueryFormatter).toHaveBeenCalledWith('table2', 'testId', 'testTitle');
  });

  it('should fetch data using the defaultRequestHandler', async () => {
    const mockTables = ['table1', 'table2'];
    const mockQuery = {
      language: 'kuery',
      dataset: { id: 'db', title: 'db', dataSource: { id: 'testId', title: 'testTitle' } },
    };
    const mockQueryFormatter = jest.fn((table) => ({
      query: { qs: `formatted ${table}`, format: 'jdbc', ...mockQuery },
    }));
    const mockApi: any = {
      fetch: jest.fn().mockResolvedValue('fetchedData'),
    };
    const mockQueryString: Partial<QueryStringManager> = {
      getUpdates$: jest.fn().mockReturnValue(of(undefined)),
      getQuery: jest.fn().mockReturnValue(undefined),
    };

    const result = await fetchData(
      mockTables,
      mockQueryFormatter,
      mockApi,
      mockQueryString as QueryStringManager
    );
    expect(result).toEqual(['fetchedData', 'fetchedData']);
    expect(mockQueryFormatter).toHaveBeenCalledWith('table1');
    expect(mockQueryFormatter).toHaveBeenCalledWith('table2');
  });
});

describe('formatFieldsToSuggestions', () => {
  let mockIndexPattern: IndexPattern;

  beforeEach(() => {
    // Setup mock index pattern
    mockIndexPattern = {
      fields: [
        { name: 'timestamp', type: 'date' },
        { name: 'message', type: 'text' },
        { name: 'status', type: 'keyword' },
      ],
    } as IndexPattern;
  });

  test('should fetch field suggestions from index pattern', async () => {
    const result = formatFieldsToSuggestions(mockIndexPattern);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      {
        detail: 'Field: date',
        text: 'timestamp',
        type: monaco.languages.CompletionItemKind.Field,
      },
      { detail: 'Field: text', text: 'message', type: monaco.languages.CompletionItemKind.Field },
      {
        detail: 'Field: keyword',
        text: 'status',
        type: monaco.languages.CompletionItemKind.Field,
      },
    ]);
  });

  test('should fetch suggestions with modified insert text', async () => {
    const result = formatFieldsToSuggestions(mockIndexPattern, (f: any) => `${f} : `);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      {
        detail: 'Field: date',
        insertText: 'timestamp : ',
        text: 'timestamp',
        type: monaco.languages.CompletionItemKind.Field,
      },
      {
        detail: 'Field: text',
        insertText: 'message : ',
        text: 'message',
        type: monaco.languages.CompletionItemKind.Field,
      },
      {
        detail: 'Field: keyword',
        insertText: 'status : ',
        text: 'status',
        type: monaco.languages.CompletionItemKind.Field,
      },
    ]);
  });

  test('should fetch suggestions with sort importance', async () => {
    const result = formatFieldsToSuggestions(mockIndexPattern, (f: any) => `${f} = `, '01');

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      {
        detail: 'Field: date',
        insertText: 'timestamp = ',
        text: 'timestamp',
        type: monaco.languages.CompletionItemKind.Field,
        sortText: '01',
      },
      {
        detail: 'Field: text',
        insertText: 'message = ',
        text: 'message',
        type: monaco.languages.CompletionItemKind.Field,
        sortText: '01',
      },
      {
        detail: 'Field: keyword',
        insertText: 'status = ',
        text: 'status',
        type: monaco.languages.CompletionItemKind.Field,
        sortText: '01',
      },
    ]);
  });
});

describe('formatValuesToSuggestions', () => {
  const stringQuoter = (val: any) => (typeof val === 'string' ? `"${val}" ` : `${val} `);

  it('should format string values correctly', () => {
    const values = ['apple', 'banana', 'cherry'];
    const result = formatValuesToSuggestions(values, stringQuoter);

    expect(result).toEqual([
      {
        text: 'apple',
        insertText: '"apple" ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '01',
      },
      {
        text: 'banana',
        insertText: '"banana" ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '02',
      },
      {
        text: 'cherry',
        insertText: '"cherry" ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '03',
      },
    ]);
  });

  it('should format numeric values correctly', () => {
    const values = [1, 2, 3];
    const result = formatValuesToSuggestions(values);

    expect(result).toEqual([
      {
        text: '1',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '01',
      },
      {
        text: '2',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '02',
      },
      {
        text: '3',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '03',
      },
    ]);
  });

  it('should handle empty array', () => {
    const values: string[] = [];
    const result = formatValuesToSuggestions(values);

    expect(result).toEqual([]);
  });

  it('should handle mixed type values', () => {
    const values = ['apple', 42, true];
    const result = formatValuesToSuggestions(values, stringQuoter);

    expect(result).toEqual([
      {
        text: 'apple',
        insertText: '"apple" ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '01',
      },
      {
        text: '42',
        insertText: '42 ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '02',
      },
      {
        text: 'true',
        insertText: 'true ',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: '03',
      },
    ]);
  });

  it('should pad sortText correctly for larger arrays', () => {
    const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const result = formatValuesToSuggestions(values, stringQuoter);

    expect(result[0].sortText).toBe('001');
    expect(result[9].sortText).toBe('010');
  });
});

describe('fetchColumnValues', () => {
  let mockServices: IDataPluginServices;
  let mockHttp: HttpSetup;
  let mockUiSettings: IUiSettingsClient;

  beforeEach(() => {
    mockHttp = ({
      fetch: jest.fn(),
    } as unknown) as HttpSetup;

    mockUiSettings = ({
      get: jest.fn().mockImplementation((setting) => {
        if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES) {
          return true;
        }
        if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT) {
          return 10;
        }
      }),
    } as unknown) as IUiSettingsClient;

    mockServices = ({
      http: mockHttp,
      uiSettings: mockUiSettings,
      data: ({
        query: ({
          queryString: ({
            getQuery: jest.fn().mockReturnValue({ dataset: { dataSource: { id: 'test-id' } } }),
          } as unknown) as QueryStringContract,
        } as unknown) as IQueryStart,
      } as unknown) as DataPublicPluginStart,
    } as unknown) as IDataPluginServices;
  });

  it('should return boolean values for boolean fields', async () => {
    const result = await fetchColumnValues(
      'test-table',
      'boolean-column',
      mockServices,
      {
        type: 'boolean',
      } as IndexPatternField,
      'INDEX_PATTERN'
    );

    expect(result).toEqual(['true', 'false']);
  });

  it('should return empty array when value suggestions are disabled', async () => {
    (mockUiSettings.get as jest.Mock).mockImplementationOnce((setting) => {
      if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES) {
        return false;
      }
    });

    const result = await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      {
        type: 'string',
      } as IndexPatternField,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should return empty array for unsupported field types', async () => {
    const result = await fetchColumnValues(
      'test-table',
      'number-column',
      mockServices,
      {
        type: 'number',
      } as IndexPatternField,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should fetch and return column values for string fields', async () => {
    const mockResponse = {
      body: {
        fields: [
          {
            values: ['value1', 'value2', 'value3'],
          },
        ],
      },
    };

    (mockHttp.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      {
        type: 'string',
      } as IndexPatternField,
      'INDEX_PATTERN'
    );

    expect(mockHttp.fetch).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/enhancements/search/sql',
      body: JSON.stringify({
        query: {
          query:
            'SELECT string-column FROM test-table GROUP BY string-column ORDER BY COUNT(string-column) DESC LIMIT 10',
          language: 'SQL',
          format: 'jdbc',
          dataset: { dataSource: { id: 'test-id' } },
        },
      }),
    });

    expect(result).toEqual(['value1', 'value2', 'value3']);
  });

  it('should handle API errors', async () => {
    (mockHttp.fetch as jest.Mock).mockRejectedValue(new Error('SQL API Error'));

    await expect(
      fetchColumnValues(
        'test-table',
        'string-column',
        mockServices,
        {
          type: 'string',
        } as IndexPatternField,
        'INDEX_PATTERN'
      )
    ).rejects.toThrow('SQL API Error');
  });

  it('should return empty array when field is undefined', async () => {
    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      undefined,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should fetch values when datasetType is INDEXES', async () => {
    const mockResponse = {
      body: {
        fields: [
          {
            values: ['value1', 'value2'],
          },
        ],
      },
    };

    (mockHttp.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      {
        type: 'string',
      } as IndexPatternField,
      'INDEXES'
    );

    expect(result).toEqual(['value1', 'value2']);
  });

  it('should return empty array when datasetType is unsupported', async () => {
    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      {
        type: 'string',
      } as IndexPatternField,
      'S3'
    );

    expect(result).toEqual([]);
  });
});
