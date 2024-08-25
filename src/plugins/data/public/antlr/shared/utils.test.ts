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
    const mockQueryFormatter = jest.fn((table, dataSourceId, title) => ({
      query: { qs: `formatted ${table}`, format: 'jdbc' },
      df: {
        meta: {
          queryConfig: {
            dataSourceId,
            title,
          },
        },
      },
    }));
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
    };
    const mockQueryString: Partial<QueryStringManager> = {
      getUpdates$: jest
        .fn()
        .mockReturnValue(of({ dataSourceRef: { id: 'testId', name: 'testTitle' } })),
      getDatasetService: jest
        .fn()
        .mockReturnValue({ dataSourceRef: { id: 'testId', name: 'testTitle' } }),
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
    const mockQueryFormatter = jest.fn((table) => ({
      query: { qs: `formatted ${table}`, format: 'jdbc' },
      df: {
        meta: {
          queryConfig: {},
        },
      },
    }));
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
    };
    const mockQueryString: Partial<QueryStringManager> = {
      getUpdates$: jest.fn().mockReturnValue(of(undefined)),
      getDatasetService: jest.fn().mockReturnValue(undefined),
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
