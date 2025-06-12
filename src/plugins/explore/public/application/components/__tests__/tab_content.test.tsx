/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { TabContent } from '../tab_content';
import { uiReducer } from '../../utils/state_management/slices/ui_slice';
import { queryReducer } from '../../utils/state_management/slices/query_slice';
import { resultsReducer } from '../../utils/state_management/slices/results_slice';
import { ResultStatus } from '../../utils/state_management/types';

// Mock the tab components
jest.mock('../../components/tabs/logs_tab', () => ({
  __esModule: true,
  default: () => <div data-testid="logs-tab">Logs Tab Content</div>,
}));

jest.mock('../../components/tabs/visualizations_tab', () => ({
  __esModule: true,
  default: () => <div data-testid="visualizations-tab">Visualizations Tab Content</div>,
}));

// Mock the selectors
jest.mock('../../state_management/selectors', () => ({
  selectActiveTabId: (state: any) => state.ui.activeTabId,
  selectActiveTab: (state: any) => state.services.tabRegistry.getTab(state.ui.activeTabId),
  selectQuery: (state: any) => state.query.query,
  selectResults: (state: any) => state.results[state.ui.activeTabId],
  selectIsLoading: (state: any) => state.ui.status === ResultStatus.LOADING,
  selectCacheKey: (state: any) => state.ui.activeTabId,
}));

describe('TabContent', () => {
  let store: any;
  let mockTabs: any[];

  beforeEach(() => {
    // Create mock tabs
    mockTabs = [
      {
        id: 'logs',
        label: 'Logs',
        supportedLanguages: ['lucene', 'ppl'],
        prepareQuery: (query: any) => query,
        component: jest.requireMock('../../components/tabs/logs_tab').default,
      },
      {
        id: 'visualizations',
        label: 'Visualizations',
        supportedLanguages: ['ppl'],
        prepareQuery: (query: any) => query,
        component: jest.requireMock('../../components/tabs/visualizations_tab').default,
      },
    ];

    // Create mock services with tab registry
    const mockServices = {
      tabRegistry: {
        getAllTabs: jest.fn(() => mockTabs),
        getTab: jest.fn((id) => mockTabs.find((tab) => tab.id === id)),
      },
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
      },
    };

    // Create test store
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = mockServices) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'logs',
          isLoading: false,
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        results: {
          logs: {
            hits: {
              hits: [
                { _id: '1', _source: { field1: 'value1' } },
                { _id: '2', _source: { field1: 'value2' } },
              ],
            },
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the active tab component with results', () => {
    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that the Logs tab content is rendered
    expect(screen.getByTestId('logs-tab')).toBeInTheDocument();
    expect(screen.getByText('Logs Tab Content')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    // Update store with loading state
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'logs',
          isLoading: true, // Set loading to true
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        results: {},
      },
    });

    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that loading spinner is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    // Update store with error state
    const error = new Error('Test error');
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'logs',
          isLoading: false,
          error, // Set error
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        results: {},
      },
    });

    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that error message is shown
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('renders empty state when there are no results', () => {
    // Update store with no results
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'logs',
          isLoading: false,
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        results: {}, // Empty results
      },
    });

    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that empty state is shown
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Run a query to see results.')).toBeInTheDocument();
  });

  it('renders tab not found when tab definition is missing', () => {
    // Update store with invalid tab ID
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'invalid-tab', // Invalid tab ID
          isLoading: false,
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        results: {},
      },
    });

    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that tab not found message is shown
    expect(screen.getByText('Tab not found')).toBeInTheDocument();
    expect(screen.getByText('The selected tab could not be found.')).toBeInTheDocument();
  });

  it('renders different tab when activeTabId changes', () => {
    // Update store with visualizations tab
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'visualizations', // Change to visualizations tab
          isLoading: false,
          error: null,
          flavor: 'bar',
          queryPanel: {
            promptQuery: '',
          },
        },
        query: {
          query: {
            query: 'test query',
            language: 'ppl',
          },
        },
        results: {
          visualizations: {
            aggregations: {
              histogram: {
                buckets: [],
              },
            },
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <TabContent />
      </Provider>
    );

    // Check that the Visualizations tab content is rendered
    expect(screen.getByTestId('visualizations-tab')).toBeInTheDocument();
    expect(screen.getByText('Visualizations Tab Content')).toBeInTheDocument();
  });
});
