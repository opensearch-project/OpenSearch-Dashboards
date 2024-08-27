/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { fetchData } from './utils';
import { QueryStringManager } from '../../query';

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
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
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
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
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
