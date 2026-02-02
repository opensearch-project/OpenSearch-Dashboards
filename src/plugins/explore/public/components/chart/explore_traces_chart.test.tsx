/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  resultsReducer,
  queryEditorReducer,
} from '../../application/utils/state_management/slices';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: { get: jest.fn() },
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
      },
    },
  })),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('./histogram/histogram', () => ({
  DiscoverHistogram: ({ chartData }: { chartData: any }) => (
    <div data-test-subj="discover-histogram">
      Chart with {chartData?.values?.length || 0} data points
    </div>
  ),
}));

jest.mock('./timechart_header', () => ({
  TimechartHeader: () => <div data-test-subj="timechart-header">Timechart Header</div>,
}));

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiCallOut: ({ title, children, color }: any) => (
    <div data-test-subj={`eui-callout-${color}`}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  ),
  EuiLoadingSpinner: () => <div role="progressbar">Loading...</div>,
}));

// Import after mocks
import { ExploreTracesChart } from './explore_traces_chart';

describe('ExploreTracesChart - Field Missing Error Messages', () => {
  const mockStore = configureStore({
    reducer: {
      legacy: legacyReducer,
      ui: uiReducer,
      query: queryReducer,
      results: resultsReducer,
      queryEditor: queryEditorReducer,
    },
    preloadedState: {
      legacy: {
        savedSearch: undefined,
        savedQuery: undefined,
        columns: [],
        sort: [],
        interval: '5m',
        isDirty: false,
        lineCount: undefined,
      },
      ui: {
        activeTabId: 'traces',
        showHistogram: true,
      },
      query: {
        query: 'source=traces',
        language: 'PPL',
        dataset: {
          id: 'trace-dataset',
          title: 'trace-dataset',
          type: 'INDEX_PATTERN',
        },
      },
      queryEditor: {
        breakdownField: undefined,
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'READY' as any,
          elapsedMs: 100,
          startTime: Date.now(),
        },
        editorMode: 'Query' as any,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
        hasUserInitiatedQuery: false,
      },
      results: {},
    },
  });

  const defaultProps = {
    bucketInterval: { scale: 1, description: '5m' },
    config: { get: jest.fn() } as any,
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
          },
        },
      },
    } as any,
    services: {} as any,
    showHistogram: true,
    timeFieldName: 'endTime',
  };

  it('displays error message when durationInNanos field is missing from dataset', () => {
    const latencyError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={undefined}
          latencyError={latencyError}
        />
      </Provider>
    );

    expect(screen.getByText('Latency Unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/Duration field "durationInNanos" not found in this dataset/)
    ).toBeInTheDocument();
    expect(screen.getByText(/This field is required for latency metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Request and error charts
  });

  it('displays error message when status field is missing from dataset', () => {
    const errorQueryError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorChartData={undefined}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          errorQueryError={errorQueryError}
        />
      </Provider>
    );

    expect(screen.getByText('Error Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Status field "status" not found in this dataset/)).toBeInTheDocument();
    expect(screen.getByText(/This field is required for error metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Request and latency charts
  });

  it('displays error message when time field is missing from dataset', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={requestError}
          timeFieldName="endTime"
        />
      </Provider>
    );

    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Time field "endTime" not found in this dataset/)).toBeInTheDocument();
    expect(screen.getByText(/This field is required for time-based metrics/)).toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2); // Error and latency charts
  });

  it('displays error message with custom time field name', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=@timestamp) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=@timestamp)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={requestError}
          timeFieldName="@timestamp"
        />
      </Provider>
    );

    // Should use the actual time field name in the error message
    expect(
      screen.getByText(/Time field "@timestamp" not found in this dataset/)
    ).toBeInTheDocument();
  });

  it('displays multiple field missing error messages simultaneously', () => {
    const requestError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
    };

    const errorQueryError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
    };

    const latencyError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos) in type env",
        reason: 'SemanticCheckException',
        type: 'SemanticCheckException',
      },
      originalErrorMessage: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={undefined}
          latencyChartData={undefined}
          requestError={requestError}
          errorQueryError={errorQueryError}
          latencyError={latencyError}
        />
      </Provider>
    );

    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Error Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Latency Unavailable')).toBeInTheDocument();

    expect(screen.getByText(/Time field "endTime" not found/)).toBeInTheDocument();
    expect(screen.getByText(/Status field "status" not found/)).toBeInTheDocument();
    expect(screen.getByText(/Duration field "durationInNanos" not found/)).toBeInTheDocument();

    // No charts should render
    expect(screen.queryByTestId('discover-histogram')).not.toBeInTheDocument();
  });

  it('handles non-field-missing errors gracefully', () => {
    const genericError = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: {
        details: 'Some other error occurred',
        reason: 'ServerException',
        type: 'ServerException',
      },
      originalErrorMessage: 'Some other error occurred',
    };

    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={undefined}
          errorChartData={{ values: [], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [], xAxisOrderedValues: [] } as any}
          requestError={genericError}
        />
      </Provider>
    );

    // Should show actual error message instead of infinite loading spinner
    expect(screen.getByText('Request Count Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Some other error occurred')).toBeInTheDocument();
    expect(screen.queryByText(/not found in this dataset/)).not.toBeInTheDocument();

    // Other charts should still render normally
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(2);
  });

  it('renders charts normally when no errors are present', () => {
    render(
      <Provider store={mockStore}>
        <ExploreTracesChart
          {...defaultProps}
          requestChartData={{ values: [{ x: 1, y: 10 }], xAxisOrderedValues: [] } as any}
          errorChartData={{ values: [{ x: 1, y: 2 }], xAxisOrderedValues: [] } as any}
          latencyChartData={{ values: [{ x: 1, y: 1.5 }], xAxisOrderedValues: [] } as any}
        />
      </Provider>
    );

    // Should render all three charts
    expect(screen.getAllByTestId('discover-histogram')).toHaveLength(3);
    expect(screen.queryByText(/Unavailable/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
