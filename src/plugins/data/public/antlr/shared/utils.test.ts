/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import {
  fetchColumnValues,
  fetchData,
  formatAvailableFieldsToSuggestions,
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

// Mock the getDataViews service
jest.mock('../../services', () => ({
  getDataViews: jest.fn(() => ({
    saveToCache: jest.fn(),
    get: jest.fn().mockResolvedValue({
      id: 'test-index-pattern',
      title: 'test-index',
      timeFieldName: 'timestamp',
    }),
    convertToDataset: jest.fn().mockResolvedValue({
      id: 'test-dataset',
      title: 'test-index',
      type: 'INDEX_PATTERN',
    }),
  })),
}));

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

describe('formatAvailableFields', () => {
  it('should format the availableFields as per the format functions', () => {
    const availableFields = [
      { name: 'field1', type: 'text' },
      { name: '_field2', type: 'text' },
      { name: 'field3', type: 'boolean' },
    ];

    const result = formatAvailableFieldsToSuggestions(
      availableFields,
      (f: string) => `${f} `,
      (f: string) => {
        return f.startsWith('_') ? `9` : `3`;
      }
    );

    const expectedResult = [
      {
        text: 'field1',
        type: monaco.languages.CompletionItemKind.Field,
        detail: 'Field: text',
        insertText: 'field1 ',
        sortText: '3',
      },
      {
        text: '_field2',
        type: monaco.languages.CompletionItemKind.Field,
        detail: 'Field: text',
        insertText: '_field2 ',
        sortText: '9',
      },
      {
        text: 'field3',
        type: monaco.languages.CompletionItemKind.Field,
        detail: 'Field: boolean',
        insertText: 'field3 ',
        sortText: '3',
      },
    ];

    expect(result).toStrictEqual(expectedResult);
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

  it('should filter out null values', () => {
    const values = ['apple', 'banana', 'cherry', null];
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
  let mockSearchSource: any;

  const createMockIndexPattern = (fieldType: string, hasField: boolean = true) => {
    const mockField = hasField
      ? (({
          type: fieldType,
          isSuggestionAvailable: jest.fn().mockReturnValue(fieldType === 'number' ? false : true),
          spec: {
            suggestions: {
              autoCompleteValues: undefined,
              topAggValues: undefined,
            },
          },
        } as unknown) as IndexPatternField)
      : undefined;

    return ({
      id: 'test-index',
      fields: {
        getByName: jest.fn().mockReturnValue(mockField),
      },
    } as unknown) as IndexPattern;
  };

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

    // Mock SearchSource
    mockSearchSource = {
      setFields: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockResolvedValue({
        hits: {
          hits: [
            { _source: { 'test-column': 'value1' } },
            { _source: { 'test-column': 'value2' } },
            { _source: { 'test-column': 'value3' } },
          ],
        },
      }),
    };

    mockServices = ({
      http: mockHttp,
      uiSettings: mockUiSettings,
      data: ({
        query: ({
          queryString: ({
            getQuery: jest.fn().mockReturnValue({ dataset: { dataSource: { id: 'test-id' } } }),
          } as unknown) as QueryStringContract,
        } as unknown) as IQueryStart,
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
        indexPatterns: {
          saveToCache: jest.fn(),
        } as unknown,
        dataViews: {
          saveToCache: jest.fn(),
        } as unknown,
      } as unknown) as DataPublicPluginStart,
    } as unknown) as IDataPluginServices;
  });

  it('should return boolean values for boolean fields', async () => {
    const mockIndexPattern = createMockIndexPattern('boolean');

    const result = await fetchColumnValues(
      'test-table',
      'boolean-column',
      mockServices,
      mockIndexPattern,
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

    const mockIndexPattern = createMockIndexPattern('string');

    const result = await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should return empty array for unsupported field types', async () => {
    const mockIndexPattern = createMockIndexPattern('number');

    const result = await fetchColumnValues(
      'test-table',
      'number-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should fetch and return column values using PPL and SearchSource', async () => {
    const mockIndexPattern = createMockIndexPattern('string');

    const result = await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    // Verify SearchSource was created and configured correctly
    expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
    expect(mockSearchSource.setFields).toHaveBeenCalledWith({
      index: expect.objectContaining({
        id: 'test-index-pattern',
        title: 'test-index',
        timeFieldName: 'timestamp',
      }),
      query: {
        query: 'source = `test-table` | top 10 `test-column`',
        language: 'PPL',
        dataset: expect.objectContaining({
          id: 'test-dataset',
          title: 'test-index',
          type: 'INDEX_PATTERN',
        }),
      },
    });

    // Verify fetch was called
    expect(mockSearchSource.fetch).toHaveBeenCalled();

    // Verify values were extracted from hits
    expect(result).toEqual(['value1', 'value2', 'value3']);
  });

  it('should handle SearchSource fetch errors', async () => {
    mockSearchSource.fetch.mockRejectedValue(new Error('Search API Error'));

    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      createMockIndexPattern('string'),
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should return empty array when field is undefined', async () => {
    const mockIndexPattern = createMockIndexPattern('string', false);

    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should return empty array when field is not suggestion available', async () => {
    const mockField = ({
      type: 'string',
      isSuggestionAvailable: jest.fn().mockReturnValue(false),
      spec: { suggestions: {} },
    } as unknown) as IndexPatternField;

    const mockIndexPattern = ({
      id: 'test-index',
      fields: {
        getByName: jest.fn().mockReturnValue(mockField),
      },
    } as unknown) as IndexPattern;

    const result = await fetchColumnValues(
      'test-table',
      'string-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    expect(result).toEqual([]);
  });

  it('should use cached autoCompleteValues when available', async () => {
    const mockField = ({
      type: 'string',
      isSuggestionAvailable: jest.fn().mockReturnValue(true),
      spec: {
        suggestions: {
          values: ['cached1', 'cached2'],
        },
      },
    } as unknown) as IndexPatternField;

    const mockIndexPattern = ({
      id: 'test-index',
      fields: {
        getByName: jest.fn().mockReturnValue(mockField),
      },
    } as unknown) as IndexPattern;

    const result = await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    // Should return cached values without making API call
    expect(mockServices.data.search.searchSource.create).not.toHaveBeenCalled();
    expect(result).toEqual(['cached1', 'cached2']);
  });

  it('should use topAggValues and trigger background update when available', async () => {
    const mockField = ({
      type: 'string',
      isSuggestionAvailable: jest.fn().mockReturnValue(true),
      spec: {
        suggestions: {
          topValues: ['top1', 'top2'],
        },
      },
    } as unknown) as IndexPatternField;

    const mockIndexPattern = ({
      id: 'test-index',
      fields: {
        getByName: jest.fn().mockReturnValue(mockField),
      },
    } as unknown) as IndexPattern;

    const result = await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    // Should return topAggValues immediately
    expect(result).toEqual(['top1', 'top2']);

    // Wait for the background async call to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should also trigger background update
    expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
  });

  it('should properly escape field and table names in PPL query', async () => {
    const mockIndexPattern = createMockIndexPattern('string');

    await fetchColumnValues(
      'table-with-dashes',
      'field-with-dashes',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    expect(mockSearchSource.setFields).toHaveBeenCalledWith({
      index: expect.any(Object),
      query: {
        query: 'source = `table-with-dashes` | top 10 `field-with-dashes`',
        language: 'PPL',
        dataset: expect.any(Object),
      },
    });
  });

  it('should update field suggestions after successful fetch', async () => {
    const mockField = ({
      type: 'string',
      isSuggestionAvailable: jest.fn().mockReturnValue(true),
      spec: {
        suggestions: {
          autoCompleteValues: undefined,
          topAggValues: undefined,
        },
      },
    } as unknown) as IndexPatternField;

    const mockIndexPattern = ({
      id: 'test-index',
      fields: {
        getByName: jest.fn().mockReturnValue(mockField),
      },
    } as unknown) as IndexPattern;

    await fetchColumnValues(
      'test-table',
      'test-column',
      mockServices,
      mockIndexPattern,
      'INDEX_PATTERN'
    );

    // Verify that field suggestions were updated
    expect(mockField.spec.suggestions!.values).toEqual(['value1', 'value2', 'value3']);
  });
});
