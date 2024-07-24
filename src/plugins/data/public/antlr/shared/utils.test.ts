/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { getRawSuggestionData$, fetchData, fetchTableSchemas, fetchColumnValues } from './utils';

describe('fetchData', () => {
  it('should fetch data using the dataSourceRequestHandler', async () => {
    const mockTables = ['table1', 'table2'];
    const mockQueryFormatter = jest.fn((table) => ({ query: `formatted ${table}` }));
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
    };
    const mockConnectionService = {
      getSelectedConnection$: jest
        .fn()
        .mockReturnValue(of({ id: 'testId', attributes: { title: 'testTitle' } })),
    };

    const result = await fetchData(mockTables, mockQueryFormatter, mockApi, mockConnectionService);
    expect(result).toEqual(['fetchedData', 'fetchedData']);
    expect(mockApi.http.fetch).toHaveBeenCalledTimes(2);
  });

  it('should fetch data using the defaultRequestHandler', async () => {
    const mockTables = ['table1', 'table2'];
    const mockQueryFormatter = jest.fn((table) => ({ query: `formatted ${table}` }));
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('fetchedData'),
      },
    };
    const mockConnectionService = {
      getSelectedConnection$: jest.fn().mockReturnValue(of(undefined)),
    };

    const result = await fetchData(mockTables, mockQueryFormatter, mockApi, mockConnectionService);
    expect(result).toEqual(['fetchedData', 'fetchedData']);
    expect(mockApi.http.fetch).toHaveBeenCalledTimes(2);
  });
});
