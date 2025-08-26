/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

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

jest.mock('./resizable_vis_control_and_tabs', () => ({
  ResizableVisControlAndTabs: () => (
    <div data-test-subj="explore-tabs-vis-style-panel">Explore Tabs and Style Panel</div>
  ),
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
  executeQueries: jest.fn(() => ({ type: 'mock/executeQueries' })),
  defaultPrepareQueryString: jest.fn(() => 'mock-query-string'),
}));

// Mock useFlavorId hook
jest.mock('../../../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => 'logs'),
}));

// Import components and hooks after mocks
import { BottomRightContainer } from './bottom_right_container';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { useDatasetContext } from '../../../../application/context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../../common';

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseFlavorId = useFlavorId as jest.MockedFunction<typeof useFlavorId>;

describe('BottomRightContainer', () => {
  const createMockStore = (status: QueryExecutionStatus = QueryExecutionStatus.UNINITIALIZED) => {
    return configureStore({
      reducer: {
        legacy: (state = {}) => state,
        ui: (state = {}) => state,
        queryEditor: (
          state = {
            queryStatusMap: {},
            overallQueryStatus: {
              status,
              elapsedMs: undefined,
              startTime: undefined,
              body: undefined,
            },
            promptModeIsAvailable: false,
            editorMode: 'single-query',
            lastExecutedPrompt: '',
          }
        ) => state,
        query: (state = {}) => state,
        results: (state = {}) => state,
        tab: (state = {}) => state,
      },
    });
  };

  const mockServices = {
    data: {
      query: {
        queryString: {
          getQuery: jest.fn(() => ({ query: 'test query', language: 'PPL' })),
        },
        savedQueries: {},
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as any);
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Logs);
  });

  const renderComponent = (status: QueryExecutionStatus = QueryExecutionStatus.UNINITIALIZED) => {
    const store = createMockStore(status);
    return render(
      <Provider store={store}>
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

    renderComponent(QueryExecutionStatus.UNINITIALIZED);
    expect(screen.getByTestId('uninitialized')).toBeInTheDocument();
  });

  it('renders loading spinner when status is LOADING', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent(QueryExecutionStatus.LOADING);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders no results when status is NO_RESULTS', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent(QueryExecutionStatus.NO_RESULTS);
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('renders content when status is ERROR', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent(QueryExecutionStatus.ERROR);

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs-vis-style-panel')).toBeInTheDocument();
  });

  it('renders content when status is READY', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent(QueryExecutionStatus.READY);

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs-vis-style-panel')).toBeInTheDocument();
  });

  it('returns null for unknown status', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });

    // Create a store with an unknown status
    const store = configureStore({
      reducer: {
        legacy: (state = {}) => state,
        ui: (state = {}) => state,
        queryEditor: (
          state = {
            queryStatusMap: {},
            overallQueryStatus: {
              status: 'UNKNOWN_STATUS' as any,
              elapsedMs: undefined,
              startTime: undefined,
              body: undefined,
            },
            promptModeIsAvailable: false,
            editorMode: 'single-query',
            lastExecutedPrompt: '',
          }
        ) => state,
        query: (state = {}) => state,
        results: (state = {}) => state,
        tab: (state = {}) => state,
      },
    });

    const { container } = render(
      <Provider store={store}>
        <BottomRightContainer />
      </Provider>
    );

    // Should render nothing (null)
    expect(container.firstChild).toBeNull();
  });

  it('should handle dataset with null value correctly', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: null,
    });

    renderComponent();
    expect(screen.getByTestId('no-index-patterns')).toBeInTheDocument();
  });

  it('should pass correct props to DiscoverNoResults', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    renderComponent(QueryExecutionStatus.NO_RESULTS);
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('should not render chart container when flavor is traces', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Traces);

    renderComponent(QueryExecutionStatus.READY);

    expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs-vis-style-panel')).toBeInTheDocument();
  });

  it('should render chart container when flavor is not traces', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: 'timestamp' } as any,
      isLoading: false,
      error: null,
    });
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Logs);

    renderComponent(QueryExecutionStatus.READY);

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs-vis-style-panel')).toBeInTheDocument();
  });
});
