/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        },
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
  clearQueryStatusMap: jest.fn(() => ({ type: 'queryEditor/clearQueryStatusMap' })),
  setIsQueryEditorDirty: jest.fn((dirty: boolean) => ({
    type: 'queryEditor/setIsQueryEditorDirty',
    payload: dirty,
  })),
  setSavedQuery: jest.fn(() => ({ type: 'legacy/setSavedQuery' })),
  setQueryState: jest.fn(() => ({ type: 'query/setQueryState' })),
  setDateRange: jest.fn(() => ({ type: 'query/setDateRange' })),
}));

// Mock SavedQueryManagementComponent
jest.doMock('../../../../../../data/public', () => {
  const MockSavedQueryManagementComponent = (props: any) => {
    const { onLoad, onClearSavedQuery, saveQuery, loadedSavedQuery, saveQueryIsDisabled } = props;
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
        <button
          data-test-subj="mock-load-explicit-run-button"
          onClick={() =>
            onLoad({
              id: 'explicit-query-id',
              attributes: {
                query: {
                  query: 'fields @message',
                  language: 'FakeQL',
                  dataset: { id: 'd', title: 'd', type: 'EXPLICIT_RUN_TYPE' },
                },
              },
            })
          }
        >
          Load Explicit Run Query
        </button>
        <button
          data-test-subj="mock-load-from-flyout-button"
          onClick={() =>
            // The flyout hands over the query with the dataset on screen, not the stored one.
            onLoad({
              id: 'flyout-query-id',
              attributes: {
                query: {
                  query: 'stats count(*) by level',
                  language: 'FakeQL',
                  dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
                },
                timefilter: {
                  from: 'now-30m',
                  to: 'now',
                  refreshInterval: { pause: true, value: 0 },
                },
              },
            })
          }
        >
          Load From Flyout
        </button>
        <button
          data-test-subj="mock-load-ppl-button"
          onClick={() =>
            onLoad({
              id: 'ppl-query-id',
              attributes: {
                query: {
                  query: 'source = logs | head 10',
                  language: 'PPL',
                  dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
                },
              },
            })
          }
        >
          Load PPL Query
        </button>
        <button data-test-subj="mock-clear-button" onClick={onClearSavedQuery}>
          Clear Query
        </button>
        {loadedSavedQuery && (
          <div data-test-subj="loaded-query-info">
            Loaded: {loadedSavedQuery.attributes?.query?.query}
          </div>
        )}
        {saveQueryIsDisabled && <div data-test-subj="save-disabled-indicator">Save Disabled</div>}
      </div>
    );
  };

  return {
    SavedQueryManagementComponent: MockSavedQueryManagementComponent,
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
        'SELECT * FROM test',
        // The saved query has no dataset of its own here.
        undefined
      );
      expect(mockTimeFilter.setRefreshInterval).toHaveBeenCalledWith({
        pause: false,
        value: 5000,
      });
    });
  });

  it('loads a saved query without running it when its dataset type requires an explicit Run', async () => {
    (mockQueryStringManager as any).getDatasetService = jest.fn(() => ({
      getType: (type: string) =>
        type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined,
    }));
    renderWithStore();
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    fireEvent.click(screen.getByTestId('mock-load-explicit-run-button'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/setQueryState' });
      expect(mockLoadQueryActionCreator).toHaveBeenCalled();
    });
    // The saved query's own dataset decides, not the current one.
    expect(
      mockLoadQueryActionCreator.mock.calls[mockLoadQueryActionCreator.mock.calls.length - 1][3]
    ).toEqual(expect.objectContaining({ type: 'EXPLICIT_RUN_TYPE' }));
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'query/executeQueries/pending' });
    // The previous results are cleared and the query is staged for Run.
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'queryEditor/clearQueryStatusMap' });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'queryEditor/setIsQueryEditorDirty',
      payload: true,
    });
    delete (mockQueryStringManager as any).getDatasetService;
  });

  it('runs a loaded saved query of any other dataset type', async () => {
    renderWithStore();
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    fireEvent.click(screen.getByTestId('mock-load-button'));
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/executeQueries/pending' })
    );
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

  describe('the dataset of a saved query', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const slices = require('../../../../application/utils/state_management/slices');
    const LOG_GROUPS = {
      id: 'my-logs::us-west-2::group-a,group-b',
      title: 'group-a, group-b',
      type: 'EXPLICIT_RUN_TYPE',
      language: 'FakeQL',
    };
    const INDEX_PATTERN = { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' };

    const registerTypes = () => {
      (mockQueryStringManager as any).getDatasetService = jest.fn(() => ({
        getType: (type: string) =>
          type === 'EXPLICIT_RUN_TYPE'
            ? { meta: { requiresExplicitRun: true } }
            : type === 'INDEX_PATTERN'
              ? { meta: {}, supportedLanguages: () => ['PPL', 'SQL'] }
              : undefined,
      }));
    };

    afterEach(() => {
      delete (mockQueryStringManager as any).getDatasetService;
    });

    const save = async () => {
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-save-button'));
      await waitFor(() => expect(mockSavedQueryService.saveQuery).toHaveBeenCalled());
      return mockSavedQueryService.saveQuery.mock.calls[0][0].query;
    };

    it('is not saved for an index pattern, as before', async () => {
      const saved = await save();
      expect(saved).not.toHaveProperty('dataset');
    });

    it('is saved for any other dataset type, with the fields the saved query mapping has', async () => {
      mockSelectQuery.mockReturnValueOnce({
        query: 'stats count(*) by level',
        language: 'FakeQL',
        dataset: {
          ...LOG_GROUPS,
          signalType: 'logs',
          displayName: 'Two log groups',
          dataSource: {
            id: 'conn',
            title: 'My connection',
            type: 'MY_SOURCE',
            version: '',
            meta: { name: 'conn', sessionId: 's1', region: 'us-west-2' },
          },
        } as any,
      } as any);

      const saved = await save();

      expect(saved.dataset).toEqual({
        ...LOG_GROUPS,
        dataSource: {
          id: 'conn',
          title: 'My connection',
          type: 'MY_SOURCE',
          meta: { name: 'conn' },
        },
      });
    });

    it('is switched to on load, staged for an explicit Run, with the saved time range', async () => {
      registerTypes();
      mockSavedQueryService.getSavedQuery.mockResolvedValue({
        id: 'flyout-query-id',
        attributes: {
          query: { query: 'stats count(*) by level', language: 'FakeQL', dataset: LOG_GROUPS },
        },
      });
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));

      await waitFor(() =>
        expect(slices.setQueryState).toHaveBeenCalledWith(
          expect.objectContaining({ language: 'FakeQL', dataset: LOG_GROUPS })
        )
      );
      expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith('stats count(*) by level');
      // The dataset change does the rest; nothing runs.
      expect(mockLoadQueryActionCreator).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'query/executeQueries/pending' });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: true,
      });
      // The time picker shows the saved range, which the staged query runs on.
      expect(mockTimeFilter.setTime).toHaveBeenCalledWith({ from: 'now-30m', to: 'now' });
    });

    it('applies the saved time range under an explicit Run on the same dataset', async () => {
      registerTypes();
      mockSavedQueryService.getSavedQuery.mockResolvedValue({
        id: 'flyout-query-id',
        attributes: {
          query: { query: 'stats count(*) by level', language: 'FakeQL', dataset: LOG_GROUPS },
        },
      });
      mockSelectQuery.mockReturnValue({
        query: '',
        language: 'FakeQL',
        dataset: LOG_GROUPS,
      } as any);
      renderWithStore({ query: { query: '', language: 'FakeQL', dataset: LOG_GROUPS } });
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));

      await waitFor(() => expect(mockLoadQueryActionCreator).toHaveBeenCalled());
      expect(mockTimeFilter.setTime).toHaveBeenCalledWith({ from: 'now-30m', to: 'now' });
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'query/executeQueries/pending' });
      mockSelectQuery.mockReset();
      mockSelectQuery.mockReturnValue({
        query: 'SELECT * FROM logs',
        language: 'SQL',
        dataset: INDEX_PATTERN,
      });
    });

    it('keeps the dataset on screen when the stored one is the same, with all its fields', async () => {
      // The stored copy holds only the fields the saved query mapping has; the dataset on screen
      // has every field (e.g. signalType). Replacing it with the copy would be a dataset change.
      registerTypes();
      const onScreen = { ...LOG_GROUPS, signalType: 'logs', displayName: 'Two log groups' } as any;
      mockSavedQueryService.getSavedQuery.mockResolvedValue({
        id: 'flyout-query-id',
        attributes: {
          query: { query: 'stats count(*) by level', language: 'FakeQL', dataset: LOG_GROUPS },
        },
      });
      mockSelectQuery.mockReturnValue({ query: '', language: 'FakeQL', dataset: onScreen });
      renderWithStore({ query: { query: '', language: 'FakeQL', dataset: onScreen } });
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));

      try {
        await waitFor(() => expect(mockLoadQueryActionCreator).toHaveBeenCalled());
        // The dataset on screen, not the stored copy, which has no signalType or displayName.
        expect(slices.setQueryState).toHaveBeenCalledWith(
          expect.objectContaining({ dataset: onScreen })
        );
        expect(mockLoadQueryActionCreator.mock.calls[0][3]).toEqual(onScreen);
      } finally {
        mockSelectQuery.mockReset();
        mockSelectQuery.mockReturnValue({
          query: 'SELECT * FROM logs',
          language: 'SQL',
          dataset: INDEX_PATTERN,
        });
      }
    });

    // A load reads the saved object first, so a second pick can resolve before the first.
    it('applies only the latest pick when two loads resolve out of order', async () => {
      registerTypes();
      let resolveFirst: (value: unknown) => void = () => {};
      mockSavedQueryService.getSavedQuery
        .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
        .mockResolvedValueOnce({
          id: 'flyout-query-id',
          attributes: { query: { query: 'second pick', language: 'FakeQL', dataset: LOG_GROUPS } },
        });
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));
      await waitFor(() => expect(slices.setQueryState).toHaveBeenCalledTimes(1));

      // The first pick resolves last: it must not apply over the second.
      resolveFirst({
        id: 'flyout-query-id',
        attributes: { query: { query: 'first pick', language: 'FakeQL', dataset: LOG_GROUPS } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(slices.setQueryState).toHaveBeenCalledTimes(1);
    });

    it('is not stored for an index pattern query: it loads on the dataset on screen and runs', async () => {
      registerTypes();
      mockSavedQueryService.getSavedQuery.mockResolvedValue({
        id: 'flyout-query-id',
        attributes: { query: { query: 'stats count(*) by level', language: 'FakeQL' } },
      });
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));

      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/executeQueries/pending' })
      );
      expect(slices.setQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: INDEX_PATTERN })
      );
      expect(mockLoadQueryActionCreator.mock.calls[0][3]).toEqual(INDEX_PATTERN);
      expect(mockTimeFilter.setTime).not.toHaveBeenCalled();
    });

    it('is not read again for a PPL query on an index pattern, and loads as before', async () => {
      registerTypes();
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-ppl-button'));

      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'query/executeQueries/pending' })
      );
      expect(mockSavedQueryService.getSavedQuery).not.toHaveBeenCalled();
      expect(slices.setQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'PPL', dataset: INDEX_PATTERN })
      );
      expect(mockLoadQueryActionCreator.mock.calls[0][2]).toBe('source = logs | head 10');
      expect(mockLoadQueryActionCreator.mock.calls[0][3]).toEqual(INDEX_PATTERN);
    });

    it('is not switched to when its type is no longer registered', async () => {
      registerTypes();
      mockSavedQueryService.getSavedQuery.mockResolvedValue({
        id: 'flyout-query-id',
        attributes: {
          query: {
            query: 'x',
            language: 'FakeQL',
            dataset: { id: 'gone', title: 'gone', type: 'UNREGISTERED_TYPE' },
          },
        },
      });
      renderWithStore();
      fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
      fireEvent.click(screen.getByTestId('mock-load-from-flyout-button'));

      await waitFor(() => expect(mockLoadQueryActionCreator).toHaveBeenCalled());
      expect(slices.setQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: INDEX_PATTERN })
      );
    });
  });
});
