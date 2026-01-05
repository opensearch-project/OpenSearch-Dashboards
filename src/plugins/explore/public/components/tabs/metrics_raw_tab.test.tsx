/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MetricsRawTab } from './metrics_raw_tab';

const mockStore = configureStore([]);

describe('MetricsRawTab', () => {
  it('renders with correct class name', () => {
    const store = mockStore({
      query: {
        query: 'node_cpu_seconds_total',
        language: 'PROMQL',
        dataset: { id: 'test', title: 'Test', type: 'prometheus' },
      },
      results: {},
    });

    const { container } = render(
      <Provider store={store}>
        <MetricsRawTab />
      </Provider>
    );

    expect(container.querySelector('.explore-metrics-raw-tab')).toBeInTheDocument();
    expect(container.querySelector('.tab-container')).toBeInTheDocument();
  });

  it('renders ExploreMetricsRawTable component', () => {
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
        <MetricsRawTab />
      </Provider>
    );

    expect(container.querySelector('.euiBasicTable')).toBeInTheDocument();
  });
});
