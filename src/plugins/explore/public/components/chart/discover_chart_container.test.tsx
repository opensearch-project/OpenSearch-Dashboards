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
import { ExploreFlavor } from '../../../common';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';

const mockUseFlavorId = useFlavorId as jest.MockedFunction<typeof useFlavorId>;
const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;

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

jest.mock('./explore_logs_chart', () => ({
  ExploreLogsChart: ({ chartData }: { chartData: any }) => (
    <div data-test-subj="explore-logs-chart">
      Logs Chart with data: {chartData ? 'present' : 'absent'}
    </div>
  ),
}));

jest.mock('./explore_traces_chart', () => ({
  ExploreTracesChart: ({ requestChartData }: { requestChartData: any }) => (
    <div data-test-subj="explore-traces-chart">
      Traces Chart with data: {requestChartData ? 'present' : 'absent'}
    </div>
  ),
}));

jest.mock('../panel/canvas_panel', () => ({
  CanvasPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="canvas-panel">{children}</div>
  ),
}));

jest.mock('../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => 'logs'),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  histogramResultsProcessor: jest.fn(() => ({
    chartData: { values: [], xAxisOrderedValues: [] },
    bucketInterval: { scale: false, description: '1h' },
    hits: { total: 10 },
  })),
  defaultPrepareQueryString: jest.fn(() => 'test-cache-key'),
}));

jest.mock(
  '../../application/utils/state_management/actions/processors/trace_chart_data_processor',
  () => ({
    tracesHistogramResultsProcessor: jest.fn(() => ({
      requestChartData: { values: [], xAxisOrderedValues: [] },
      errorChartData: { values: [], xAxisOrderedValues: [] },
      latencyChartData: { values: [], xAxisOrderedValues: [] },
      bucketInterval: { scale: false, description: '1h' },
      hits: { total: 10 },
    })),
  })
);

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

  const renderComponent = (hasResults = true, flavorId = ExploreFlavor.Logs) => {
    mockUseFlavorId.mockReturnValue(flavorId);
    const store = createMockStore(hasResults);
    return render(
      <Provider store={store}>
        <DiscoverChartContainer />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logs chart when flavor is logs and data is available', () => {
    renderComponent(true, ExploreFlavor.Logs);
    expect(screen.getByTestId('canvas-panel')).toBeInTheDocument();
    expect(screen.getByTestId('explore-logs-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('explore-traces-chart')).not.toBeInTheDocument();
  });

  it('renders traces chart when flavor is traces and data is available', () => {
    renderComponent(true, ExploreFlavor.Traces);
    expect(screen.getByTestId('canvas-panel')).toBeInTheDocument();
    expect(screen.getByTestId('explore-traces-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('explore-logs-chart')).not.toBeInTheDocument();
  });

  it('returns null when no results are available', () => {
    const { container } = renderComponent(false);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when dataset is not time-based', () => {
    // Mock dataset context to return non-time-based dataset
    mockUseDatasetContext.mockReturnValue({
      dataset: {
        isTimeBased: jest.fn(() => false),
        timeFieldName: undefined,
      } as any,
      isLoading: false,
      error: null,
    } as any);

    const { container } = renderComponent(true);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when logs flavor has no chart data', () => {
    // Mock histogramResultsProcessor to return null chartData
    const { histogramResultsProcessor } = jest.requireMock(
      '../../application/utils/state_management/actions/query_actions'
    );
    histogramResultsProcessor.mockReturnValueOnce({
      chartData: null,
      bucketInterval: { scale: false, description: '1h' },
      hits: { total: 10 },
    });

    const { container } = renderComponent(true, ExploreFlavor.Logs);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when traces flavor has no request chart data', () => {
    // Mock tracesHistogramResultsProcessor to return null requestChartData
    const { tracesHistogramResultsProcessor } = jest.requireMock(
      '../../application/utils/state_management/actions/processors/trace_chart_data_processor'
    );
    tracesHistogramResultsProcessor.mockReturnValueOnce({
      requestChartData: null,
      errorChartData: { values: [], xAxisOrderedValues: [] },
      latencyChartData: { values: [], xAxisOrderedValues: [] },
      bucketInterval: { scale: false, description: '1h' },
      hits: { total: 10 },
    });

    const { container } = renderComponent(true, ExploreFlavor.Traces);
    expect(container.firstChild).toBeNull();
  });
});
