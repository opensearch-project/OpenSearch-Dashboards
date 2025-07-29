/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configurePreloadedStore, getPreloadedStore, RootState } from './store';
import { ExploreServices } from '../../../types';
import { loadReduxState } from './utils/redux_persistence';

// Mock dependencies
jest.mock('./utils/redux_persistence', () => ({
  loadReduxState: jest.fn(),
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

jest.mock('./middleware/overall_status_middleware', () => ({
  createOverallStatusMiddleware: jest.fn(() => () => (next: any) => (action: any) => next(action)),
}));

describe('store', () => {
  let mockServices: jest.Mocked<ExploreServices>;
  let mockPreloadedState: RootState;

  beforeEach(() => {
    mockServices = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn(),
          },
        },
      },
    } as any;

    mockPreloadedState = {
      query: {
        query: '',
        language: 'PPL',
        dataset: undefined,
      },
      ui: {
        isLoading: false,
      },
      results: {
        data: null,
        error: null,
      },
      tab: {
        activeTab: '',
        tabs: [],
      },
      legacy: {
        isLegacyMode: false,
      },
      queryEditor: {
        editorMode: 'single-query',
        promptModeIsAvailable: false,
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
  });
});
