/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExploreTabsComponent } from './tabs';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { uiReducer } from '../../application/utils/state_management/slices';
import { queryReducer } from '../../application/utils/state_management/slices';
import { resultsReducer } from '../../application/utils/state_management/slices';
import {
  setActiveTab,
  clearQueryStatusMapByKey,
} from '../../application/utils/state_management/slices';
import { executeTabQuery } from '../../application/utils/state_management/actions/query_actions';

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

const mockSetActiveTab = setActiveTab as jest.MockedFunction<typeof setActiveTab>;
const mockClearQueryStatusMapByKey = clearQueryStatusMapByKey as jest.MockedFunction<
  typeof clearQueryStatusMapByKey
>;
const mockExecuteTabQuery = executeTabQuery as jest.MockedFunction<typeof executeTabQuery>;

describe('ExploreTabsComponent', () => {
  const mockServices = {
    tabRegistry: {
      getAllTabs: jest.fn(() => [
        {
          id: 'logs',
          label: 'Logs',
          component: () => <div>Logs Content</div>,
        },
        {
          id: 'explore_visualization_tab',
          label: 'Visualization',
          component: () => <div>Visualization Content</div>,
        },
      ]),
      getTab: jest.fn((id: string) => ({
        id,
        label: id === 'logs' ? 'Logs' : 'Visualization',
        component: () => <div>{id} Content</div>,
        prepareQuery: undefined,
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
          showFilterPanel: false,
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
          <ExploreTabsComponent />
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
        showFilterPanel: false,
        showHistogram: true,
      },
      results: {},
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabsComponent />
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
        showFilterPanel: false,
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
          <ExploreTabsComponent />
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
        showFilterPanel: false,
        showHistogram: true,
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabsComponent />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.getByText('Visualization Content')).toBeInTheDocument();
  });

  it('should fallback to logs tab when activeTabId is empty', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showFilterPanel: false,
        showHistogram: true,
      },
    });

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <ExploreTabsComponent />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    // The component should render and fallback to logs tab
    expect(screen.getByText('Logs Content')).toBeInTheDocument();
  });
});
