/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DiscoverChartContainer } from './discover_chart_container';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  resultsReducer,
} from '../../application/utils/state_management/slices';

// Mock the hooks and components
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: {
        get: jest.fn(),
      },
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
        search: {
          aggs: {
            createAggConfigs: jest.fn(),
          },
        },
      },
    },
  })),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(() => ({
    dataset: {
      isTimeBased: jest.fn(() => true),
      timeFieldName: '@timestamp',
    },
  })),
}));

jest.mock('./chart', () => ({
  DiscoverChart: ({ chartData }: { chartData: any }) => (
    <div data-test-subj="discover-chart">Chart with data: {chartData ? 'present' : 'absent'}</div>
  ),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  histogramResultsProcessor: jest.fn(() => ({
    chartData: { values: [], xAxisOrderedValues: [] },
    bucketInterval: { scale: false, description: '1h' },
    hits: { total: 10 },
  })),
  defaultPrepareQueryString: jest.fn(() => 'test-cache-key'),
}));

describe('DiscoverChartContainer', () => {
  const createMockStore = (hasResults = true) => {
    return configureStore({
      reducer: {
        legacy: legacyReducer,
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
      },
      preloadedState: {
        legacy: {
          savedSearch: undefined,
          savedQuery: undefined,
          columns: [],
          sort: [],
          interval: '1h',
          isDirty: false,
          lineCount: undefined,
        },
        ui: {
          activeTabId: 'logs',
          showHistogram: true,
        },
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: {
            id: 'test-dataset',
            title: 'test-dataset',
            type: 'INDEX_PATTERN',
          },
        },
        results: hasResults
          ? {
              'test-cache-key': {
                elapsedMs: 100,
                took: 10,
                timed_out: false,
                _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
                hits: { hits: [], total: 10, max_score: 1.0 },
                fieldSchema: [],
              },
            }
          : {},
      },
    });
  };

  const renderComponent = (hasResults = true) => {
    const store = createMockStore(hasResults);
    return render(
      <Provider store={store}>
        <DiscoverChartContainer />
      </Provider>
    );
  };

  it('renders chart when data is available and dataset is time-based', () => {
    renderComponent(true);
    expect(screen.getByTestId('discover-chart')).toBeInTheDocument();
  });

  it('returns null when no results are available', () => {
    renderComponent(false);
    expect(screen.queryByTestId('discover-chart')).not.toBeInTheDocument();
  });
});
