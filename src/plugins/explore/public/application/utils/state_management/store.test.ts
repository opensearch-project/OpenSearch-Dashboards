/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configurePreloadedStore, getPreloadedStore, RootState } from './store';
import { ExploreServices } from '../../../types';
import { loadReduxState } from './utils/redux_persistence';
import { normalizeStateForComparison } from './utils/state_comparison';
import { setPromptModeIsAvailable, setSummaryAgentIsAvailable } from './slices';
import { getPromptModeIsAvailable } from '../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../get_summary_agent_is_available';

// Mock dependencies
jest.mock('./utils/redux_persistence', () => ({
  loadReduxState: jest.fn(),
}));

jest.mock('./utils/state_comparison', () => ({
  normalizeStateForComparison: jest.fn((state) => ({
    query: state.query,
    ui: state.ui,
    tab: state.tab,
    legacy: state.legacy,
  })),
}));

jest.mock('./middleware/persistence_middleware', () => ({
  createPersistenceMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

jest.mock('./middleware/dataset_change_middleware', () => ({
  createDatasetChangeMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

jest.mock('./middleware/query_sync_middleware', () => ({
  createQuerySyncMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

jest.mock('./middleware/timefilter_sync_middleware', () => ({
  createTimefilterSyncMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

jest.mock('./middleware/overall_status_middleware', () => ({
  createOverallStatusMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

jest.mock('../get_prompt_mode_is_available', () => ({
  getPromptModeIsAvailable: jest.fn(() => new Promise(() => {})),
}));

jest.mock('../get_summary_agent_is_available', () => ({
  getSummaryAgentIsAvailable: jest.fn(() => new Promise(() => {})),
}));

// Import the mocked functions to verify they're called
import { createPersistenceMiddleware } from './middleware/persistence_middleware';
import { createQuerySyncMiddleware } from './middleware/query_sync_middleware';
import { createTimefilterSyncMiddleware } from './middleware/timefilter_sync_middleware';
import { createOverallStatusMiddleware } from './middleware/overall_status_middleware';

describe('store', () => {
  let mockServices: jest.Mocked<ExploreServices>;
  let mockPreloadedState: RootState;
  let mockHistoryListen: jest.Mock;
  let mockOsdUrlStateStorageGet: jest.Mock;
  let mockOsdUrlStateStorageSet: jest.Mock;

  beforeEach(() => {
    mockHistoryListen = jest.fn();
    mockOsdUrlStateStorageGet = jest.fn();
    mockOsdUrlStateStorageSet = jest.fn();

    mockServices = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn(),
          },
        },
      },
      scopedHistory: {
        listen: mockHistoryListen,
      },
      osdUrlStateStorage: {
        get: mockOsdUrlStateStorageGet,
        set: mockOsdUrlStateStorageSet,
      },
    } as any;

    mockPreloadedState = {
      query: {
        query: '',
        language: 'PPL',
        dataset: undefined,
      },
      ui: {
        activeTabId: '',
        showHistogram: true,
      },
      results: {},
      tab: {
        logs: {},
        visualizations: {
          styleOptions: {},
          chartType: undefined,
          axesMapping: {},
        },
      },
      legacy: {
        savedSearch: undefined,
        columns: ['_source'],
        sort: [],
        isDirty: false,
        savedQuery: undefined,
        lineCount: undefined,
        interval: 'auto',
      },
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED',
          elapsedMs: undefined,
          startTime: undefined,
          error: undefined,
        },
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        editorMode: 'single-query',
        lastExecutedTranslatedQuery: '',
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
      },
      meta: {
        isInitialized: false,
      },
    } as any;

    jest.clearAllMocks();
  });

  describe('configurePreloadedStore', () => {
    it('should create store with preloaded state and no services', () => {
      const store = configurePreloadedStore(mockPreloadedState);

      expect(store).toBeDefined();
      expect(store.getState()).toEqual(mockPreloadedState);
    });

    it('should create store with preloaded state and services', () => {
      const store = configurePreloadedStore(mockPreloadedState, mockServices);

      expect(store).toBeDefined();
      expect(store.getState()).toEqual(mockPreloadedState);
    });

    it('should handle reset state action', () => {
      const store = configurePreloadedStore(mockPreloadedState);

      const newState = {
        ...mockPreloadedState,
        query: {
          ...mockPreloadedState.query,
          query: 'SELECT * FROM test',
        },
      };

      // Dispatch reset action
      store.dispatch({ type: 'app/resetState', payload: newState });

      expect(store.getState()).toEqual(newState);
    });

    it('should handle regular actions through base reducer', () => {
      const store = configurePreloadedStore(mockPreloadedState);

      // Dispatch a regular action that exists in the query slice
      store.dispatch({
        type: 'query/setQueryWithHistory',
        payload: { query: 'SELECT * FROM test', language: 'SQL' },
      });

      // State should be processed by base reducer
      expect(store.getState().query.query).toBe('SELECT * FROM test');
    });

    it('should register all middleware when services are provided', () => {
      const store = configurePreloadedStore(mockPreloadedState, mockServices);

      expect(store).toBeDefined();
      expect(createPersistenceMiddleware).toHaveBeenCalledWith(mockServices);
      expect(createQuerySyncMiddleware).toHaveBeenCalledWith(mockServices);
      expect(createTimefilterSyncMiddleware).toHaveBeenCalledWith(mockServices);
      expect(createOverallStatusMiddleware).toHaveBeenCalled();
    });

    it('should not register custom middleware when services are not provided', () => {
      jest.clearAllMocks();

      const store = configurePreloadedStore(mockPreloadedState);

      expect(store).toBeDefined();
      expect(createPersistenceMiddleware).not.toHaveBeenCalled();
      expect(createQuerySyncMiddleware).not.toHaveBeenCalled();
      expect(createTimefilterSyncMiddleware).not.toHaveBeenCalled();
      expect(createOverallStatusMiddleware).not.toHaveBeenCalled();
    });
  });

  describe('AI availability', () => {
    const dataset = { id: 'logs', title: 'logs-*', type: 'INDEX_PATTERN' };
    const withDataset = (query = '') => ({
      ...mockPreloadedState,
      query: { ...mockPreloadedState.query, query, dataset },
    });

    it('resolves with the flags off while the probes hang, and starts them in the background', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(withDataset());

      const { store } = await getPreloadedStore(mockServices);

      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
      expect(getPromptModeIsAvailable).toHaveBeenCalledTimes(1);
      expect(getSummaryAgentIsAvailable).toHaveBeenCalledTimes(1);
    });

    it('sets the flags when the probes resolve after the store was created', async () => {
      (getPromptModeIsAvailable as jest.Mock).mockResolvedValueOnce(true);
      (getSummaryAgentIsAvailable as jest.Mock).mockResolvedValueOnce(true);
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(withDataset());

      const { store } = await getPreloadedStore(mockServices);
      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
      await new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));

      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(true);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(true);
    });

    it('does not start the probes when there is no dataset', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      await getPreloadedStore(mockServices);

      expect(getPromptModeIsAvailable).not.toHaveBeenCalled();
      expect(getSummaryAgentIsAvailable).not.toHaveBeenCalled();
    });

    it('keeps the current flags and re-probes after hydrating URL state', async () => {
      (loadReduxState as jest.MockedFunction<any>)
        .mockResolvedValueOnce(withDataset())
        .mockResolvedValueOnce(withDataset('source=other'));

      const { store } = await getPreloadedStore(mockServices);
      store.dispatch(setPromptModeIsAvailable(true));
      store.dispatch(setSummaryAgentIsAvailable(true));

      const historyCallback = mockHistoryListen.mock.calls[0][0];
      await historyCallback({ pathname: '/test' }, 'POP');

      expect(store.getState().query.query).toBe('source=other');
      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(true);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(true);
      expect(getPromptModeIsAvailable).toHaveBeenCalledTimes(2);
    });

    it('turns the flags off when hydrating URL state that has no dataset', async () => {
      (loadReduxState as jest.MockedFunction<any>)
        .mockResolvedValueOnce(withDataset())
        .mockResolvedValueOnce({ ...mockPreloadedState, query: { query: 'x', language: 'PPL' } });

      const { store } = await getPreloadedStore(mockServices);
      store.dispatch(setPromptModeIsAvailable(true));
      store.dispatch(setSummaryAgentIsAvailable(true));

      const historyCallback = mockHistoryListen.mock.calls[0][0];
      await historyCallback({ pathname: '/test' }, 'POP');

      expect(store.getState().queryEditor.promptModeIsAvailable).toBe(false);
      expect(store.getState().queryEditor.summaryAgentIsAvailable).toBe(false);
      expect(getPromptModeIsAvailable).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPreloadedStore', () => {
    it('should load state and create store with reset function', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      const result = await getPreloadedStore(mockServices);

      expect(loadReduxState).toHaveBeenCalledWith(mockServices);
      expect(result.store).toBeDefined();
      expect(result.unsubscribe).toBeDefined();
      expect(result.reset).toBeDefined();
      expect(typeof result.reset).toBe('function');
    });

    it('should reset store to initial state when reset is called', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      const result = await getPreloadedStore(mockServices);
      const initialState = result.store.getState();

      // Modify state
      result.store.dispatch({
        type: 'query/setQueryWithHistory',
        payload: { query: 'SELECT * FROM modified', language: 'SQL' },
      });
      expect(result.store.getState().query.query).toBe('SELECT * FROM modified');

      // Reset state
      result.reset();
      expect(result.store.getState()).toEqual(initialState);
    });

    it('should set up history listener for URL state synchronization', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      await getPreloadedStore(mockServices);

      expect(mockHistoryListen).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle POP history actions and sync URL state to Redux', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      const modifiedState = {
        ...mockPreloadedState,
        query: { ...mockPreloadedState.query, query: 'SELECT * FROM test' },
      };

      // Mock the second call to loadReduxState (for URL state sync)
      (loadReduxState as jest.MockedFunction<any>)
        .mockResolvedValueOnce(mockPreloadedState) // Initial load
        .mockResolvedValueOnce(modifiedState); // URL state sync

      mockOsdUrlStateStorageGet.mockReturnValue({ time: { from: 'now-15m', to: 'now' } });

      // Wait for getPreloadedStore to complete
      await getPreloadedStore(mockServices);

      // Get the history listener callback
      const historyCallback = mockHistoryListen.mock.calls[0][0];

      // Simulate a POP action (back/forward button)
      await historyCallback({ pathname: '/test' }, 'POP');

      // Verify loadReduxState was called again for URL sync
      expect(loadReduxState).toHaveBeenCalledTimes(2);
    });

    it('should ignore REPLACE and PUSH history actions', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      // Wait for getPreloadedStore to complete
      await getPreloadedStore(mockServices);

      // Get the history listener callback
      const historyCallback = mockHistoryListen.mock.calls[0][0];

      // Simulate REPLACE and PUSH actions
      await historyCallback({ pathname: '/test' }, 'REPLACE');
      await historyCallback({ pathname: '/test' }, 'PUSH');

      // Verify loadReduxState was only called once (initial load)
      expect(loadReduxState).toHaveBeenCalledTimes(1);
    });

    it('should handle date range changes from URL global state', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      const newTimeRange = { from: 'now-1h', to: 'now' };
      mockOsdUrlStateStorageGet.mockReturnValue({ time: newTimeRange });

      const { store } = await getPreloadedStore(mockServices);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      // Get the history listener callback
      const historyCallback = mockHistoryListen.mock.calls[0][0];

      // Simulate a POP action with different time range
      await historyCallback({ pathname: '/test' }, 'POP');

      // Verify setDateRange was dispatched
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setDateRange',
          payload: newTimeRange,
        })
      );
    });

    it('should conditionally dispatch hydrateState only when app state changes', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      // Mock normalized states to be equal (no app state change)
      (normalizeStateForComparison as jest.MockedFunction<any>).mockReturnValue({
        query: mockPreloadedState.query,
        ui: mockPreloadedState.ui,
        tab: mockPreloadedState.tab,
        legacy: mockPreloadedState.legacy,
      });

      const result = await getPreloadedStore(mockServices);
      const dispatchSpy = jest.spyOn(result.store, 'dispatch');

      // Get the history listener callback
      const historyCallback = mockHistoryListen.mock.calls[0][0];

      // Simulate a POP action with no app state change
      await historyCallback({ pathname: '/test' }, 'POP');

      // Verify hydrateState was NOT dispatched since app state didn't change
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app/hydrateState',
        })
      );
    });

    it('should handle errors in history listener gracefully', async () => {
      (loadReduxState as jest.MockedFunction<any>).mockResolvedValue(mockPreloadedState);

      // Mock loadReduxState to throw error on second call
      (loadReduxState as jest.MockedFunction<any>)
        .mockResolvedValueOnce(mockPreloadedState) // Initial load
        .mockRejectedValueOnce(new Error('URL sync failed')); // URL state sync error

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Wait for getPreloadedStore to complete
      await getPreloadedStore(mockServices);

      // Get the history listener callback
      const historyCallback = mockHistoryListen.mock.calls[0][0];

      // Simulate a POP action that causes an error
      await historyCallback({ pathname: '/test' }, 'POP');

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to sync URL state to Redux:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle initial store creation errors gracefully', async () => {
      // Mock loadReduxState to throw error on initial call
      (loadReduxState as jest.MockedFunction<any>).mockRejectedValue(
        new Error('Initial load failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getPreloadedStore(mockServices);

      // Should still return a valid store object
      expect(result.store).toBeDefined();
      expect(result.unsubscribe).toBeDefined();
      expect(result.reset).toBeDefined();
      expect(typeof result.unsubscribe).toBe('function');
      expect(typeof result.reset).toBe('function');

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize preloaded store:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should provide no-op unsubscribe when history listener setup fails', async () => {
      // Mock loadReduxState to throw error on initial call
      (loadReduxState as jest.MockedFunction<any>).mockRejectedValue(
        new Error('Initial load failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getPreloadedStore(mockServices);

      // Unsubscribe should be a no-op function that doesn't throw
      expect(() => result.unsubscribe()).not.toThrow();

      // History listener should not have been called since store creation failed
      expect(mockHistoryListen).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
