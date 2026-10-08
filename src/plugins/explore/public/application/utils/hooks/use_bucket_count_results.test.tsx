/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useBucketCountResults } from './use_bucket_count_results';
import { prepareBucketCountCacheKey } from '../state_management/actions/query_actions';
import {
  resultsInitialState,
  resultsReducer,
  queryInitialState,
  queryReducer,
  resultsCache,
  clearResultsCache,
} from '../state_management/slices';

jest.mock('../state_management/actions/query_actions', () => ({
  prepareBucketCountCacheKey: jest.fn().mockReturnValue('bucketCount:source=logs | stats count()'),
}));

const mockPrepareBucketCountCacheKey = prepareBucketCountCacheKey as jest.MockedFunction<
  typeof prepareBucketCountCacheKey
>;

interface MockRootState {
  query: { query: string; language?: string };
  results: { [key: string]: any };
}

const createMockStore = (initialState: MockRootState) => {
  const preloadedState = {
    query: {
      ...queryInitialState,
      ...initialState.query,
    },
    results: {
      ...resultsInitialState,
      ...initialState.results,
    },
  };

  return configureStore({
    reducer: {
      query: queryReducer,
      results: resultsReducer,
    },
    preloadedState,
  });
};

const renderHookWithStore = (store: any) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useBucketCountResults(), { wrapper });
};

describe('useBucketCountResults', () => {
  const cacheKey = 'bucketCount:source=logs | stats count()';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareBucketCountCacheKey.mockReturnValue(cacheKey);
  });

  afterEach(() => {
    clearResultsCache();
  });

  it('should return bucketCount when results exist with a numeric count value', () => {
    const cacheData = {
      hits: {
        hits: [{ _source: { bucket_count: 849 } }],
        total: 1,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBe(849);
  });

  it('should return undefined when no results in cache', () => {
    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: {},
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBeUndefined();
  });

  it('should return undefined when results have no hits', () => {
    const cacheData = {
      hits: {
        hits: [],
        total: 0,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: { [cacheKey]: { total: 0, elapsedMs: 10, hasResults: false } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBeUndefined();
  });

  it('should return undefined when first hit has no _source', () => {
    const cacheData = {
      hits: {
        hits: [{ _index: 'test' }],
        total: 1,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBeUndefined();
  });

  it('should return undefined when _source value is not a number', () => {
    const cacheData = {
      hits: {
        hits: [{ _source: { bucket_count: 'not a number' } }],
        total: 1,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBeUndefined();
  });

  it('should handle large bucket counts', () => {
    const cacheData = {
      hits: {
        hits: [{ _source: { bucket_count: 2000000 } }],
        total: 1,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count() by user_id' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBe(2000000);
  });

  it('should return 1 for stats without group by', () => {
    const cacheData = {
      hits: {
        hits: [{ _source: { bucket_count: 1 } }],
        total: 1,
      },
    };
    resultsCache.set(cacheKey, cacheData as any);

    const store = createMockStore({
      query: { query: 'source=logs | stats count()' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBe(1);
  });

  it('should return undefined when metadata exists but cache is empty', () => {
    // Don't set anything in resultsCache
    const store = createMockStore({
      query: { query: 'source=logs | stats count() by status' },
      results: { [cacheKey]: { total: 1, elapsedMs: 10, hasResults: true } },
    });

    const { result } = renderHookWithStore(store);
    expect(result.current.bucketCount).toBeUndefined();
  });
});
