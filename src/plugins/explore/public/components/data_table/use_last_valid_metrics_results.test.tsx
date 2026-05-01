/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { useLastValidPrometheusResult } from './use_last_valid_metrics_results';
import {
  queryReducer,
  queryInitialState,
  resultsReducer,
  resultsInitialState,
  resultsCache,
  clearResultsCache,
} from '../../application/utils/state_management/slices';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';

const makeStore = (queryStr: string, resultKeys: string[]) => {
  const queryObj = {
    ...queryInitialState,
    query: queryStr,
    dataset: { title: 'prom', id: 'prom-1', type: 'DATA_SOURCE' },
    language: 'PROMQL',
  };
  const results: Record<string, any> = { ...resultsInitialState };
  for (const key of resultKeys) {
    results[key] = { total: 0, hasResults: true };
  }
  return configureStore({
    reducer: { query: queryReducer, results: resultsReducer },
    preloadedState: { query: queryObj, results },
  });
};

describe('useLastValidPrometheusResult', () => {
  afterEach(() => clearResultsCache());

  it('returns null when no results exist', () => {
    const store = makeStore('up', []);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useLastValidPrometheusResult(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('returns cached result when results exist for current query', () => {
    const queryObj = {
      ...queryInitialState,
      query: 'up',
      dataset: { title: 'prom', id: 'prom-1', type: 'DATA_SOURCE' },
      language: 'PROMQL',
    };
    const cacheKey = defaultPrepareQueryString(queryObj);
    const mockResult = { took: 1, instantHits: { hits: [], total: 0 } };
    resultsCache.set(cacheKey, mockResult);

    const store = makeStore('up', [cacheKey]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useLastValidPrometheusResult(), { wrapper });
    expect(result.current).toBe(mockResult);
  });
});
