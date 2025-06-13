/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryPanel } from '../query_panel';
import { queryReducer } from '../../utils/state_management/slices/query_slice';
import { uiReducer } from '../../utils/state_management/slices/ui_slice';
import { resultsReducer } from '../../utils/state_management/slices/results_slice';
// Transaction functionality is handled in ui_slice

// Mock the DefaultInput component
jest.mock(
  '../../../../../../src/plugins/data/public/ui/query_editor/editors/default_editor',
  () => ({
    DefaultInput: ({
      value,
      onChange,
      editorDidMount,
    }: {
      value: string;
      onChange: (value: string) => void;
      editorDidMount: (editor: any) => void;
    }) => (
      <div data-testid="mock-default-input">
        <input
          data-testid="mock-query-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          data-testid="mock-editor-mount"
          onClick={() => editorDidMount({ addCommand: jest.fn() })}
        >
          Mount Editor
        </button>
      </div>
    ),
  })
);

// Mock the QueryLanguageSelector component
jest.mock('../../../../../../src/plugins/data/public/ui/query_editor/language_selector', () => ({
  QueryLanguageSelector: ({
    onSelectLanguage,
  }: {
    onSelectLanguage: (language: string) => void;
  }) => (
    <div data-testid="mock-language-selector">
      <button data-testid="mock-select-language" onClick={() => onSelectLanguage('ppl')}>
        Select PPL
      </button>
    </div>
  ),
}));

// Mock the transaction actions
jest.mock('../../state_management/actions/transaction_actions', () => ({
  beginTransaction: jest.fn(() => ({ type: 'transaction/beginTransaction' })),
  finishTransaction: jest.fn(() => ({ type: 'transaction/finishTransaction' })),
}));

// Mock the OpenSearchDashboards context
jest.mock('../../../../../../src/plugins/opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: {
            getLanguageService: () => ({
              getLanguages: () => [{ id: 'ppl', title: 'PPL' }],
            }),
          },
        },
      },
    },
  }),
}));

describe('QueryPanel', () => {
  let store: any;

  beforeEach(() => {
    // Create test store
    store = configureStore({
      reducer: {
        query: queryReducer,
        ui: uiReducer,
        results: resultsReducer,
      },
      preloadedState: {
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        ui: {
          activeTabId: 'logs',
          isLoading: false,
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
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

  it('renders with initial query from store', () => {
    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Check that the mock input has the initial query value
    const queryInput = screen.getByTestId('mock-query-input');
    expect(queryInput).toHaveValue('test query');
  });

  it('updates local state when input changes', () => {
    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Get the input element
    const queryInput = screen.getByTestId('mock-query-input');

    // Change the input value
    fireEvent.change(queryInput, { target: { value: 'new query' } });

    // Check that the input value has changed
    expect(queryInput).toHaveValue('new query');
  });

  it('dispatches actions when Run button is clicked', async () => {
    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Get the input element and change its value
    const queryInput = screen.getByTestId('mock-query-input');
    fireEvent.change(queryInput, { target: { value: 'new query' } });

    // Get the Run button and click it
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    // Wait for all actions to be dispatched
    await waitFor(() => {
      // Check that the correct actions were dispatched
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/beginTransaction' });

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'query/setQueryString',
        payload: 'new query',
      });

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'results/clearResults',
      });

      expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/finishTransaction' });
    });
  });

  it('dispatches actions when language is changed', async () => {
    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Get the language selector button and click it
    const languageButton = screen.getByTestId('mock-select-language');
    fireEvent.click(languageButton);

    // Wait for all actions to be dispatched
    await waitFor(() => {
      // Check that the correct actions were dispatched
      expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/beginTransaction' });

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'query/setLanguage',
        payload: 'ppl',
      });

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'results/clearResults',
      });

      expect(store.dispatch).toHaveBeenCalledWith({ type: 'transaction/finishTransaction' });
    });
  });

  it('shows loading state when isLoading is true', () => {
    // Update store with loading state
    store = configureStore({
      reducer: {
        query: queryReducer,
        ui: uiReducer,
        results: resultsReducer,
      },
      preloadedState: {
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        ui: {
          activeTabId: 'logs',
          isLoading: true, // Set loading to true
          error: null,
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Check that the Run button shows loading state
    const runButton = screen.getByText('Run');
    expect(runButton).toHaveClass('euiButton-isLoading');
  });

  it('shows error message when there is an error', () => {
    // Update store with error state
    const error = new Error('Test error');
    store = configureStore({
      reducer: {
        query: queryReducer,
        ui: uiReducer,
        results: resultsReducer,
      },
      preloadedState: {
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        ui: {
          activeTabId: 'logs',
          isLoading: false,
          error, // Set error
          flavor: 'log',
          queryPanel: {
            promptQuery: '',
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <QueryPanel />
      </Provider>
    );

    // Check that error message is shown
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });
});
