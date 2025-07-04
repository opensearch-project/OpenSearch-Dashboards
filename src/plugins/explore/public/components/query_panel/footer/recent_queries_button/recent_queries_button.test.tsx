/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RECENT_QUERIES_TABLE_WRAPPER_EL } from '../../utils/constants';

// Mock all modules before importing the component
const mockDispatch = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockLoadQueryActionCreator = jest.fn();

jest.doMock('react-dom', () => ({
  createPortal: jest.fn((children) => children),
}));

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

jest.doMock('../../../../application/context', () => ({
  useEditorContext: () => ({
    editorMode: 'single-query',
    language: 'PPL',
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
  let mockWrapperElement: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create and add the wrapper element to the DOM
    mockWrapperElement = document.createElement('div');
    mockWrapperElement.id = RECENT_QUERIES_TABLE_WRAPPER_EL;
    document.body.appendChild(mockWrapperElement);
  });

  afterEach(() => {
    // Clean up the wrapper element
    if (document.getElementById(RECENT_QUERIES_TABLE_WRAPPER_EL)) {
      document.body.removeChild(mockWrapperElement);
    }
  });

  it('renders the recent queries button with correct text and icon', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Recent Queries');
  });

  it('toggles queries visibility when button is clicked', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    const table = screen.getByTestId('recent-queries-table');

    // Initially hidden
    expect(table).toHaveStyle({ display: 'none' });

    // Click to show
    fireEvent.click(button);
    expect(table).toHaveStyle({ display: 'block' });

    // Click to hide
    fireEvent.click(button);
    expect(table).toHaveStyle({ display: 'none' });
  });

  it('does not render portal when wrapper element is not found', () => {
    // Remove the wrapper element
    document.body.removeChild(mockWrapperElement);

    const reactDom = jest.requireMock('react-dom');
    reactDom.createPortal.mockClear();

    renderWithStore();

    // Should not call createPortal when wrapper element doesn't exist
    expect(reactDom.createPortal).not.toHaveBeenCalled();
  });

  it('renders portal when wrapper element exists', () => {
    const reactDom = jest.requireMock('react-dom');
    reactDom.createPortal.mockClear();

    renderWithStore();

    // Should call createPortal with RecentQueriesTable and wrapper element
    expect(reactDom.createPortal).toHaveBeenCalledWith(expect.anything(), mockWrapperElement);
  });

  it('passes correct props to RecentQueriesTable', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    const table = screen.getByTestId('recent-queries-table');

    // Initially not visible
    expect(table).toHaveStyle({ display: 'none' });

    // After clicking button, should be visible
    fireEvent.click(button);
    expect(table).toHaveStyle({ display: 'block' });
  });
});
