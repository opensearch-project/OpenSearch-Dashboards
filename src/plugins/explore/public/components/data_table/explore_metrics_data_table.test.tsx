/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { ExploreMetricsDataTable } from './explore_metrics_data_table';
import {
  IPrometheusSearchResult,
  queryInitialState,
  queryReducer,
  resultsInitialState,
  resultsReducer,
} from '../../application/utils/state_management/slices';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';

jest.mock('./metrics_data_table', () => ({
  MetricsDataTable: ({ searchResult }: { searchResult: IPrometheusSearchResult }) => (
    <div data-testid="metrics-data-table">
      Metrics Data Table - Rows: {searchResult.instantHits.total}
    </div>
  ),
}));

describe('ExploreMetricsDataTable', () => {
  const createTestStore = (searchResult?: IPrometheusSearchResult) => {
    const queryObj = {
      ...queryInitialState,
      query: 'node_cpu_seconds_total',
      dataset: { title: 'prometheus', id: 'prom-1', type: 'DATA_SOURCE' },
      language: 'PROMQL',
    };

    const cacheKey = defaultPrepareQueryString(queryObj);

    const mockSearchResult: IPrometheusSearchResult = searchResult || {
      took: 10,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 0, relation: 'eq' },
        max_score: null,
        hits: [],
      },
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Time: 1638316800000,
              cpu: '0',
              mode: 'idle',
              Value: 0.95,
            },
          },
        ],
        total: 1,
      },
      instantFieldSchema: [
        { name: 'Time', type: 'time' },
        { name: 'cpu', type: 'string' },
        { name: 'mode', type: 'string' },
        { name: 'Value', type: 'number' },
      ],
    };

    const preloadedState = {
      query: queryObj,
      results: {
        ...resultsInitialState,
        [cacheKey]: mockSearchResult,
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

  it('renders MetricsDataTable with search results from Redux store', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <ExploreMetricsDataTable />
      </Provider>
    );

    expect(container).toHaveTextContent('Metrics Data Table');
    expect(container).toHaveTextContent('Rows: 1');
  });

  it('passes correct search result to MetricsDataTable', () => {
    const customSearchResult: IPrometheusSearchResult = {
      took: 15,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 0, relation: 'eq' },
        max_score: null,
        hits: [],
      },
      instantHits: {
        hits: [
          {
            _index: 'prometheus',
            _source: {
              Time: 1638316800000,
              instance: 'localhost:9090',
              Value: 42.5,
            },
          },
          {
            _index: 'prometheus',
            _source: {
              Time: 1638316800000,
              instance: 'localhost:9091',
              Value: 38.2,
            },
          },
        ],
        total: 2,
      },
      instantFieldSchema: [
        { name: 'Time', type: 'time' },
        { name: 'instance', type: 'string' },
        { name: 'Value', type: 'number' },
      ],
    };

    const store = createTestStore(customSearchResult);
    const { container } = render(
      <Provider store={store}>
        <ExploreMetricsDataTable />
      </Provider>
    );

    expect(container).toHaveTextContent('Metrics Data Table');
    expect(container).toHaveTextContent('Rows: 2');
  });

  it('uses defaultPrepareQueryString to generate cache key', () => {
    const store = createTestStore();
    const state = store.getState();
    const expectedCacheKey = defaultPrepareQueryString(state.query);

    expect(state.results[expectedCacheKey]).toBeDefined();
  });

  it('renders without crashing when results exist', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <ExploreMetricsDataTable />
      </Provider>
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
