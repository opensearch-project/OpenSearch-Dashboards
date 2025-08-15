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
import {
  setActiveTab,
  clearQueryStatusMapByKey,
} from '../../application/utils/state_management/slices';
import { executeTabQuery } from '../../application/utils/state_management/actions/query_actions';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../common';

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
}));

jest.mock('./error_guard/error_guard', () => ({
  ErrorGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
      },
      preloadedState: {
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
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should render selected tab content when activeTabId is set', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'explore_visualization_tab',
        showHistogram: true,
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

  it('should fallback to logs tab when activeTabId is empty', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showHistogram: true,
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabs />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    // The component should render and fallback to logs tab
    expect(screen.getByText('Logs Content')).toBeInTheDocument();
  });
});
