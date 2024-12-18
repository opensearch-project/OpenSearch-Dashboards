/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { fetchData, formatFieldsToSuggestions, formatValuesToSuggestions } from './utils';
import { QueryStringManager } from '../../query';
import { IndexPattern } from '../../index_patterns';
import { monaco } from '@osd/monaco';
import { SuggestionItemDetailsTags } from './constants';

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
