/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { fetchData, fetchFieldSuggestions } from './utils';
import { QueryStringManager } from '../../query';
import { IndexPattern } from '../../index_patterns';
import { monaco } from '@osd/monaco';

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

describe('fetchFieldSuggestions', () => {
  // test for fetching field suggestions from index pattern
  // test for fetching with modified Insert Text
  // test for fetching with some sort importance
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
    const result = fetchFieldSuggestions(mockIndexPattern);

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
    const result = fetchFieldSuggestions(mockIndexPattern, (f: any) => `${f} : `);

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
    const result = fetchFieldSuggestions(mockIndexPattern, (f: any) => `${f} = `, '01');

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
