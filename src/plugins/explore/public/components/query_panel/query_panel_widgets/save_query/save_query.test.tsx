/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { EditorMode } from '../../../../application/utils/state_management/types';

// Mock all modules before importing the component
const mockDispatch = jest.fn();
const mockTimeFilter = {
  getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
  setTime: jest.fn(),
  getRefreshInterval: jest.fn(() => ({ pause: false, value: 10000 })),
  setRefreshInterval: jest.fn(),
};
const mockSavedQueryService = {
  saveQuery: jest.fn(),
  getSavedQuery: jest.fn(),
};
const mockQueryStringManager = {
  getQuery: jest.fn(() => ({ query: 'fallback_query_text', language: 'PROMQL' })),
};
const mockSetEditorTextWithQuery = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockHandleTimeChange = jest.fn();
const mockRunPPLAnalyzeInBackground = jest.fn();
const mockUseKeyboardShortcut = jest.fn();

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
          savedQueries: mockSavedQueryService,
          queryString: mockQueryStringManager,
          timefilter: { timefilter: mockTimeFilter },
        },
      },
      http: { fetch: jest.fn() },
      keyboardShortcut: {
        useKeyboardShortcut: mockUseKeyboardShortcut,
      },
      notifications: {
        toasts: {
          addSuccess: jest.fn(),
          addDanger: jest.fn(),
        },
      },
      capabilities: {
        explore: {
          saveQuery: true,
        },
      },
    },
  }),
}));

jest.doMock('../../utils', () => ({
  useTimeFilter: () => ({
    timeFilter: mockTimeFilter,
    handleTimeChange: mockHandleTimeChange,
  }),
}));

const mockGetEditorText = jest.fn(() => 'SELECT * FROM logs');

jest.doMock('../../../../application/hooks', () => ({
  useSetEditorTextWithQuery: () => mockSetEditorTextWithQuery,
  useEditorText: () => mockGetEditorText,
}));

jest.doMock('../../../../application/utils/state_management/actions/query_editor', () => ({
  loadQueryActionCreator: mockLoadQueryActionCreator,
}));

// Mock the selectors - make them mutable for testing different modes
const mockSelectIsPromptEditorMode = jest.fn(() => false);
const mockSelectQuery = jest.fn(() => ({
  query: 'SELECT * FROM logs',
  language: 'SQL',
  dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
}));

jest.doMock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: mockSelectIsPromptEditorMode,
  selectQuery: mockSelectQuery,
}));

jest.doMock('../../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'query/executeQueries/pending' })),
}));

jest.doMock('../../../../application/utils/state_management/slices', () => ({
  clearResults: jest.fn(() => ({ type: 'results/clearResults' })),
  setSavedQuery: jest.fn(() => ({ type: 'legacy/setSavedQuery' })),
  setQueryState: jest.fn(() => ({ type: 'query/setQueryState' })),
  setDateRange: jest.fn(() => ({ type: 'query/setDateRange' })),
}));

// Mock SavedQueryManagementComponent
jest.doMock('../../../../../../data/public', () => {
  const MockSavedQueryManagementComponent = (props: any) => {
    const {
      onLoad,
      onClearSavedQuery,
      onRecentQueriesClick,
      saveQuery,
      loadedSavedQuery,
      saveQueryIsDisabled,
    } = props;
    return (
      <div data-test-subj="saved-query-management">
        <button
          data-test-subj="mock-save-button"
          onClick={() =>
            saveQuery(
              {
                title: 'Test Query',
                description: 'Test Description',
                shouldIncludeTimeFilter: true,
              },
              false
            )
          }
          disabled={saveQueryIsDisabled}
        >
          Save Query
        </button>
        <button
          data-test-subj="mock-save-as-new-button"
          onClick={() =>
            saveQuery(
              {
                title: 'Test Query New',
                description: 'Test Description New',
                shouldIncludeTimeFilter: true,
              },
              true
            )
          }
          disabled={saveQueryIsDisabled}
        >
          Save As New Query
        </button>
        <button
          data-test-subj="mock-load-button"
          onClick={() =>
            onLoad({
              id: 'test-query-id',
              attributes: {
                query: { query: 'SELECT * FROM test', language: 'SQL' },
                timefilter: {
                  from: 'now-1h',
                  to: 'now',
                  refreshInterval: { pause: false, value: 5000 },
                },
              },
            })
          }
        >
          Load Query
        </button>
        <button data-test-subj="mock-clear-button" onClick={onClearSavedQuery}>
          Clear Query
        </button>
        {/* Stands in for the third "Recent queries" option of the popover's option list. */}
        {onRecentQueriesClick && (
          <button data-test-subj="mock-recent-queries-option" onClick={onRecentQueriesClick}>
            Recent Queries
          </button>
        )}
        {loadedSavedQuery && (
          <div data-test-subj="loaded-query-info">
            Loaded: {loadedSavedQuery.attributes?.query?.query}
          </div>
        )}
        {saveQueryIsDisabled && <div data-test-subj="save-disabled-indicator">Save Disabled</div>}
      </div>
    );
  };

  // Stands in for the real recent-queries table: one button per scenario the popover has to apply.
  const MockRecentQueriesTable = ({ onClickRecentQuery }: any) => (
    <div data-test-subj="mock-recent-queries-table">
      <button
        data-test-subj="mock-run-recent-button"
        onClick={() =>
          onClickRecentQuery(
            { query: 'SELECT * FROM test', language: 'SQL' },
            { from: 'now-1d', to: 'now' }
          )
        }
      >
        Run Recent Query
      </button>
      <button
        data-test-subj="mock-run-recent-no-time-button"
        onClick={() => onClickRecentQuery({ query: 'SELECT * FROM test2', language: 'SQL' })}
      >
        Run Recent Query Without Time Range
      </button>
      <button
        data-test-subj="mock-run-recent-object-button"
        onClick={() => onClickRecentQuery({ query: { match_all: {} }, language: 'DQL' })}
      >
        Run Recent Object Query
      </button>
    </div>
  );

  return {
    SavedQueryManagementComponent: MockSavedQueryManagementComponent,
    RecentQueriesTable: MockRecentQueriesTable,
    runPPLAnalyzeInBackground: mockRunPPLAnalyzeInBackground,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SaveQueryButton } = require('./save_query');

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      query: (state = {}) => state,
      legacy: (state = {}) => ({ savedQuery: undefined, ...state }),
      queryEditor: (state = {}) => state,
    },
    preloadedState: {
      query: {
        query: 'SELECT * FROM logs',
        language: 'SQL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      },
      legacy: {
        savedQuery: undefined,
      },
      queryEditor: {
        editorMode: EditorMode.Query,
      },
      ...initialState,
    },
  });
};

const renderWithStore = (initialState = {}) => {
  const mockStore = createMockStore(initialState);
  return render(
    <Provider store={mockStore}>
      <SaveQueryButton />
    </Provider>
  );
};

describe('SaveQueryButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectIsPromptEditorMode.mockReturnValue(false);
    mockGetEditorText.mockReturnValue('SELECT * FROM logs');
    mockQueryStringManager.getQuery.mockReturnValue({
      query: 'fallback_query_text',
      language: 'PROMQL',
    });
    mockSavedQueryService.saveQuery.mockResolvedValue({ id: 'saved-query-id' });
    mockSavedQueryService.getSavedQuery.mockResolvedValue({
      id: 'test-query-id',
      attributes: {
        query: { query: 'SELECT * FROM test', language: 'SQL' },
        timefilter: { from: 'now-1h', to: 'now', refreshInterval: { pause: false, value: 5000 } },
      },
    });
  });

  it('renders the save query button with correct text and icon', () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Saved queries');
  });

  it('toggles popover visibility when button is clicked', () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');

    // Initially no management component visible
    expect(screen.queryByTestId('saved-query-management')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(button);
    expect(screen.getByTestId('saved-query-management')).toBeInTheDocument();
  });

  it('calls saveQuery with correct parameters when save is triggered', async () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button); // Show the popover

    const saveButton = screen.getByTestId('mock-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Query',
          description: 'Test Description',
          query: expect.objectContaining({
            query: 'SELECT * FROM logs',
            language: 'SQL',
          }),
          timefilter: expect.objectContaining({
            from: 'now-15m',
            to: 'now',
            refreshInterval: { pause: false, value: 10000 },
          }),
        }),
        { overwrite: false }
      );
    });
  });

  it('handles save query without time filter when shouldIncludeTimeFilter is false', async () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    // Mock a save without time filter
    const managementComponent = screen.getByTestId('saved-query-management');
    const saveButton = managementComponent.querySelector('[data-test-subj="mock-save-button"]');

    // Simulate clicking save without time filter
    fireEvent.click(saveButton!);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalled();
    });
  });

  it('loads saved query and updates state when load is triggered', async () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const loadButton = screen.getByTestId('mock-load-button');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'legacy/setSavedQuery' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/setQueryState' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/setDateRange' });
      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            query: expect.objectContaining({
              savedQueries: mockSavedQueryService,
            }),
          }),
          notifications: expect.objectContaining({
            toasts: expect.objectContaining({
              addSuccess: expect.any(Function),
              addDanger: expect.any(Function),
            }),
          }),
        }),
        mockSetEditorTextWithQuery,
        'SELECT * FROM test'
      );
      expect(mockTimeFilter.setRefreshInterval).toHaveBeenCalledWith({
        pause: false,
        value: 5000,
      });
    });
  });

  it('clears saved query when clear is triggered', async () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const clearButton = screen.getByTestId('mock-clear-button');
    fireEvent.click(clearButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'legacy/setSavedQuery' });
  });

  it('loads current saved query when savedQueryId exists in state', async () => {
    renderWithStore({
      legacy: {
        savedQuery: 'existing-query-id',
      },
    });

    await waitFor(() => {
      expect(mockSavedQueryService.getSavedQuery).toHaveBeenCalledWith('existing-query-id');
    });
  });

  it('handles error when saved query does not exist', async () => {
    mockSavedQueryService.getSavedQuery.mockRejectedValue(new Error('Query not found'));

    renderWithStore({
      legacy: {
        savedQuery: 'non-existent-query-id',
      },
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'legacy/setSavedQuery' });
    });
  });

  it('displays loaded saved query information when currentSavedQuery exists', async () => {
    mockSavedQueryService.getSavedQuery.mockResolvedValue({
      id: 'test-query-id',
      attributes: {
        query: { query: 'SELECT * FROM test_table', language: 'SQL' },
        timefilter: { from: 'now-1h', to: 'now', refreshInterval: { pause: false, value: 5000 } },
      },
    });

    renderWithStore({
      legacy: {
        savedQuery: 'test-query-id',
      },
    });

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('loaded-query-info')).toBeInTheDocument();
      expect(screen.getByTestId('loaded-query-info')).toHaveTextContent(
        'Loaded: SELECT * FROM test_table'
      );
    });
  });

  it('calls saveQuery service when save is triggered', async () => {
    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const saveButton = screen.getByTestId('mock-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalled();
    });
  });

  it('calls saveQuery with overwrite:true when updating existing saved query', async () => {
    renderWithStore({
      legacy: {
        savedQuery: 'existing-query-id',
      },
    });

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const saveButton = screen.getByTestId('mock-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Query',
          description: 'Test Description',
          query: expect.objectContaining({
            query: 'SELECT * FROM logs',
            language: 'SQL',
          }),
        }),
        { overwrite: true }
      );
    });
  });

  it('calls saveQuery with overwrite:false when saving as new query', async () => {
    renderWithStore({
      legacy: {
        savedQuery: 'existing-query-id',
      },
    });

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const saveAsNewButton = screen.getByTestId('mock-save-as-new-button');
    fireEvent.click(saveAsNewButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Query New',
          description: 'Test Description New',
          query: expect.objectContaining({
            query: 'SELECT * FROM logs',
            language: 'SQL',
          }),
        }),
        { overwrite: false }
      );
    });
  });

  it('handles timeFilter methods safely when they do not exist', async () => {
    const mockTimeFilterWithoutMethods = {
      getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
      // Missing getRefreshInterval and setRefreshInterval
    };

    jest.doMock('../../utils', () => ({
      useTimeFilter: () => ({
        timeFilter: mockTimeFilterWithoutMethods,
      }),
    }));

    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const saveButton = screen.getByTestId('mock-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalled();
    });
  });

  describe('saveQueryIsDisabled', () => {
    it('enables save query when not in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(false);
      renderWithStore();

      const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
      fireEvent.click(button);

      const saveButton = screen.getByTestId('mock-save-button');
      expect(saveButton).not.toBeDisabled();
      expect(screen.queryByTestId('save-disabled-indicator')).not.toBeInTheDocument();
    });

    it('disables save query when in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      renderWithStore();

      const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
      fireEvent.click(button);

      const saveButton = screen.getByTestId('mock-save-button');
      expect(saveButton).toBeDisabled();
      expect(screen.getByTestId('save-disabled-indicator')).toBeInTheDocument();
    });
  });

  it('falls back to queryString.getQuery() when editor text is empty', async () => {
    mockGetEditorText.mockReturnValue('');
    mockQueryStringManager.getQuery.mockReturnValue({ query: 'up{job="api"}', language: 'PROMQL' });

    renderWithStore();

    const button = screen.getByTestId('queryPanelFooterSaveQueryButton');
    fireEvent.click(button);

    const saveButton = screen.getByTestId('mock-save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSavedQueryService.saveQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            query: 'up{job="api"}',
          }),
        }),
        expect.anything()
      );
    });
  });

  // Migrated from the retired RecentQueriesButton: recent queries are now a second view of this
  // popover, reached from its "Recent queries" option, so `handleRunRecentQuery` lives here.
  describe('running a recent query', () => {
    const openRecentQueries = () => {
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-recent-queries-option'));
    };

    const runRecent = (testSubj = 'mock-run-recent-button') => {
      openRecentQueries();
      fireEvent.click(screen.getByTestId(testSubj));
    };

    it('offers a Recent queries option in the popover', () => {
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));

      expect(screen.getByTestId('mock-recent-queries-option')).toBeInTheDocument();
    });

    // The option swaps the popover's content rather than opening anything alongside it.
    it('replaces the option list with the recent queries table', () => {
      openRecentQueries();

      expect(screen.getByTestId('mock-recent-queries-table')).toBeInTheDocument();
      expect(screen.queryByTestId('saved-query-management')).not.toBeInTheDocument();
    });

    it('returns to the option list from the back button', () => {
      openRecentQueries();

      fireEvent.click(screen.getByTestId('exploreSaveQueryRecentQueriesBackButton'));

      expect(screen.getByTestId('saved-query-management')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-recent-queries-table')).not.toBeInTheDocument();
    });

    // Landing back on the table you last looked at would hide the Save/Open options behind a back
    // button, so reopening always starts from the option list.
    it('reopens on the option list after the recent queries view was left open', async () => {
      openRecentQueries();

      // Close, then reopen from the trigger.
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      await waitFor(() =>
        expect(screen.queryByTestId('mock-recent-queries-table')).not.toBeInTheDocument()
      );
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));

      expect(screen.getByTestId('saved-query-management')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-recent-queries-table')).not.toBeInTheDocument();
    });

    it('loads the selected query into the editor', () => {
      runRecent();

      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            query: expect.objectContaining({ savedQueries: mockSavedQueryService }),
          }),
        }),
        mockSetEditorTextWithQuery,
        'SELECT * FROM test'
      );
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('applies the time range when the recent query carries one', () => {
      runRecent();

      expect(mockHandleTimeChange).toHaveBeenCalledWith({
        start: 'now-1d',
        end: 'now',
        isInvalid: false,
        isQuickSelection: true,
      });
    });

    it('leaves the time range alone when the recent query has none', () => {
      runRecent('mock-run-recent-no-time-button');

      expect(mockHandleTimeChange).not.toHaveBeenCalled();
      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        expect.any(Object),
        mockSetEditorTextWithQuery,
        'SELECT * FROM test2'
      );
    });

    it('loads an empty string for a non-string query body', () => {
      runRecent('mock-run-recent-object-button');

      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        expect.any(Object),
        mockSetEditorTextWithQuery,
        ''
      );
    });

    it('refreshes the analyze panel only when it is already open', () => {
      runRecent();

      expect(mockRunPPLAnalyzeInBackground).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { query: 'SELECT * FROM test', language: 'SQL' },
          onlyIfOpen: true,
        })
      );
    });

    // `waitFor` because EuiPopover keeps its panel mounted for the duration of the close animation.
    it('closes the popover', async () => {
      runRecent();

      // The view resets to the option list synchronously, so the panel itself is what has to go.
      await waitFor(() =>
        expect(screen.queryByTestId('saved-query-management')).not.toBeInTheDocument()
      );
      expect(screen.queryByTestId('mock-recent-queries-table')).not.toBeInTheDocument();
    });
  });

  describe('keyboard shortcut', () => {
    it('registers shift+q against the saved queries popover', () => {
      renderWithStore();

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'saved_queries',
        pluginId: 'explore',
        name: expect.any(String),
        category: expect.any(String),
        keys: 'shift+q',
        execute: expect.any(Function),
      });
    });

    it('toggles the popover when executed', async () => {
      renderWithStore();
      const { execute } = mockUseKeyboardShortcut.mock.calls[0][0];

      expect(screen.queryByTestId('saved-query-management')).not.toBeInTheDocument();

      act(() => execute());
      await waitFor(() => expect(screen.getByTestId('saved-query-management')).toBeInTheDocument());

      act(() => execute());
      await waitFor(() =>
        expect(screen.queryByTestId('saved-query-management')).not.toBeInTheDocument()
      );
    });
  });
});
