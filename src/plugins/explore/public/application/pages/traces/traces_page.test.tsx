/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { i18n } from '@osd/i18n';
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
import { TracesPage } from './traces_page';
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

jest.mock('../../../components/query_panel', () => ({
  QueryPanel: () => <div data-test-subj="query-panel">Query Panel</div>,
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

describe('TracesPage', () => {
  const createTestStore = (
    status = QueryExecutionStatus.UNINITIALIZED,
    rows: OpenSearchSearchHit[] = [],
    fieldSchema: any[] = []
  ) => {
    // Create query object that matches the TracesPage component expectations
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
      preloadedState,
    });
  };

  const TestHarness: FC<{ store: ReturnType<typeof createTestStore> }> = ({ children, store }) => {
    return (
      <MemoryRouter>
        <Provider store={store}>{children}</Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    const exploreServices = discoverPluginMock.createExploreServicesMock();
    const exploreServicesMock = exploreServices as jest.MaybeMockedDeep<typeof exploreServices>;
    exploreServicesMock.uiSettings.get.mockImplementation((_, defaultValue) => defaultValue);

    exploreServicesMock.keyboardShortcut = {
      useKeyboardShortcut: mockUseKeyboardShortcut,
      register: jest.fn(),
      unregister: jest.fn(),
      getAllShortcuts: jest.fn(),
    };

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: exploreServicesMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardShortcut.mockClear();
  });

  it('renders without crashing', () => {
    const store = createTestStore();
    render(
      <TestHarness store={store}>
        <TracesPage />
      </TestHarness>
    );

    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-container')).toBeInTheDocument();
    expect(screen.getByTestId('new-experience-banner')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  it('passes setHeaderActionMenu prop to TopNav', () => {
    const mockSetHeaderActionMenu = jest.fn();
    const store = createTestStore();
    render(
      <TestHarness store={store}>
        <TracesPage setHeaderActionMenu={mockSetHeaderActionMenu} />
      </TestHarness>
    );

    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-container')).toBeInTheDocument();
  });

  it('renders when dataset is loading', () => {
    const store = createTestStore();
    render(
      <TestHarness store={store}>
        <TracesPage />
      </TestHarness>
    );

    expect(screen.getByTestId('query-panel')).toBeInTheDocument();
    expect(screen.getByTestId('top-nav')).toBeInTheDocument();
  });

  describe('Keyboard Shortcuts', () => {
    it('registers all keyboard shortcuts correctly', () => {
      const store = createTestStore();
      render(
        <TestHarness store={store}>
          <TracesPage />
        </TestHarness>
      );

      expect(mockUseKeyboardShortcut).toHaveBeenCalledTimes(2);

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'switchToPatternsTabTraces',
        pluginId: 'explore',
        name: 'Switch to patterns tab',
        category: 'Navigation',
        keys: 'shift+p',
        execute: expect.any(Function),
      });

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'switchToVisualizationTabTraces',
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
        <TestHarness store={store}>
          <TracesPage />
        </TestHarness>
      );

      const patternsTabCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToPatternsTabTraces'
      );
      const visualizationTabCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToVisualizationTabTraces'
      );

      expect(patternsTabCall).toBeDefined();
      expect(visualizationTabCall).toBeDefined();

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

    it('keyboard shortcuts have unique IDs for traces page', () => {
      const store = createTestStore();
      render(
        <TestHarness store={store}>
          <TracesPage />
        </TestHarness>
      );
      const shortcutIds = mockUseKeyboardShortcut.mock.calls.map((call) => call[0].id);
      expect(shortcutIds).toContain('switchToPatternsTabTraces');
      expect(shortcutIds).toContain('switchToVisualizationTabTraces');

      expect(new Set(shortcutIds).size).toBe(shortcutIds.length);
    });

    it('keyboard shortcuts use correct key combinations', () => {
      const store = createTestStore();
      render(
        <TestHarness store={store}>
          <TracesPage />
        </TestHarness>
      );

      const patternsCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToPatternsTabTraces'
      );
      const visualizationCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'switchToVisualizationTabTraces'
      );

      expect(patternsCall[0].keys).toBe('shift+p');
      expect(visualizationCall[0].keys).toBe('shift+v');
    });
  });
});
