/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, act } from '@testing-library/react';
import { FC } from 'react';
import { Provider } from 'react-redux';
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
import { LogsPage } from './logs_page';
import { defaultPrepareQueryString } from '../../utils/state_management/actions/query_actions';

const mockUseKeyboardShortcut = jest.fn();

// Mock i18n translate function
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn(
      (key: string, options: { defaultMessage: string }) => options.defaultMessage
    ),
  },
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: jest.fn(),
  }),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

// Surface whether the analyze props were passed (vs. gated to `undefined`) and
// expose the `onModeChange` callback so tests can drive builder code/visual mode.
interface StubAnalyzeProps {
  analyzeIsOpen?: boolean;
  onToggleAnalyze?: () => void;
  hasAnalyzeResult?: boolean;
  onModeChange?: (isCode: boolean) => void;
}

let latestOnModeChange: ((isCode: boolean) => void) | undefined;

jest.mock('../../../components/query_panel', () => ({
  QueryPanel: ({ onToggleAnalyze }: StubAnalyzeProps) => (
    <div data-test-subj="query-panel">
      Query Panel
      {onToggleAnalyze !== undefined && <span data-test-subj="query-panel-analyze-enabled" />}
    </div>
  ),
}));

jest.mock('./logs_query_panel', () => ({
  LogsQueryPanel: ({ onToggleAnalyze, onModeChange }: StubAnalyzeProps) => {
    latestOnModeChange = onModeChange;
    return (
      <div data-test-subj="logs-query-panel">
        Logs Query Panel
        {onToggleAnalyze !== undefined && <span data-test-subj="logs-query-panel-analyze-enabled" />}
      </div>
    );
  },
}));

// Control the analyze panel open/loading/result state directly.
const mockAnalyzeState = {
  isOpen: false,
  setIsOpen: jest.fn(),
  hasResult: false,
  isLoading: false,
};
jest.mock('../../../components/query_panel/query_panel_widgets', () => ({
  useAnalyzePanelState: () => mockAnalyzeState,
}));

jest.mock('../../../components/container/bottom_container', () => ({
  BottomContainer: () => (
    <div data-test-subj="bottom-container">
      <div data-test-subj="discover-panel">Discover Panel</div>
      <div data-test-subj="discover-chart-container">Chart Container</div>
      <div data-test-subj="explore-tabs">
        <div data-test-subj="tab-explore_logs_tab">
          <div data-test-subj="explore-data-table">Data Table</div>
        </div>
        <div data-test-subj="tab-explore_visualization_tab">
          <div data-test-subj="visualization-container">Visualization Container</div>
        </div>
      </div>
      <div data-test-subj="dscBottomLeftCanvas">Bottom Left Canvas</div>
    </div>
  ),
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

describe('LogsPage', () => {
  const createTestStore = (
    status = QueryExecutionStatus.UNINITIALIZED,
    rows: OpenSearchSearchHit[] = [],
    fieldSchema: any[] = []
  ) => {
    // Create query object that matches the LogsPage component expectations
    const queryObj = {
      ...queryInitialState,
      query: 'where level="error"',
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

  const setupServices = ({
    pplAnalyzeEnabled = false,
    logsQueryBuilderEnabled = true,
  }: { pplAnalyzeEnabled?: boolean; logsQueryBuilderEnabled?: boolean } = {}) => {
    const exploreServices = discoverPluginMock.createExploreServicesMock();
    const exploreServicesMock = exploreServices as jest.MaybeMockedDeep<typeof exploreServices>;
    exploreServicesMock.pplAnalyzeEnabled = pplAnalyzeEnabled;
    exploreServicesMock.capabilities = {
      ...exploreServicesMock.capabilities,
      explore: { logsQueryBuilderEnabled },
    };

    exploreServicesMock.keyboardShortcut = {
      useKeyboardShortcut: mockUseKeyboardShortcut,
      register: jest.fn(),
      unregister: jest.fn(),
      getAllShortcuts: jest.fn(),
    };

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: exploreServicesMock,
    });
    return exploreServicesMock;
  };

  beforeEach(() => {
    mockAnalyzeState.isOpen = false;
    mockAnalyzeState.hasResult = false;
    mockAnalyzeState.isLoading = false;
    latestOnModeChange = undefined;
    setupServices();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardShortcut.mockClear();
  });

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <LogsPage />
      </TestHarness>
    );

    expect(screen.getByTestId('logs-query-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('query-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('bottom-container')).toBeInTheDocument();
    expect(screen.getByTestId('new-experience-banner')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('renders the logs query builder panel when the query builder flag is enabled', () => {
    setupServices({ logsQueryBuilderEnabled: true });
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <LogsPage />
      </TestHarness>
    );

    expect(screen.getByTestId('logs-query-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('query-panel')).not.toBeInTheDocument();
  });

  it('passes setHeaderActionMenu prop to TopNav', () => {
    const mockSetHeaderActionMenu = jest.fn();
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <LogsPage setHeaderActionMenu={mockSetHeaderActionMenu} />
      </TestHarness>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-container')).toBeInTheDocument();
  });

  it('renders when dataset is loading', () => {
    const store = createTestStore();
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <TestHarness store={store}>
        <LogsPage />
      </TestHarness>
    );

    expect(screen.getByTestId('logs-query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  describe('PPL Analyze availability', () => {
    const renderPage = () => {
      const store = createTestStore();
      return render(
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        <TestHarness store={store}>
          <LogsPage />
        </TestHarness>
      );
    };

    it('reads the analyze flag from services.pplAnalyzeEnabled, not capabilities', () => {
      // The flag lives on services (static config), not on capabilities. Setting it
      // only on capabilities must NOT enable analyze.
      const services = setupServices({ pplAnalyzeEnabled: false, logsQueryBuilderEnabled: false });
      (services.capabilities.explore as Record<string, unknown>).pplAnalyzeEnabled = true;

      renderPage();

      expect(screen.queryByTestId('query-panel-analyze-enabled')).not.toBeInTheDocument();
    });

    it('passes analyze props to QueryPanel when analyze is enabled and the builder is off', () => {
      setupServices({ pplAnalyzeEnabled: true, logsQueryBuilderEnabled: false });

      renderPage();

      expect(screen.getByTestId('query-panel')).toBeInTheDocument();
      expect(screen.getByTestId('query-panel-analyze-enabled')).toBeInTheDocument();
    });

    it('does not pass analyze props to QueryPanel when analyze is disabled', () => {
      setupServices({ pplAnalyzeEnabled: false, logsQueryBuilderEnabled: false });

      renderPage();

      expect(screen.getByTestId('query-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('query-panel-analyze-enabled')).not.toBeInTheDocument();
    });

    it('shows the analyze region in builder code mode when analyze is open', () => {
      setupServices({ pplAnalyzeEnabled: true, logsQueryBuilderEnabled: true });
      mockAnalyzeState.isOpen = true;
      mockAnalyzeState.isLoading = true;

      renderPage();

      // The builder mounts in code mode (onModeChange(true)); analyze is available,
      // so the analyze region replaces the BottomContainer.
      act(() => latestOnModeChange?.(true));

      expect(screen.queryByTestId('bottom-container')).not.toBeInTheDocument();
      expect(screen.getByText('Running query analysis…')).toBeInTheDocument();
    });

    it('hides the analyze region when the builder switches to visual mode', () => {
      setupServices({ pplAnalyzeEnabled: true, logsQueryBuilderEnabled: true });
      mockAnalyzeState.isOpen = true;
      mockAnalyzeState.isLoading = true;

      renderPage();

      // Visual builder mode: analyze is not available even though it is open, so the
      // BottomContainer is shown instead of the analyze region.
      act(() => latestOnModeChange?.(false));

      expect(screen.getByTestId('bottom-container')).toBeInTheDocument();
      expect(screen.queryByText('Running query analysis…')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('registers all keyboard shortcuts correctly', () => {
      const store = createTestStore();
      render(
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        <TestHarness store={store}>
          <LogsPage />
        </TestHarness>
      );

      expect(mockUseKeyboardShortcut).toHaveBeenCalledTimes(3);

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'switchToLogsTabLogs',
        pluginId: 'explore',
        name: 'Switch to logs tab',
        category: 'Navigation',
        keys: 'shift+l',
        execute: expect.any(Function),
      });

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'switchToPatternsTabLogs',
        pluginId: 'explore',
        name: 'Switch to patterns tab',
        category: 'Navigation',
        keys: 'shift+p',
        execute: expect.any(Function),
      });

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'switchToVisualizationTabLogs',
        pluginId: 'explore',
        name: 'Switch to visualization tab',
        category: 'Navigation',
        keys: 'shift+v',
        execute: expect.any(Function),
      });
    });

    it('keyboard shortcuts dispatch correct Redux actions', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        <TestHarness store={store}>
          <LogsPage />
        </TestHarness>
      );

      const logsTabCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToLogsTabLogs'
      );
      const patternsTabCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToPatternsTabLogs'
      );
      const visualizationTabCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToVisualizationTabLogs'
      );

      expect(logsTabCall).toBeDefined();
      expect(patternsTabCall).toBeDefined();
      expect(visualizationTabCall).toBeDefined();

      logsTabCall[0].execute();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setActiveTab'),
          payload: 'logs',
        })
      );

      patternsTabCall[0].execute();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setActiveTab'),
          payload: 'explore_patterns_tab',
        })
      );

      visualizationTabCall[0].execute();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setActiveTab'),
          payload: 'explore_visualization_tab',
        })
      );
    });
  });
});
