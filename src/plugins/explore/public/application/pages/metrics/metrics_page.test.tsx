/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { discoverPluginMock } from '../../legacy/discover/mocks';
import { ResultStatus } from '../../utils/state_management/types';
import { MetricsPage } from './metrics_page';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: jest.fn(),
  }),
  withOpenSearchDashboards: jest.fn((component: React.Component) => component),
}));

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
  ExploreTabs: () => (
    <div data-test-subj="explore-tabs">
      <div data-test-subj="tab-explore_logs_tab">
        <div data-test-subj="explore-data-table">Data Table</div>
      </div>
      <div data-test-subj="tab-explore_visualization_tab">
        <div data-test-subj="visualization-container">Visualization Container</div>
      </div>
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

jest.mock('../../utils/hooks/use_initial_query_execution', () => ({
  useInitialQueryExecution: jest.fn(),
}));

jest.mock('../../utils/hooks/use_url_state_sync', () => ({
  useUrlStateSync: jest.fn(),
}));

jest.mock('../../utils/hooks/use_timefilter_subscription', () => ({
  useTimefilterSubscription: jest.fn(),
}));

jest.mock('../../components/index_pattern_context', () => ({
  useIndexPatternContext: jest.fn().mockReturnValue({
    indexPattern: {},
    isLoading: false,
    error: null,
  }),
}));

describe('MetricsPage', () => {
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

  beforeEach(() => {
    const exploreServices = discoverPluginMock.createExploreServicesMock();
    const exploreServicesMock = exploreServices as jest.MaybeMockedDeep<typeof exploreServices>;
    exploreServicesMock.uiSettings.get.mockImplementation((_, defaultValue) => defaultValue);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: exploreServicesMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MetricsPage />
      </Provider>
    );

    expect(screen.getByTestId('header-dataset-selector')).toBeInTheDocument();
    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('discover-panel')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('does not render chart when status is UNINITIALIZED', () => {
    const store = createTestStore(ResultStatus.UNINITIALIZED);
    render(
      <Provider store={store}>
        <MetricsPage />
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
        <MetricsPage />
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
        <MetricsPage />
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
        <MetricsPage />
      </Provider>
    );

    expect(screen.getByTestId('discover-chart-container')).toBeInTheDocument();
  });

  it('does not render chart when status is LOADING without rows', () => {
    const store = createTestStore(ResultStatus.LOADING);
    render(
      <Provider store={store}>
        <MetricsPage />
      </Provider>
    );

    expect(screen.queryByTestId('discover-chart-container')).not.toBeInTheDocument();
  });

  it('does not render chart when status is ERROR without rows', () => {
    const store = createTestStore(ResultStatus.ERROR);
    render(
      <Provider store={store}>
        <MetricsPage />
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
        <MetricsPage />
      </Provider>
    );

    expect(screen.getByTestId('tab-explore_logs_tab')).toBeInTheDocument();
    expect(screen.getByTestId('tab-explore_visualization_tab')).toBeInTheDocument();

    expect(screen.getByTestId('explore-data-table')).toBeInTheDocument();
    expect(screen.getByTestId('visualization-container')).toBeInTheDocument();
  });

  it('passes the correct props to setHeaderActionMenu when provided', () => {
    const mockSetHeaderActionMenu = jest.fn();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MetricsPage setHeaderActionMenu={mockSetHeaderActionMenu} />
      </Provider>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('renders the new experience banner', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MetricsPage />
      </Provider>
    );

    expect(screen.getByTestId('new-experience-banner')).toBeInTheDocument();
  });
});
