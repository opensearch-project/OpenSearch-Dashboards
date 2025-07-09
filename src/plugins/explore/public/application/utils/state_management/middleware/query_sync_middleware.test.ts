/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createQuerySyncMiddleware } from './query_sync_middleware';
import { setQueryState, setQueryWithHistory, setQueryStringWithHistory } from '../slices';
import { createMockExploreServices, createMockStore, MockStore } from '../__mocks__';

describe('createQuerySyncMiddleware', () => {
  let mockServices: ReturnType<typeof createMockExploreServices>;
  let mockStore: MockStore;
  let mockNext: jest.MockedFunction<(action: any) => any>;
  let middleware: (action: any) => any;

  beforeEach(() => {
    mockServices = createMockExploreServices();
    mockStore = createMockStore();
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

  it('should not sync when queries are equal but still add to history if requested', () => {
    // Mock getQuery to return the same query as in state
    mockServices.data.query.queryString.getQuery = jest.fn().mockReturnValue({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });

    const action = setQueryWithHistory({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    // setQuery should not be called when queries are equal
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    // But addToQueryHistory should still be called because it's outside the isEqual check
    expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
      {
        query: 'SELECT * FROM logs',
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
      { from: 'now-15m', to: 'now' }
    );
  });

  it('should not sync when queries are equal and not add to history for setQueryState', () => {
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

  it('should add to history even when queries are equal if action has addToHistory meta', () => {
    // Mock getQuery to return the same query as in state
    mockServices.data.query.queryString.getQuery = jest.fn().mockReturnValue({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });

    // Create action with explicit addToHistory meta
    const action = {
      type: 'query/setQueryState',
      payload: { query: 'SELECT * FROM logs', language: 'sql' },
      meta: { addToHistory: true },
    };

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    // setQuery should not be called when queries are equal
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    // But addToQueryHistory should be called because addToHistory is true
    expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
      {
        query: 'SELECT * FROM logs',
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
      { from: 'now-15m', to: 'now' }
    );
  });

  it('should sync query and add to history when setQueryStringWithHistory is dispatched', () => {
    const action = setQueryStringWithHistory('SELECT * FROM logs');

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

  it('should not sync when queries are equal but still add to history for setQueryStringWithHistory', () => {
    // Mock getQuery to return the same query as in state
    mockServices.data.query.queryString.getQuery = jest.fn().mockReturnValue({
      query: 'SELECT * FROM logs',
      language: 'sql',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    });

    const action = setQueryStringWithHistory('SELECT * FROM logs');

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    // setQuery should not be called when queries are equal
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    // But addToQueryHistory should still be called because it has addToHistory meta
    expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
      {
        query: 'SELECT * FROM logs',
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
      { from: 'now-15m', to: 'now' }
    );
  });

  it('should not add to history for empty queries with setQueryStringWithHistory', () => {
    mockStore.getState = jest.fn().mockReturnValue({
      query: {
        query: '   ', // Empty/whitespace query
        language: 'sql',
        dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
      },
    });

    const action = setQueryStringWithHistory('   ');

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });

  it('should not process non-query actions', () => {
    const action = { type: 'some/otherAction', payload: {} };

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });

  it('should handle missing dataset gracefully', () => {
    mockStore.getState = jest.fn().mockReturnValue({
      query: {
        query: 'SELECT * FROM logs',
        language: 'sql',
        dataset: null,
      },
    });

    const action = setQueryWithHistory({ query: 'SELECT * FROM logs', language: 'sql' });

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
    expect(mockServices.data.query.queryString.setQuery).not.toHaveBeenCalled();
    expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
  });
});
