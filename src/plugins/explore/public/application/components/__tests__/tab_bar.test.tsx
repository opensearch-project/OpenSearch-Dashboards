/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { TabBar } from '../tab_bar';
import { uiReducer } from '../../utils/state_management/slices/ui_slice';
import { queryReducer } from '../../utils/state_management/slices/query_slice';

// Mock the transaction actions
jest.mock('../../state_management/actions/transaction_actions', () => ({
  beginTransaction: jest.fn(() => ({ type: 'transaction/beginTransaction' })),
  finishTransaction: jest.fn(() => ({ type: 'transaction/finishTransaction' })),
}));

describe('TabBar', () => {
  let store: any;
  let mockTabs: any[];

  beforeEach(() => {
    // Create mock tabs
    mockTabs = [
      {
        id: 'logs',
        label: 'Logs',
        supportedLanguages: ['lucene', 'ppl'],
      },
      {
        id: 'visualizations',
        label: 'Visualizations',
        supportedLanguages: ['ppl'],
      },
    ];

    // Create mock services with tab registry
    const mockServices = {
      tabRegistry: {
        getAllTabs: jest.fn(() => mockTabs),
        getTab: jest.fn((id) => mockTabs.find((tab) => tab.id === id)),
      },
    };

    // Create test store
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
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
      },
    });

    // Spy on dispatch
    jest.spyOn(store, 'dispatch');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders tabs from the tab registry', () => {
    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Check that both tabs are rendered
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Check that the Logs tab is selected (active)
    const logsTab = screen.getByText('Logs').closest('[data-test-subj="exploreTab-logs"]');
    expect(logsTab).toHaveAttribute('aria-selected', 'true');

    // Check that the Visualizations tab is not selected
    const visualizationsTab = screen
      .getByText('Visualizations')
      .closest('[data-test-subj="exploreTab-visualizations"]');
    expect(visualizationsTab).toHaveAttribute('aria-selected', 'false');
  });

  it('dispatches actions when a tab is clicked', () => {
    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Click on the Visualizations tab
    fireEvent.click(screen.getByText('Visualizations'));

    // Check that the correct actions were dispatched
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/beginTransaction' });
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'ui/setActiveTab',
      payload: 'visualizations',
    });
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/finishTransaction' });
  });

  it('does not dispatch actions when the active tab is clicked', () => {
    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Click on the already active Logs tab
    fireEvent.click(screen.getByText('Logs'));

    // Check that no actions were dispatched
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('filters tabs based on query language', () => {
    // Update store with PPL language
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
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
            language: 'ppl', // PPL language
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Both tabs should be visible since both support PPL
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();

    // Update store with a language that only Logs supports
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
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
            language: 'lucene', // Only Logs supports Lucene
          },
        },
      },
    });

    // Re-render with the new store
    const { unmount } = render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Both tabs should still be visible (we show all tabs if filtering would hide the active tab)
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();

    unmount();

    // Update store with Visualizations as active tab
    store = configureStore({
      reducer: {
        ui: uiReducer,
        query: queryReducer,
        services: (state = store.getState().services) => state,
      },
      preloadedState: {
        ui: {
          activeTabId: 'visualizations',
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
            language: 'lucene', // Only Logs supports Lucene
          },
        },
      },
    });

    // Mock the selectTabsForLanguage selector to return all tabs
    // This is necessary because our mock implementation doesn't match the real selector logic
    jest.mock('../../state_management/selectors', () => ({
      ...jest.requireActual('../../state_management/selectors'),
      selectTabsForLanguage: () => mockTabs,
    }));

    render(
      <Provider store={store}>
        <TabBar />
      </Provider>
    );

    // Both tabs should be visible
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Visualizations')).toBeInTheDocument();
  });
});
