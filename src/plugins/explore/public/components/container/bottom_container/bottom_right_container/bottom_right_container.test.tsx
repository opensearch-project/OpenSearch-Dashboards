/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock canvas panel
jest.mock(
  '../../../../application/legacy/discover/application/components/panel/canvas_panel',
  () => ({
    CanvasPanel: ({ children }: { children: React.ReactNode }) => (
      <div data-test-subj="canvas-panel">{children}</div>
    ),
  })
);

// Mock the components
jest.mock(
  '../../../../application/legacy/discover/application/components/no_index_patterns/no_index_patterns',
  () => ({
    DiscoverNoIndexPatterns: () => <div data-test-subj="no-index-patterns">No Index Patterns</div>,
  })
);

jest.mock(
  '../../../../application/legacy/discover/application/components/uninitialized/uninitialized',
  () => ({
    DiscoverUninitialized: ({ onRefresh }: { onRefresh: () => void }) => (
      <div data-test-subj="uninitialized">
        <button onClick={onRefresh}>Refresh</button>
      </div>
    ),
  })
);

jest.mock(
  '../../../../application/legacy/discover/application/components/loading_spinner/loading_spinner',
  () => ({
    LoadingSpinner: () => <div data-test-subj="loading-spinner">Loading...</div>,
  })
);

jest.mock(
  '../../../../application/legacy/discover/application/components/no_results/no_results',
  () => ({
    DiscoverNoResults: () => <div data-test-subj="no-results">No Results</div>,
  })
);

jest.mock('../../../../components/tabs/tabs', () => ({
  ExploreTabs: () => <div data-test-subj="explore-tabs">Explore Tabs</div>,
}));

jest.mock('../../../../components/results_summary/results_summary_panel', () => ({
  ResultsSummaryPanel: () => <div data-test-subj="results-summary">Results Summary</div>,
}));

jest.mock('../../../../components/chart/discover_chart_container', () => ({
  DiscoverChartContainer: () => <div data-test-subj="chart-container">Chart Container</div>,
}));

// Mock the context
jest.mock('../../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

// Mock query actions to prevent slice import issues
jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(),
  defaultPrepareQueryString: jest.fn(() => 'mock-query-string'),
}));

// Import components and hooks after mocks
import { BottomRightContainer } from './bottom_right_container';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { useDatasetContext } from '../../../../application/context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;

describe('BottomRightContainer', () => {
  const mockStore = configureStore({
    reducer: {
      legacy: (state = {}) => state,
      ui: (state = {}) => state,
      queryEditor: (state = { queryStatus: { status: QueryExecutionStatus.UNINITIALIZED } }) =>
        state,
      query: (state = {}) => state,
      results: (state = {}) => state,
    },
  });

  const mockServices = {
    data: {
      query: {
        queryString: {},
        savedQueries: {},
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as any);
  });

  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <BottomRightContainer />
      </Provider>
    );
  };

  it('renders no index patterns when dataset is null', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: null,
    });

    renderComponent();
    expect(screen.getByTestId('no-index-patterns')).toBeInTheDocument();
  });

  it('renders uninitialized state when status is UNINITIALIZED', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent();
    expect(screen.getByTestId('uninitialized')).toBeInTheDocument();
  });

  it('renders loading spinner when status is LOADING and no rows', () => {
    const storeWithLoading = configureStore({
      reducer: {
        legacy: (state = {}) => state,
        ui: (state = {}) => state,
        queryEditor: (state = { queryStatus: { status: QueryExecutionStatus.LOADING } }) => state,
        query: (state = {}) => state,
        results: (state = {}) => state,
      },
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(
      <Provider store={storeWithLoading}>
        <BottomRightContainer />
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders content when status is READY', () => {
    const storeWithReady = configureStore({
      reducer: {
        legacy: (state = {}) => state,
        ui: (state = {}) => state,
        queryEditor: (state = { queryStatus: { status: QueryExecutionStatus.READY } }) => state,
        query: (state = {}) => state,
        results: (state = {}) => state,
      },
    });

    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    render(
      <Provider store={storeWithReady}>
        <BottomRightContainer />
      </Provider>
    );

    expect(screen.getByTestId('results-summary')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
  });
});
