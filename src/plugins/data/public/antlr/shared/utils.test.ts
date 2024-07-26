/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { getRawSuggestionData$, fetchData, fetchTableSchemas, fetchColumnValues } from './utils';

describe('getRawSuggestionData$', () => {
  it('should return default request handler data when connection is undefined', (done) => {
    const mockConnectionsService = {
      getSelectedConnection$: jest.fn().mockReturnValue(of(undefined)),
    };
    const mockDefaultRequestHandler = jest.fn().mockResolvedValue('defaultData');
    const mockDataSourceRequestHandler = jest.fn();

    getRawSuggestionData$(
      mockConnectionsService,
      mockDataSourceRequestHandler,
      mockDefaultRequestHandler
    ).subscribe((result) => {
      expect(result).toBe('defaultData');
      expect(mockDefaultRequestHandler).toHaveBeenCalled();
      expect(mockDataSourceRequestHandler).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return data source request handler data when connection is defined', (done) => {
    const mockConnectionsService = {
      getSelectedConnection$: jest.fn().mockReturnValue(
        of({
          dataSource: { id: 'testId' },
          attributes: { title: 'testTitle' },
        })
      ),
    };
    const mockDefaultRequestHandler = jest.fn();
    const mockDataSourceRequestHandler = jest.fn().mockResolvedValue('dataSourceData');

    getRawSuggestionData$(
      mockConnectionsService,
      mockDataSourceRequestHandler,
      mockDefaultRequestHandler
    ).subscribe((result) => {
      expect(result).toBe('dataSourceData');
      expect(mockDataSourceRequestHandler).toHaveBeenCalledWith({
        dataSourceId: 'testId',
        title: 'testTitle',
      });
      expect(mockDefaultRequestHandler).not.toHaveBeenCalled();
      done();
    });
  });
});

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

describe('fetchTableSchemas', () => {
  it('should fetch table schemas', async () => {
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('schemaData'),
      },
    };
    const mockConnectionService = {
      getSelectedConnection$: jest
        .fn()
        .mockReturnValue(of({ dataSource: { id: 'testId' }, attributes: { title: 'testTitle' } })),
    };

    const result = await fetchTableSchemas(['table1'], mockApi, mockConnectionService);
    expect(result).toEqual(['schemaData']);
    expect(mockApi.http.fetch).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/enhancements/search/sql',
      body: JSON.stringify({
        query: { qs: 'DESCRIBE TABLES LIKE table1', format: 'jdbc' },
        df: {
          meta: {
            queryConfig: {
              dataSourceId: 'testId',
              title: 'testTitle',
            },
          },
        },
      }),
    });
  });
});

describe('fetchColumnValues', () => {
  it('should fetch column values', async () => {
    const mockApi = {
      http: {
        fetch: jest.fn().mockResolvedValue('columnData'),
      },
    };
    const mockConnectionService = {
      getSelectedConnection$: jest
        .fn()
        .mockReturnValue(of({ dataSource: { id: 'testId' }, attributes: { title: 'testTitle' } })),
    };

    const result = await fetchColumnValues(['table1'], 'column1', mockApi, mockConnectionService);
    expect(result).toEqual(['columnData']);
    expect(mockApi.http.fetch).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/enhancements/search/sql',
      body: JSON.stringify({
        query: { qs: 'SELECT DISTINCT column1 FROM table1 LIMIT 10', format: 'jdbc' },
        df: {
          meta: {
            queryConfig: {
              dataSourceId: 'testId',
              title: 'testTitle',
            },
          },
        },
      }),
    });
  });
});
