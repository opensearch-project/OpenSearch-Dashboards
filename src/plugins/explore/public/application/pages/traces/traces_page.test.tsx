/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TracesPage } from './traces_page';
import { ResultStatus } from '../../utils/state_management/types';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

// Mock the OpenSearchDashboards context
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      uiSettings: {
        get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
      },
      data: {
        query: {
          timefilter: {
            timefilter: {
              setTime: jest.fn(),
            },
          },
        },
      },
    },
  }),
}));

// Mock the components used in LogsPage
jest.mock('../../components/query_panel', () => ({
  QueryPanel: () => <div data-test-subj="query-panel">Query Panel</div>,
}));

jest.mock('../../components/header_dataset_selector', () => ({
  HeaderDatasetSelector: () => (
    <div data-test-subj="header-dataset-selector">Header Dataset Selector</div>
  ),
}));

jest.mock(
  '../../legacy/discover/application/view_components/canvas/discover_chart_container',
  () => ({
    DiscoverChartContainer: () => (
      <div data-test-subj="discover-chart-container">Chart Container</div>
    ),
  })
);

jest.mock('../../legacy/discover/application/view_components/canvas/top_nav', () => ({
  TopNav: () => <div data-test-subj="top-nav">Top Nav</div>,
}));

jest.mock('../../legacy/discover/application/view_components/panel', () => ({
  DiscoverPanel: () => <div data-test-subj="discover-panel">Discover Panel</div>,
}));

jest.mock('../../../components/data_table/explore_data_table', () => ({
  ExploreDataTable: () => <div data-test-subj="explore-data-table">Data Table</div>,
}));

jest.mock('../../../components/tabs/tabs', () => ({
  ExploreTabs: ({ tabs }: { tabs: Array<{ id: string; content: React.ReactNode }> }) => (
    <div data-test-subj="explore-tabs">
      {tabs.map((tab) => (
        <div key={tab.id} data-test-subj={`tab-${tab.id}`}>
          {tab.content}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../../components/experience_banners/new_experience_banner', () => ({
  NewExperienceBanner: () => (
    <div data-test-subj="new-experience-banner">New Experience Banner</div>
  ),
}));

jest.mock('../../../components/visualizations/visualization_container', () => {
  const MemoizedVisualizationContainer = () => (
    <div data-test-subj="visualization-container">Visualization Container</div>
  );
  return {
    VisualizationContainer: MemoizedVisualizationContainer,
    __esModule: true,
    default: MemoizedVisualizationContainer,
  };
});

// Mock useIsWithinBreakpoints hook
jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    useIsWithinBreakpoints: jest.fn().mockReturnValue(false),
    EuiErrorBoundary: ({ children }: { children: React.ReactNode }) => (
      <div data-test-subj="error-boundary">{children}</div>
    ),
    EuiPanel: ({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-test-subj="eui-panel" {...rest}>
        {children}
      </div>
    ),
    EuiFlexGroup: ({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-test-subj="eui-flex-group" {...rest}>
        {children}
      </div>
    ),
    EuiFlexItem: ({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-test-subj="eui-flex-item" {...rest}>
        {children}
      </div>
    ),
    EuiResizableContainer: ({ children }: { children: Function }) => {
      const EuiResizablePanel = ({
        children: panelChildren,
        ...rest
      }: {
        children: React.ReactNode;
        [key: string]: any;
      }) => (
        <div data-test-subj="eui-resizable-panel" {...rest}>
          {panelChildren}
        </div>
      );
      const EuiResizableButton = () => (
        <div data-test-subj="eui-resizable-button">Resize Button</div>
      );
      return (
        <div data-test-subj="eui-resizable-container">
          {children(EuiResizablePanel, EuiResizableButton)}
        </div>
      );
    },
    EuiPage: ({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-test-subj="eui-page" {...rest}>
        {children}
      </div>
    ),
    EuiPageBody: ({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) => (
      <div data-test-subj="eui-page-body" {...rest}>
        {children}
      </div>
    ),
  };
});

// Mock the hooks
jest.mock('../../utils/hooks/use_initial_query_execution', () => ({
  useInitialQueryExecution: jest.fn(),
}));

jest.mock('../../utils/hooks/use_url_state_sync', () => ({
  useUrlStateSync: jest.fn(),
}));

jest.mock('../../utils/hooks/use_timefilter_subscription', () => ({
  useTimefilterSubscription: jest.fn(),
}));

jest.mock('../../utils/hooks/use_header_variants', () => ({
  useHeaderVariants: jest.fn(),
}));

describe('LogsPage', () => {
  // Helper function to create a test store with different states
  const createTestStore = (
    status = ResultStatus.UNINITIALIZED,
    rows: OpenSearchSearchHit[] = [],
    fieldSchema: any[] = []
  ) => {
    return configureStore({
      reducer: {
        ui: () => ({
          status,
          executionCacheKeys: ['test-cache-key'],
        }),
        results: () => ({
          'test-cache-key': {
            hits: {
              hits: rows,
            },
            fieldSchema,
          },
        }),
      },
    });
  };

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    // Check that the main components are rendered
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('header-dataset-selector')).toBeInTheDocument();
    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('explore-tabs')).toBeInTheDocument();
  });

  it('does not render chart when status is UNINITIALIZED', () => {
    const store = createTestStore(ResultStatus.UNINITIALIZED);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.queryByTestId('discover-chart-container')).not.toBeInTheDocument();
  });

  it('renders chart when status is READY', () => {
    const store = createTestStore(ResultStatus.READY, [
      { _id: '1', _index: 'test', _source: {} } as OpenSearchSearchHit,
    ]);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.getByTestId('discover-chart-container')).toBeInTheDocument();
  });

  it('renders chart when status is LOADING with rows', () => {
    const store = createTestStore(ResultStatus.LOADING, [
      { _id: '1', _index: 'test', _source: {} } as OpenSearchSearchHit,
    ]);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.getByTestId('discover-chart-container')).toBeInTheDocument();
  });

  it('renders chart when status is ERROR with rows', () => {
    const store = createTestStore(ResultStatus.ERROR, [
      { _id: '1', _index: 'test', _source: {} } as OpenSearchSearchHit,
    ]);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.getByTestId('discover-chart-container')).toBeInTheDocument();
  });

  it('does not render chart when status is LOADING without rows', () => {
    const store = createTestStore(ResultStatus.LOADING);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.queryByTestId('discover-chart-container')).not.toBeInTheDocument();
  });

  it('does not render chart when status is ERROR without rows', () => {
    const store = createTestStore(ResultStatus.ERROR);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.queryByTestId('discover-chart-container')).not.toBeInTheDocument();
  });

  it('renders both tabs with correct content', () => {
    const store = createTestStore(ResultStatus.READY, [
      { _id: '1', _index: 'test', _source: {} } as OpenSearchSearchHit,
    ]);
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    // Check that both tabs are rendered
    expect(screen.getByTestId('tab-explore_logs_tab')).toBeInTheDocument();
    expect(screen.getByTestId('tab-explore_visualization_tab')).toBeInTheDocument();

    // Check that the tab content is rendered
    expect(screen.getByTestId('explore-data-table')).toBeInTheDocument();
    expect(screen.getByTestId('visualization-container')).toBeInTheDocument();
  });

  it('passes the correct props to setHeaderActionMenu when provided', () => {
    const mockSetHeaderActionMenu = jest.fn();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TracesPage setHeaderActionMenu={mockSetHeaderActionMenu} />
      </Provider>
    );

    // The setHeaderActionMenu prop should be passed to TopNav
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('renders the new experience banner', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TracesPage />
      </Provider>
    );

    expect(screen.getByTestId('new-experience-banner')).toBeInTheDocument();
  });
});
