/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock all modules before importing the component
const mockDispatch = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();

jest.doMock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.doMock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn(() => ({ query: 'test query', language: 'PPL' })),
            setQuery: jest.fn(),
            getQueryHistory: jest.fn(() => [
              { query: 'SELECT * FROM logs', language: 'SQL' },
              { query: 'source = table | head 10', language: 'PPL' },
            ]),
          },
        },
      },
    },
  }),
}));

jest.doMock('../../utils', () => ({
  useTimeFilter: () => ({
    handleTimeChange: mockHandleTimeChange,
  }),
}));

jest.doMock('../../../../application/utils/state_management/actions/query_editor', () => ({
  loadQueryActionCreator: mockLoadQueryActionCreator,
}));

jest.doMock('../../../../application/hooks', () => ({
  useSetEditorTextWithQuery: () => mockSetEditorTextWithQuery,
}));

jest.doMock('../../../../../../data/public', () => ({
  RecentQueriesTable: ({ isVisible, onClickRecentQuery }: any) => (
    <div data-test-subj="recent-queries-table" style={{ display: isVisible ? 'block' : 'none' }}>
      <button
        data-test-subj="mock-query-item"
        onClick={() =>
          onClickRecentQuery(
            { query: 'SELECT * FROM test', language: 'SQL' },
            { from: 'now-1d', to: 'now' }
          )
        }
      >
        Mock Query
      </button>
      <button
        data-test-subj="mock-query-item-no-time"
        onClick={() => onClickRecentQuery({ query: 'SELECT * FROM test2', language: 'SQL' })}
      >
        Mock Query No Time
      </button>
      <button
        data-test-subj="mock-query-item-object"
        onClick={() =>
          onClickRecentQuery({ query: { match: { field: 'value' } }, language: 'DQL' })
        }
      >
        Mock Object Query
      </button>
    </div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RecentQueriesButton } = require('./recent_queries_button');

const createMockStore = () => {
  return configureStore({
    reducer: {
      query: (state = {}) => state,
    },
  });
};

const renderWithStore = () => {
  const mockStore = createMockStore();
  return render(
    <Provider store={mockStore}>
      <RecentQueriesButton />
    </Provider>
  );
};

describe('RecentQueriesButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the recent queries button with correct text and icon', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Recent Queries');
  });

  it('toggles popover visibility when button is clicked', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');

    // Initially no table in DOM
    expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(button);
    let table = screen.getByTestId('recent-queries-table');
    expect(table).toHaveStyle({ display: 'block' });

    // Click to hide
    fireEvent.click(button);
    table = screen.getByTestId('recent-queries-table');
    expect(table).toHaveStyle({ display: 'none' });
  });

  it('passes correct props to RecentQueriesTable', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');

    // Initially not visible (not in DOM)
    expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();

    // After clicking button, should be visible
    fireEvent.click(button);
    const table = screen.getByTestId('recent-queries-table');
    expect(table).toHaveStyle({ display: 'block' });
  });

  it('calls loadQueryActionCreator with correct parameters when query is clicked', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    fireEvent.click(button); // Show the table

    const queryItem = screen.getByTestId('mock-query-item');
    fireEvent.click(queryItem);

    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: expect.objectContaining({
            queryString: expect.any(Object),
          }),
        }),
      }),
      mockSetEditorTextWithQuery,
      'SELECT * FROM test'
    );
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('handles time range when query is clicked with time data', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    fireEvent.click(button); // Show the table

    const queryItem = screen.getByTestId('mock-query-item');
    fireEvent.click(queryItem);

    expect(mockHandleTimeChange).toHaveBeenCalledWith({
      start: 'now-1d',
      end: 'now',
      isInvalid: false,
      isQuickSelection: true,
    });
  });

  it('does not call handleTimeChange when no time range is provided', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    fireEvent.click(button); // Show the table

    const queryItem = screen.getByTestId('mock-query-item-no-time');
    fireEvent.click(queryItem);

    expect(mockHandleTimeChange).not.toHaveBeenCalled();
    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      expect.any(Object),
      mockSetEditorTextWithQuery,
      'SELECT * FROM test2'
    );
  });

  it('closes popover after selecting a query', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');

    // Open popover
    fireEvent.click(button);
    let table = screen.getByTestId('recent-queries-table');
    expect(table).toHaveStyle({ display: 'block' });

    // Click a query item
    const queryItem = screen.getByTestId('mock-query-item');
    fireEvent.click(queryItem);

    // Popover should be closed (table hidden)
    table = screen.getByTestId('recent-queries-table');
    expect(table).toHaveStyle({ display: 'none' });
  });
});
