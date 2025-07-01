/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createQuerySyncMiddleware } from './query_sync_middleware';
import { setQueryState, setQueryWithHistory } from '../slices';
import { ExploreServices } from '../../../../types';

describe('createQuerySyncMiddleware', () => {
  let mockServices: ExploreServices;
  let mockStore: any;
  let mockNext: jest.Mock;
  let middleware: any;

  beforeEach(() => {
    mockServices = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({ query: '', language: 'sql' }),
            setQuery: jest.fn(),
            addToQueryHistory: jest.fn(),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            },
          },
        },
      },
    } as any;

    mockStore = {
      getState: jest.fn().mockReturnValue({
        query: {
          query: 'SELECT * FROM logs',
          language: 'sql',
          dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
        },
      }),
    };

    mockNext = jest.fn().mockImplementation((action) => action);
    middleware = createQuerySyncMiddleware(mockServices)(mockStore)(mockNext);
  });

  it('should sync query with queryStringManager when setQueryState is dispatched', () => {
    const action = setQueryState({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalledWith({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });

  it('should add to query history when setQueryWithHistory is dispatched', () => {
    const action = setQueryWithHistory({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalledWith({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });
    expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
      {
        query: 'SELECT * FROM logs',
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
      { from: 'now-15m', to: 'now' }
    );
  });

  it('should not sync when queries are equal', () => {
    // Mock getQuery to return the same query as in state
    mockServices.data.query.queryString.getQuery = jest.fn().mockReturnValue({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });

    const action = setQueryState({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });

  it('should not add to history for empty queries', () => {
    mockStore.getState = jest.fn().mockReturnValue({
      query: {
        query: '   ', // Empty/whitespace query
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
    });

    const action = setQueryWithHistory({ query: '   ', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });

  it('should handle missing timefilter gracefully', () => {
    (mockServices.data.query as any).timefilter = undefined;

    const action = setQueryWithHistory({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });
});
