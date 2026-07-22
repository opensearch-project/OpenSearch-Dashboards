/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen } from '@testing-library/react';
import { FC } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';
import { discoverPluginMock } from '../../legacy/discover/mocks';
import {
  ISearchResult,
  resultsInitialState,
  resultsReducer,
  uiInitialState,
  uiReducer,
  queryInitialState,
  queryReducer,
  queryEditorInitialState,
  queryEditorReducer,
} from '../../utils/state_management/slices';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { MetricsPage } from './metrics_page';
import { defaultPrepareQueryString } from '../../utils/state_management/actions/query_actions';
import { setMetricsPageMode } from '../../utils/state_management/slices/ui/ui_slice';
import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: jest.fn(),
  };
});

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: jest.fn(),
  }),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

jest.mock('../../../components/query_panel', () => ({
  QueryPanel: () => <div data-test-subj="query-panel">Query Panel</div>,
}));

jest.mock('./metrics_bottom_container/bottom_right_container', () => ({
  BottomRightContainer: () => (
    <div data-test-subj="bottom-right-container">Bottom Right Container</div>
  ),
}));

jest.mock('./metrics_page_tabs', () => ({
  MetricsPageTabs: () => <div data-test-subj="metrics-page-tabs">Metrics Page Tabs</div>,
}));

jest.mock('../../../components/experience_banners/new_experience_banner', () => ({
  NewExperienceBanner: () => (
    <div data-test-subj="new-experience-banner">New Experience Banner</div>
  ),
}));

jest.mock('../../../components/top_nav/top_nav', () => ({
  TopNav: ({ setHeaderActionMenu }: { setHeaderActionMenu?: () => void }) => (
    <div data-test-subj="top-nav">
      Top Nav
      {setHeaderActionMenu && <button onClick={setHeaderActionMenu}>Set Header</button>}
    </div>
  ),
}));

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

jest.mock('../../utils/hooks/use_initialize_metrics_dataset', () => ({
  useInitializeMetricsDataset: jest.fn(),
}));

jest.mock('../../context', () => ({
  useDatasetContext: jest.fn().mockReturnValue({
    dataset: {},
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../application/utils/hooks/use_page_initialization', () => ({
  useInitPage: jest.fn().mockReturnValue({
    savedExplore: { id: 'test-id', title: 'Test Explore' },
  }),
}));

describe('MetricsPage', () => {
  const createTestStore = (
    status = QueryExecutionStatus.UNINITIALIZED,
    rows: OpenSearchSearchHit[] = [],
    fieldSchema: any[] = []
  ) => {
    // Create query object that matches the MetricsPage component expectations
    const queryObj = {
      ...queryInitialState,
      query: '| where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };

    // Generate cache key using the same logic as the component
    const cacheKey = defaultPrepareQueryString(queryObj);

    const preloadedState = {
      ui: {
        ...uiInitialState,
        status,
        executionCacheKeys: [cacheKey],
        showDatasetFields: true,
      },
      results: {
        ...resultsInitialState,
        [cacheKey]: {
          hits: { hits: rows },
          fieldSchema,
        } as ISearchResult,
      },
      query: queryObj,
      queryEditor: {
        ...queryEditorInitialState,
        queryStatus: {
          status,
          elapsedMs: undefined,
          startTime: undefined,
          body: undefined,
        },
      },
    };

    return configureStore({
      reducer: {
        ui: uiReducer,
        results: resultsReducer,
        query: queryReducer,
        queryEditor: queryEditorReducer,
      },
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      preloadedState,
    });
  };

  // @ts-expect-error TS2339 TODO(ts-error): fixme
  const TestHarness: FC<{ store: ReturnType<typeof createTestStore> }> = ({ children, store }) => {
    return (
      <MemoryRouter>
        <Provider store={store}>{children}</Provider>
      </MemoryRouter>
    );
  };

  const mockDispatch = jest.fn();

  beforeEach(() => {
    const exploreServices = discoverPluginMock.createExploreServicesMock();
    const exploreServicesMock = exploreServices as jest.MaybeMockedDeep<typeof exploreServices>;
    exploreServicesMock.uiSettings.get.mockImplementation((_, defaultValue) => defaultValue);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: exploreServicesMock,
    });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <MetricsPage />
      </TestHarness>
    );

    expect(screen.getByTestId('metrics-page-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('new-experience-banner')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('passes setHeaderActionMenu prop to TopNav', () => {
    const mockSetHeaderActionMenu = jest.fn();
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <MetricsPage setHeaderActionMenu={mockSetHeaderActionMenu} />
      </TestHarness>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-page-tabs')).toBeInTheDocument();
  });

  it('renders when dataset is loading', () => {
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <MetricsPage />
      </TestHarness>
    );

    expect(screen.getByTestId('metrics-page-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  describe('applyModeFromUrl effect', () => {
    const originalHash = window.location.hash;

    const setHash = (hash: string) => {
      window.history.replaceState(undefined, '', hash);
    };

    const renderMetricsPage = () => {
      const store = createTestStore();
      render(
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        <TestHarness store={store}>
          <MetricsPage />
        </TestHarness>
      );
    };

    const setMetricsPageModeCalls = () =>
      mockDispatch.mock.calls.filter(
        ([action]) => action?.type === setMetricsPageMode('query').type
      );

    beforeEach(() => {
      // Avoid the unrelated savedExplore?.id effect which also dispatches
      // setMetricsPageMode('query') so we isolate the URL-driven behavior.
      (useInitPage as jest.Mock).mockReturnValue({ savedExplore: undefined });
    });

    afterEach(() => {
      setHash(originalHash);
    });

    it('dispatches setMetricsPageMode("query") when hash has metricsPageMode:query', () => {
      setHash('#/?_a=(ui:(activeTabId:logs,metricsPageMode:query,showHistogram:!t))');

      renderMetricsPage();

      expect(mockDispatch).toHaveBeenCalledWith(setMetricsPageMode('query'));
    });

    it('dispatches setMetricsPageMode("explore") when hash has metricsPageMode:explore', () => {
      setHash('#/?_a=(ui:(activeTabId:logs,metricsPageMode:explore,showHistogram:!t))');

      renderMetricsPage();

      expect(mockDispatch).toHaveBeenCalledWith(setMetricsPageMode('explore'));
    });

    it('does not dispatch the mode action when there is no _a / metricsPageMode token', () => {
      setHash('#/?a=b');

      renderMetricsPage();

      expect(setMetricsPageModeCalls()).toHaveLength(0);
    });

    it('re-dispatches on a window hashchange with a changed metricsPageMode', () => {
      setHash('#/?_a=(ui:(activeTabId:logs,metricsPageMode:query,showHistogram:!t))');

      renderMetricsPage();

      expect(mockDispatch).toHaveBeenCalledWith(setMetricsPageMode('query'));
      mockDispatch.mockClear();

      setHash('#/?_a=(ui:(activeTabId:logs,metricsPageMode:explore,showHistogram:!t))');
      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(mockDispatch).toHaveBeenCalledWith(setMetricsPageMode('explore'));
    });

    it('reads ui.metricsPageMode structurally, ignoring the token inside user data', () => {
      // The real ui mode is `explore`, but the literal `metricsPageMode:query`
      // also appears inside a query VALUE. A substring match would wrongly flip
      // to query; rison-decoding reads only the structured ui field.
      setHash(
        "#/?_a=(query:'search metricsPageMode:query here'," +
          'ui:(activeTabId:logs,metricsPageMode:explore,showHistogram:!t))'
      );

      renderMetricsPage();

      expect(mockDispatch).toHaveBeenCalledWith(setMetricsPageMode('explore'));
      expect(mockDispatch).not.toHaveBeenCalledWith(setMetricsPageMode('query'));
    });

    it('does not dispatch a mode when _a is malformed', () => {
      setHash('#/?_a=(ui:(this is not valid rison');

      renderMetricsPage();

      expect(setMetricsPageModeCalls()).toHaveLength(0);
    });
  });
});
