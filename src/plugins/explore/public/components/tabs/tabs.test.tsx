/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExploreTabs } from './tabs';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { uiReducer } from '../../application/utils/state_management/slices';
import { queryReducer } from '../../application/utils/state_management/slices';
import { resultsReducer } from '../../application/utils/state_management/slices';
import { queryEditorReducer } from '../../application/utils/state_management/slices/query_editor/query_editor_slice';
import {
  setActiveTab,
  clearQueryStatusMapByKey,
} from '../../application/utils/state_management/slices';
import { executeTabQuery } from '../../application/utils/state_management/actions/query_actions';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../common';
import { useDatasetContext } from '../../application/context';

jest.mock('../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => 'logs'),
}));

jest.mock('../../application/utils/state_management/slices', () => ({
  ...jest.requireActual('../../application/utils/state_management/slices'),
  setActiveTab: jest.fn(() => ({
    type: 'ui/setActiveTab',
    payload: {},
  })),
  clearQueryStatusMapByKey: jest.fn(() => ({
    type: 'query/clearQueryStatusMapByKey',
    payload: {},
  })),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  executeTabQuery: jest.fn(() => ({
    type: 'executeTabQuery',
    payload: {},
  })),
  defaultPrepareQueryString: jest.fn((query) => `cache-key-${query.query}`),
  shouldSkipQueryExecution: jest.fn(() => false),
}));

jest.mock('./error_guard/error_guard', () => ({
  ErrorGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../application/context', () => ({
  useDatasetContext: jest.fn(() => ({ dataset: undefined })),
}));

const mockUseIsNonTimeSeries = jest.fn(() => false);
jest.mock('../../helpers/use_displayed_columns', () => ({
  useIsNonTimeSeries: () => mockUseIsNonTimeSeries(),
}));

jest.mock(
  '../../application/legacy/discover/application/components/uninitialized/uninitialized',
  () => ({
    DiscoverUninitialized: () => <div>Uninitialized</div>,
  })
);

jest.mock('../../application/legacy/discover/application/components/no_results/no_results', () => ({
  DiscoverNoResults: () => <div>No Results</div>,
}));

jest.mock(
  '../../application/legacy/discover/application/components/loading_spinner/loading_spinner',
  () => ({
    LoadingSpinner: () => <div>Searching</div>,
  })
);

const mockSetActiveTab = setActiveTab as jest.MockedFunction<typeof setActiveTab>;
const mockClearQueryStatusMapByKey = clearQueryStatusMapByKey as jest.MockedFunction<
  typeof clearQueryStatusMapByKey
>;
const mockExecuteTabQuery = executeTabQuery as jest.MockedFunction<typeof executeTabQuery>;

const mockUseFlavorId = useFlavorId as jest.MockedFunction<typeof useFlavorId>;

describe('ExploreTabsComponent', () => {
  const mockServices = {
    tabRegistry: {
      getAllTabs: jest.fn(() => [
        {
          id: 'logs_tab',
          label: 'Logs',
          component: () => <div>Logs Content</div>,
          flavor: [ExploreFlavor.Logs],
        },
        {
          id: 'explore_visualization_tab',
          label: 'Visualization',
          component: () => <div>Visualization Content</div>,
          flavor: [ExploreFlavor.Logs],
        },
      ]),
      getTab: jest.fn((id: string) => ({
        id,
        label: id === 'logs' ? 'Logs' : 'Visualization',
        component: () => <div>{id} Content</div>,
        prepareQuery: undefined,
        flavor: [ExploreFlavor.Logs],
      })),
    },
  };

  const createMockStore = ({ queryEditor, ...initialState }: Record<string, any> = {}) => {
    return configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        queryEditor: queryEditorReducer,
      },
      preloadedState: {
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        ui: {
          activeTabId: '',
          showHistogram: true,
        },
        query: {
          query: 'SELECT * FROM logs',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
        },
        results: {},
        ...initialState,
        queryEditor: {
          ...queryEditorReducer(undefined, { type: '@@INIT' }),
          ...queryEditor,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsNonTimeSeries.mockReturnValue(false);
  });

  it('should render tabs correctly', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Visualization')).toBeInTheDocument();
  });

  it('should dispatch setActiveTab and executeTabQuery when tab is clicked and results not cached', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'logs',
        showHistogram: true,
      },
      results: {},
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    const visualizationTab = screen.getByText('Visualization');
    fireEvent.click(visualizationTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('explore_visualization_tab');
    expect(mockClearQueryStatusMapByKey).toHaveBeenCalled();
    expect(mockExecuteTabQuery).toHaveBeenCalled();
  });

  it('should not execute query when tab is clicked and results are already cached', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'logs',
        showHistogram: true,
      },
      results: {
        'cache-key-SELECT * FROM logs': {
          hits: { hits: [{ _source: { test: 'value' } }] },
          fieldSchema: [{ name: 'test', type: 'string' }],
        },
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    const visualizationTab = screen.getByText('Visualization');
    fireEvent.click(visualizationTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('explore_visualization_tab');
    expect(mockClearQueryStatusMapByKey).not.toHaveBeenCalled();
    expect(mockExecuteTabQuery).not.toHaveBeenCalled();
  });

  it('does not restart a tab query that is already running when its tab is clicked', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'logs',
        showHistogram: true,
      },
      queryEditor: {
        overallQueryStatus: { status: 'loading' },
        queryStatusMap: { 'cache-key-SELECT * FROM logs': { status: 'loading' } },
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    fireEvent.click(screen.getByText('Visualization'));

    expect(mockSetActiveTab).toHaveBeenCalledWith('explore_visualization_tab');
    expect(mockClearQueryStatusMapByKey).not.toHaveBeenCalled();
    expect(mockExecuteTabQuery).not.toHaveBeenCalled();
  });

  it('should render selected tab content when activeTabId is set', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'explore_visualization_tab',
        showHistogram: true,
      },
      queryEditor: {
        overallQueryStatus: { status: 'ready' },
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.getByText('Visualization Content')).toBeInTheDocument();
  });

  describe('while the active tab has its own query in flight', () => {
    const renderTabs = (queryEditor: Record<string, unknown>, results = {}) => {
      const store = createMockStore({
        ui: { activeTabId: 'explore_visualization_tab', showHistogram: true },
        results,
        queryEditor: { overallQueryStatus: { status: 'ready' }, ...queryEditor },
      });
      return render(
        <Provider store={store}>
          <OpenSearchDashboardsContextProvider services={mockServices}>
            <ExploreTabs />
          </OpenSearchDashboardsContextProvider>
        </Provider>
      );
    };
    const TAB_KEY = 'cache-key-SELECT * FROM logs';

    it('shows the searching state instead of an empty tab', () => {
      renderTabs({ queryStatusMap: { [TAB_KEY]: { status: 'loading' } } });
      expect(screen.getByText('Visualization')).toBeInTheDocument();

      expect(screen.getByText('Searching')).toBeInTheDocument();
      expect(screen.queryByText('Visualization Content')).not.toBeInTheDocument();
    });

    it('shows the tab once its query has returned', () => {
      renderTabs({ queryStatusMap: { [TAB_KEY]: { status: 'ready' } } });

      expect(screen.getByText('Visualization Content')).toBeInTheDocument();
      expect(screen.queryByText('Searching')).not.toBeInTheDocument();
    });

    it('keeps showing results that are already cached', () => {
      renderTabs(
        { queryStatusMap: { [TAB_KEY]: { status: 'loading' } } },
        { [TAB_KEY]: { hits: { hits: [] } } }
      );

      expect(screen.getByText('Visualization Content')).toBeInTheDocument();
    });

    it('leaves a failed tab query to the error guard', () => {
      renderTabs({ queryStatusMap: { [TAB_KEY]: { status: 'error' } } });

      expect(screen.getByText('Visualization Content')).toBeInTheDocument();
    });

    it('does not treat a tab that cannot build a query yet as loading', () => {
      mockServices.tabRegistry.getAllTabs.mockReturnValueOnce([
        {
          id: 'explore_visualization_tab',
          label: 'Visualization',
          component: () => <div>Visualization Content</div>,
          flavor: [ExploreFlavor.Logs],
          prepareQuery: () => '',
        } as any,
      ]);
      renderTabs({ queryStatusMap: { '': { status: 'loading' } } });

      expect(screen.queryByText('Searching')).not.toBeInTheDocument();
      expect(screen.getByText('Visualization Content')).toBeInTheDocument();
    });
  });

  it('should return null when flavorId is null', () => {
    mockUseFlavorId.mockReturnValue(null);
    const store = createMockStore();

    const { container } = render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(container.firstChild).toBeNull();
    mockUseFlavorId.mockReturnValue(ExploreFlavor.Logs); // Reset for other tests
  });

  describe('language-based tab visibility', () => {
    // Two tabs: one language-agnostic (declares nothing), one PPL-only.
    const servicesWithLanguages = (supportedLanguages: string[]) => ({
      tabRegistry: {
        getAllTabs: jest.fn(() => [
          {
            id: 'logs_tab',
            label: 'Logs',
            component: () => <div>Logs Content</div>,
            flavor: [ExploreFlavor.Logs],
          },
          {
            id: 'lang_gated_tab',
            label: 'Gated',
            component: () => <div>Gated Content</div>,
            flavor: [ExploreFlavor.Logs],
            supportedLanguages,
          },
        ]),
        getTab: jest.fn((id: string) => ({
          id,
          label: id,
          component: () => <div>{id} Content</div>,
          prepareQuery: undefined,
          flavor: [ExploreFlavor.Logs],
        })),
      },
    });

    const renderWithLanguage = (supportedLanguages: string[], language: string) => {
      const store = createMockStore({
        query: {
          query: 'SELECT * FROM logs',
          language,
          dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
        },
      });
      return render(
        <Provider store={store}>
          <OpenSearchDashboardsContextProvider services={servicesWithLanguages(supportedLanguages)}>
            <ExploreTabs />
          </OpenSearchDashboardsContextProvider>
        </Provider>
      );
    };

    it('renders a tab whose supportedLanguages include the active language', () => {
      renderWithLanguage(['PPL', 'SQL'], 'SQL');
      expect(screen.getByText('Gated')).toBeInTheDocument();
    });

    it('hides a tab whose supportedLanguages exclude the active language', () => {
      // Previously only Patterns and Field statistics were hidden for SQL by a
      // hardcoded id check, so a PPL-only tab like this one still rendered.
      renderWithLanguage(['PPL'], 'SQL');
      expect(screen.queryByText('Gated')).not.toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    it('treats a tab that declares no supportedLanguages as language-agnostic', () => {
      // The Logs tab in this fixture declares none and must survive both languages.
      renderWithLanguage(['PPL'], 'SQL');
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    it('matches languages case-sensitively against the canonical values', () => {
      // EXPLORE_DEFAULT_LANGUAGE is 'PPL'; query.language is always uppercase.
      renderWithLanguage(['PPL'], 'PPL');
      expect(screen.getByText('Gated')).toBeInTheDocument();
    });
  });

  describe('non-time-series tab-set mode swap', () => {
    const servicesWithStatistics = {
      tabRegistry: {
        getAllTabs: jest.fn(() => [
          {
            id: 'logs',
            label: 'Logs',
            component: () => <div>Logs Content</div>,
            flavor: [ExploreFlavor.Logs],
          },
          {
            id: 'explore_visualization_tab',
            label: 'Visualization',
            component: () => <div>Visualization Content</div>,
            flavor: [ExploreFlavor.Logs],
          },
          {
            id: 'explore_statistics',
            label: 'Statistics',
            component: () => <div>Statistics Content</div>,
            flavor: [ExploreFlavor.Logs],
          },
        ]),
        getTab: jest.fn((id: string) => ({
          id,
          label: id,
          component: () => <div>{id} Content</div>,
          prepareQuery: undefined,
          flavor: [ExploreFlavor.Logs],
        })),
      },
    };

    const renderSwap = () => {
      const store = createMockStore({
        ui: { activeTabId: 'logs', showHistogram: true },
        queryEditor: { overallQueryStatus: { status: 'ready' } },
      });
      return render(
        <Provider store={store}>
          <OpenSearchDashboardsContextProvider services={servicesWithStatistics}>
            <ExploreTabs />
          </OpenSearchDashboardsContextProvider>
        </Provider>
      );
    };

    it('shows the full time-series tab set when results are time-series', () => {
      mockUseIsNonTimeSeries.mockReturnValue(false);
      renderSwap();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Visualization')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.queryByText('Query Results')).not.toBeInTheDocument();
    });

    it('collapses to a single relabeled Query Results tab for non-time-series results', () => {
      mockUseIsNonTimeSeries.mockReturnValue(true);
      renderSwap();
      // Logs and Visualization are hidden; only the (relabeled) Statistics surface remains.
      expect(screen.queryByText('Logs')).not.toBeInTheDocument();
      expect(screen.queryByText('Visualization')).not.toBeInTheDocument();
      expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
      expect(screen.getByText('Query Results')).toBeInTheDocument();
    });

    it('falls back to the first available tab when Logs is hidden mid-session', () => {
      // activeTabId is 'logs', which no longer exists in non-time-series mode; the component
      // must fall back rather than render an empty panel.
      mockUseIsNonTimeSeries.mockReturnValue(true);
      renderSwap();
      expect(screen.getByText('Statistics Content')).toBeInTheDocument();
    });

    describe('dataset without a time field', () => {
      const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<
        typeof useDatasetContext
      >;

      beforeEach(() => {
        // Run the real detection so this exercises dataset -> mode, not just the mock's return.
        const { useIsNonTimeSeries } = jest.requireActual('../../helpers/use_displayed_columns');
        mockUseIsNonTimeSeries.mockImplementation(useIsNonTimeSeries);
      });

      afterEach(() => {
        mockUseDatasetContext.mockReturnValue({ dataset: undefined } as any);
      });

      it('collapses to Query Results immediately, before any results arrive', () => {
        mockUseDatasetContext.mockReturnValue({
          dataset: { id: 'lookup', title: 'lookup', timeFieldName: undefined },
        } as any);
        // The store has no results: the swap must not wait for them, or Logs would flash first.
        renderSwap();
        expect(screen.queryByText('Logs')).not.toBeInTheDocument();
        expect(screen.queryByText('Visualization')).not.toBeInTheDocument();
        expect(screen.getByText('Query Results')).toBeInTheDocument();
      });

      it('keeps the time-series tab set for a time-based dataset with no results yet', () => {
        mockUseDatasetContext.mockReturnValue({
          dataset: { id: 'logs', title: 'logs', timeFieldName: '@timestamp' },
        } as any);
        renderSwap();
        expect(screen.getByText('Logs')).toBeInTheDocument();
        expect(screen.queryByText('Query Results')).not.toBeInTheDocument();
      });
    });
  });

  it('should fallback to first tab when activeTabId is empty', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showHistogram: true,
      },
      queryEditor: {
        overallQueryStatus: { status: 'ready' },
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    // The component should render and fallback to first available tab
    expect(screen.getByText('Logs Content')).toBeInTheDocument();
  });
});
