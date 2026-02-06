/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ExploreMetricsRawTable } from './explore_metrics_raw_table';

const mockStore = configureStore([]);

describe('ExploreMetricsRawTable', () => {
  it('renders with search results from Redux store', () => {
    const store = mockStore({
      query: {
        query: 'node_cpu_seconds_total',
        language: 'PROMQL',
        dataset: { id: 'test', title: 'Test', type: 'prometheus' },
      },
      results: {
        node_cpu_seconds_total: {
          took: 10,
          timed_out: false,
          _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
          hits: {
            total: { value: 0, relation: 'eq' },
            max_score: null,
            hits: [],
          },
          elapsedMs: 10,
          instantHits: {
            hits: [
              {
                _index: 'prometheus',
                _source: {
                  __name__: 'node_cpu_seconds_total',
                  cpu: '0',
                  mode: 'idle',
                  Value: 15276.26,
                },
              },
            ],
            total: 1,
          },
        },
      },
    });

    const { container } = render(
      <Provider store={store}>
        <ExploreMetricsRawTable />
      </Provider>
    );

    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });

  it('renders with empty results', () => {
    const store = mockStore({
      query: {
        query: 'test_query',
        language: 'PROMQL',
        dataset: { id: 'test', title: 'Test', type: 'prometheus' },
      },
      results: {},
    });

    const { container } = render(
      <Provider store={store}>
        <ExploreMetricsRawTable />
      </Provider>
    );

    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });
});
