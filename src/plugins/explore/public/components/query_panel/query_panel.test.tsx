/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryPanel } from './query_panel';
import {
  queryReducer,
  uiReducer,
  uiInitialState,
  resultsReducer,
  resultsInitialState,
  tabReducer,
  legacyReducer,
  systemReducer,
} from '../../application/utils/state_management/slices';
import { ResultStatus } from '../../application/utils/state_management/types';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../common';

// TODO: Add more test cases once api and services integrated.

jest.mock('./layout', () => ({
  QueryPanelLayout: ({ children, footer }: any) => (
    <div>
      <div data-test-subj="footer">{footer}</div>
      <div data-test-subj="editor-stack">{children}</div>
    </div>
  ),
}));
jest.mock('./components/editor_stack', () => ({
  EditorStack: (props: any) => (
    <div data-test-subj="editor-stack-mock">
      <button onClick={() => props.onPromptChange('source=test\n| where state=CA')}>
        PromptChange
      </button>
      <button onClick={() => props.onQueryChange('source=test\n| where state=CA')}>
        QueryChange
      </button>
    </div>
  ),
}));
jest.mock('./components/footer/index', () => ({
  QueryPanelFooter: (props: any) => (
    <div data-test-subj="footer-mock">
      <button onClick={props.onRunClick}>Run query</button>
      <button onClick={props.onRecentClick}>Recent Queries</button>
      {props.lineCount !== undefined && (
        <span data-test-subj="line-count">{props.lineCount} lines</span>
      )}
    </div>
  ),
}));
jest.mock('./components/footer/recent_query/table', () => ({
  RecentQueriesTable: (props: any) => (
    <div data-test-subj="recent-queries-table">
      <button
        onClick={() =>
          props.onClickRecentQuery({
            query: 'source=logs',
            prompt: '',
            language: 'ppl',
            dataset: 'test',
          })
        }
      >
        Use Recent Query
      </button>
    </div>
  ),
}));

// Create a test store with all required slices
const createTestStore = () => {
  const preloadedState = {
    query: {
      query: '',
      language: EXPLORE_DEFAULT_LANGUAGE,
      dataset: undefined,
    },
    ui: uiInitialState,
    results: resultsInitialState,
    tab: {
      logs: {},
      visualizations: {
        chartType: 'line' as const,
        styleOptions: undefined,
      },
    },
    legacy: {
      savedSearch: undefined,
      columns: [],
      sort: [],
      interval: 'auto',
      savedQuery: undefined,
      isDirty: false,
      lineCount: undefined,
    },
    system: {
      status: ResultStatus.UNINITIALIZED,
    },
  };

  return configureStore({
    reducer: {
      query: queryReducer,
      ui: uiReducer,
      results: resultsReducer,
      tab: tabReducer,
      legacy: legacyReducer,
      system: systemReducer,
    },
    preloadedState,
  });
};

// Provide minimal mocks for required props
const mockServices = {
  data: {
    autocomplete: { getQuerySuggestions: jest.fn().mockResolvedValue([]) },
    query: { timefilter: { timefilter: { setTime: jest.fn(), setRefreshInterval: jest.fn() } } },
  },
};
const mockIndexPattern = { timeFieldName: 'timestamp' };

// Helper function to render component with Redux provider
const renderWithProvider = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(<Provider store={store}>{component}</Provider>);
};

describe('QueryPanel', () => {
  it('renders QueryPanel with footer and editor stack', () => {
    renderWithProvider(
      <QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />
    );
    expect(screen.queryByTestId('footer')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-stack')).toBeInTheDocument();
  });

  it('shows recent queries table when Recent Queries is clicked', () => {
    renderWithProvider(
      <QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />
    );
    fireEvent.click(screen.getByText('Recent Queries'));
    expect(screen.getByTestId('recent-queries-table')).toBeInTheDocument();
  });

  it('updates editor with recent query when a recent query is selected', async () => {
    renderWithProvider(
      <QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />
    );
    fireEvent.click(screen.getByText('Recent Queries'));
    fireEvent.click(screen.getByText('Use Recent Query'));
    // After selecting, the recent queries table should close
    expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();
  });

  it('sets loading state when running a query', async () => {
    jest.useFakeTimers();
    renderWithProvider(
      <QueryPanel services={mockServices as any} indexPattern={mockIndexPattern as any} />
    );
    fireEvent.click(screen.getByText('Run query'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    jest.useRealTimers();
  });
});
