/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock all modules before importing the component
const mockDispatch = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
const mockUseKeyboardShortcut = jest.fn();
const mockI18nTranslate = jest.fn();
const defaultCurrentQuery = { query: 'test query', language: 'PPL' };
const mockGetQuery = jest.fn(() => defaultCurrentQuery);

// Mock i18n
jest.doMock('@osd/i18n', () => ({
  i18n: {
    translate: mockI18nTranslate.mockImplementation(
      (key, options) => options?.defaultMessage || key
    ),
  },
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
            getQuery: mockGetQuery,
            setQuery: jest.fn(),
            getQueryHistory: jest.fn(() => [
              { query: 'SELECT * FROM logs', language: 'SQL' },
              { query: 'source = table | head 10', language: 'PPL' },
            ]),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
          },
        },
      },
      http: { fetch: jest.fn() },
      keyboardShortcut: {
        useKeyboardShortcut: mockUseKeyboardShortcut,
        register: jest.fn(),
        unregister: jest.fn(),
        getAllShortcuts: jest.fn(),
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
  runPPLAnalyzeInBackground: jest.fn(),
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
      <button
        data-test-subj="mock-query-item-other-dataset"
        onClick={() =>
          onClickRecentQuery({
            query: '| where status >= 500',
            language: 'PPL',
            dataset: {
              id: 'dataset-a',
              title: 'orders-*',
              type: 'INDEX_PATTERN',
              timeFieldName: 'created_at',
            },
          })
        }
      >
        Mock PPL Query From Another Dataset
      </button>
    </div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RecentQueriesButton } = require('./recent_queries_button');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runPPLAnalyzeInBackground: mockRunPPLAnalyze } = require('../../../../../../data/public');

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
    mockGetQuery.mockImplementation(() => defaultCurrentQuery);
  });

  it('renders the recent queries button with correct text and icon', () => {
    renderWithStore();

    const button = screen.getByTestId('exploreRecentQueriesButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Recent queries');
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

  it('analyzes a recent query against the current dataset, not the one it was recorded on', () => {
    // Run executes the loaded text against the current dataset, so analyze has to use it too.
    // The history entry here was recorded on `orders-*`; the user is now on `logs-*`.
    mockGetQuery.mockImplementation(() => ({
      query: 'source = `logs-*` | head 10',
      language: 'PPL',
      dataset: {
        id: 'dataset-b',
        title: 'logs-*',
        type: 'INDEX_PATTERN',
        timeFieldName: 'timestamp',
      },
    }));
    renderWithStore();

    fireEvent.click(screen.getByTestId('exploreRecentQueriesButton'));
    fireEvent.click(screen.getByTestId('mock-query-item-other-dataset'));

    expect(mockRunPPLAnalyze).toHaveBeenCalledTimes(1);
    const { query, onlyIfOpen } = mockRunPPLAnalyze.mock.calls[0][0];
    expect(onlyIfOpen).toBe(true);
    expect(query.dataset).toEqual(expect.objectContaining({ id: 'dataset-b', title: 'logs-*' }));
    expect(query.query).toBe('source = `logs-*` | where status >= 500');
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('registers keyboard shortcut correctly', () => {
      renderWithStore();

      expect(mockUseKeyboardShortcut).toHaveBeenCalledTimes(1);
      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'recent_queries',
        pluginId: 'explore',
        name: expect.any(String),
        category: expect.any(String),
        keys: 'shift+q',
        execute: expect.any(Function),
      });
    });

    it('keyboard shortcut toggles popover when executed', async () => {
      renderWithStore();

      const shortcutCall = mockUseKeyboardShortcut.mock.calls.find(
        (call) => call[0].id === 'recent_queries'
      );
      expect(shortcutCall).toBeDefined();

      const executeFunction = shortcutCall[0].execute;

      expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'block' });
      });

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'none' });
      });
    });

    it('keyboard shortcut execute function is the same as button click handler', async () => {
      renderWithStore();

      const button = screen.getByTestId('exploreRecentQueriesButton');
      const shortcutCall = mockUseKeyboardShortcut.mock.calls[0];
      const executeFunction = shortcutCall[0].execute;

      expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();

      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'block' });
      });

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'none' });
      });

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'block' });
      });
    });

    it('keyboard shortcut works independently of button clicks', async () => {
      renderWithStore();

      const shortcutCall = mockUseKeyboardShortcut.mock.calls[0];
      const executeFunction = shortcutCall[0].execute;

      expect(screen.queryByTestId('recent-queries-table')).not.toBeInTheDocument();

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'block' });
      });

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'none' });
      });

      act(() => {
        executeFunction();
      });
      await waitFor(() => {
        expect(screen.getByTestId('recent-queries-table')).toHaveStyle({ display: 'block' });
      });
    });
  });
});
