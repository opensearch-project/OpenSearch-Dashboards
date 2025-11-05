/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExploreTracesChart } from './explore_traces_chart';
import {
  uiReducer,
  legacyReducer,
  queryReducer,
} from '../../application/utils/state_management/slices';
import { SortDirection } from '../../types/saved_explore_types';

// Mock the query actions
jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn(() => 'mock-cache-key'),
  executeHistogramQuery: jest.fn(),
  executeQueries: jest.fn(),
}));

// Mock the child components
jest.mock('./timechart_header', () => ({
  TimechartHeader: (props: any) => (
    <div
      data-test-subj="mocked-timechart-header"
      onClick={() => props.onChangeInterval('auto')}
      onKeyDown={() => props.onChangeInterval('auto')}
      role="button"
      tabIndex={0}
    >
      Mocked TimechartHeader
    </div>
  ),
}));

jest.mock('./histogram/histogram', () => ({
  DiscoverHistogram: (props: any) => (
    <div data-test-subj={`mocked-histogram-${props.chartData.yAxisLabel}`}>
      Mocked Histogram for {props.chartData.yAxisLabel}
    </div>
  ),
}));

describe('ExploreTracesChart', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        ui: uiReducer,
        legacy: legacyReducer,
        query: queryReducer,
      },
      preloadedState: {
        ui: { activeTabId: 'traces', showHistogram: true },
        legacy: {
          interval: 'auto',
          columns: ['@timestamp', 'message'],
          sort: [['@timestamp', 'desc' as SortDirection]],
        },
        query: {
          query: 'SELECT * FROM traces',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
        },
        ...initialState,
      },
    });
  };

  const mockServices = {
    tabRegistry: { getAllTabs: jest.fn(() => []) },
  };

  const defaultProps = {
    bucketInterval: { scaled: false, description: 'minute', scale: 1 },
    config: {
      get: jest.fn((key: string) => {
        if (key === 'dateFormat') return 'YYYY-MM-DD HH:mm:ss';
        return 'UTC';
      }),
    },
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({
              from: '2023-01-01T00:00:00Z',
              to: '2023-01-02T00:00:00Z',
            })),
          },
        },
      },
      search: {
        aggs: {
          intervalOptions: [
            { display: 'Auto', val: 'auto' },
            { display: 'Second', val: 's' },
          ],
        },
      },
    },
    services: mockServices,
    showHistogram: true,
  };

  const mockChartData = {
    values: [{ x: 1609459200000, y: 10 }],
    xAxisOrderedValues: [1609459200000],
    xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
    xAxisLabel: 'timestamp',
    yAxisLabel: 'Count',
    ordered: {
      date: true,
      interval: { asMilliseconds: () => 3600000 },
      intervalOpenSearchUnit: 'h',
      intervalOpenSearchValue: 1,
      min: 1609459200000,
      max: 1609462800000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with basic elements', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(defaultProps as any)} />
      </Provider>
    );

    expect(screen.getByTestId('dscChartWrapper')).toBeInTheDocument();
    expect(screen.getByTestId('dscChartChartheader')).toBeInTheDocument();
    expect(screen.getByTestId('histogramCollapseBtn')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-timechart-header')).toBeInTheDocument();
  });

  it('renders request chart when requestChartData is provided', () => {
    const store = createMockStore();
    const requestChartData = { ...mockChartData, yAxisLabel: 'Request Count' };
    const props = { ...defaultProps, requestChartData };

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(props as any)} />
      </Provider>
    );

    expect(screen.getByTestId('exploreTimechart-request')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-histogram-Request Count')).toBeInTheDocument();
  });

  it('renders error chart when errorChartData is provided', () => {
    const store = createMockStore();
    const errorChartData = { ...mockChartData, yAxisLabel: 'Error Count' };
    const props = { ...defaultProps, errorChartData };

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(props as any)} />
      </Provider>
    );

    expect(screen.getByTestId('exploreTimechart-error')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-histogram-Error Count')).toBeInTheDocument();
  });

  it('renders latency chart when latencyChartData is provided', () => {
    const store = createMockStore();
    const latencyChartData = { ...mockChartData, yAxisLabel: 'Average Latency' };
    const props = { ...defaultProps, latencyChartData };

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(props as any)} />
      </Provider>
    );

    expect(screen.getByTestId('exploreTimechart-latency')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-histogram-Average Latency')).toBeInTheDocument();
  });

  it('renders all three charts when all chart data is provided', () => {
    const store = createMockStore();
    const requestChartData = { ...mockChartData, yAxisLabel: 'Request Count' };
    const errorChartData = { ...mockChartData, yAxisLabel: 'Error Count' };
    const latencyChartData = { ...mockChartData, yAxisLabel: 'Average Latency' };

    const props = {
      ...defaultProps,
      requestChartData,
      errorChartData,
      latencyChartData,
    };

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(props as any)} />
      </Provider>
    );

    expect(screen.getByTestId('exploreTimechart-request')).toBeInTheDocument();
    expect(screen.getByTestId('exploreTimechart-error')).toBeInTheDocument();
    expect(screen.getByTestId('exploreTimechart-latency')).toBeInTheDocument();
  });

  it('does not render charts when chart data is not provided', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <ExploreTracesChart {...(defaultProps as any)} />
      </Provider>
    );

    expect(screen.queryByTestId('exploreTimechart-request')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exploreTimechart-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exploreTimechart-latency')).not.toBeInTheDocument();
  });
});
