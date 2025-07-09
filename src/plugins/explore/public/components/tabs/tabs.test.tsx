/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExploreTabsComponent } from './tabs';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { uiReducer } from '../../application/utils/state_management/slices';
import { queryReducer } from '../../application/utils/state_management/slices';
import { resultsReducer } from '../../application/utils/state_management/slices';
import { detectAndSetOptimalTab } from '../../application/utils/state_management/actions/detect_optimal_tab';

jest.mock('../../application/utils/state_management/actions/detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn(() => ({
    type: 'detectAndSetOptimalTab',
    payload: {},
  })),
}));

const mockDetectAndSetOptimalTab = detectAndSetOptimalTab as jest.MockedFunction<
  typeof detectAndSetOptimalTab
>;

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
          showDatasetFields: true,
          prompt: '',
          showHistogram: true,
        },
        query: {
          query: 'SELECT * FROM logs',
          language: 'sql',
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

  it('should dispatch detectAndSetOptimalTab when activeTabId is empty and results are available', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showDatasetFields: true,
        prompt: '',
        showHistogram: true,
      },
      results: {
        'test-cache-key': {
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

    expect(mockDetectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
  });

  it('should not dispatch detectAndSetOptimalTab when activeTabId is set', () => {
    const store = createMockStore({
      ui: {
        activeTabId: 'logs',
        showDatasetFields: true,
        prompt: '',
        showHistogram: true,
      },
      results: {
        'test-cache-key': {
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

    expect(mockDetectAndSetOptimalTab).not.toHaveBeenCalled();
  });

  it('should not dispatch detectAndSetOptimalTab when no results are available', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showDatasetFields: true,
        prompt: '',
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

    expect(mockDetectAndSetOptimalTab).not.toHaveBeenCalled();
  });

  it('should fallback to logs tab when activeTabId is empty', () => {
    const store = createMockStore({
      ui: {
        activeTabId: '',
        showDatasetFields: true,
        prompt: '',
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
