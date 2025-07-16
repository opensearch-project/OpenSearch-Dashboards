/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPersistenceMiddleware } from './persistence_middleware';
import { persistReduxState } from '../utils/redux_persistence';
import { ExploreServices } from '../../../../types';
import { RootState } from '../store';
import { MockStore } from '../__mocks__';

// Mock the persistence utility
jest.mock('../utils/redux_persistence', () => ({
  persistReduxState: jest.fn(),
}));

describe('persistence_middleware', () => {
  let mockServices: jest.Mocked<ExploreServices>;
  let mockStore: MockStore;
  let mockNext: jest.MockedFunction<any>;
  let mockState: RootState;

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

    mockState = {
      query: {
        query: 'SELECT * FROM test',
        language: 'SQL',
        dataset: undefined,
      },
      ui: {
        isLoading: false,
      },
      tab: {
        activeTab: 'test-tab',
      },
      legacy: {
        isLegacyMode: false,
      },
      results: {},
      queryEditor: {
        editorMode: 'single-query',
      },
    } as any;

    mockStore = {
      getState: jest.fn().mockReturnValue(mockState),
      dispatch: jest.fn(),
    };

    mockNext = jest.fn((action) => action);

    jest.clearAllMocks();
  });

  describe('createPersistenceMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = createPersistenceMiddleware(mockServices);

      expect(typeof middleware).toBe('function');
    });

    it('should return store enhancer function', () => {
      const middleware = createPersistenceMiddleware(mockServices);
      const storeEnhancer = middleware(mockStore);

      expect(typeof storeEnhancer).toBe('function');
    });

    it('should return action handler function', () => {
      const middleware = createPersistenceMiddleware(mockServices);
      const storeEnhancer = middleware(mockStore);
      const actionHandler = storeEnhancer(mockNext);

      expect(typeof actionHandler).toBe('function');
    });
  });

  describe('middleware behavior', () => {
    let middleware: any;
    let actionHandler: any;

    beforeEach(() => {
      middleware = createPersistenceMiddleware(mockServices);
      actionHandler = middleware(mockStore)(mockNext);
    });

    it('should call next with the action', () => {
      const action = { type: 'test/action', payload: 'test' };

      const result = actionHandler(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(result).toBe(action);
    });

    it('should persist state for query/ actions', () => {
      const action = { type: 'query/setQuery', payload: 'SELECT * FROM users' };

      actionHandler(action);

      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should persist state for ui/ actions', () => {
      const action = { type: 'ui/setLoading', payload: true };

      actionHandler(action);

      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should persist state for tab/ actions', () => {
      const action = { type: 'tab/setActiveTab', payload: 'new-tab' };

      actionHandler(action);

      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should persist state for legacy/ actions', () => {
      const action = { type: 'legacy/setLegacyMode', payload: true };

      actionHandler(action);

      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should not persist state for non-triggering actions', () => {
      const action = { type: 'results/setResults', payload: {} };

      actionHandler(action);

      expect(persistReduxState).not.toHaveBeenCalled();
    });

    it('should not persist state for queryEditor/ actions', () => {
      const action = { type: 'queryEditor/setEditorMode', payload: 'dual-query' };

      actionHandler(action);

      expect(persistReduxState).not.toHaveBeenCalled();
    });

    it('should not persist state for random actions', () => {
      const action = { type: 'random/action', payload: 'test' };

      actionHandler(action);

      expect(persistReduxState).not.toHaveBeenCalled();
    });

    it('should handle actions with nested types correctly', () => {
      const action = { type: 'query/nested/action', payload: 'test' };

      actionHandler(action);

      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should handle multiple persist-triggering actions', () => {
      const actions = [
        { type: 'query/setQuery', payload: 'SELECT 1' },
        { type: 'ui/setLoading', payload: true },
        { type: 'tab/setActiveTab', payload: 'tab1' },
      ];

      actions.forEach((action) => actionHandler(action));

      expect(persistReduxState).toHaveBeenCalledTimes(3);
      expect(persistReduxState).toHaveBeenCalledWith(mockState, mockServices);
    });

    it('should get fresh state for each persistence call', () => {
      const updatedState = { ...mockState, query: { ...mockState.query, query: 'SELECT 2' } };
      mockStore.getState.mockReturnValueOnce(mockState).mockReturnValueOnce(updatedState);

      const action1 = { type: 'query/setQuery', payload: 'SELECT 1' };
      const action2 = { type: 'query/setQuery', payload: 'SELECT 2' };

      actionHandler(action1);
      actionHandler(action2);

      expect(persistReduxState).toHaveBeenNthCalledWith(1, mockState, mockServices);
      expect(persistReduxState).toHaveBeenNthCalledWith(2, updatedState, mockServices);
    });

    it('should handle actions with no type gracefully', () => {
      const action = { payload: 'test' } as any;

      expect(() => actionHandler(action)).not.toThrow();
      expect(persistReduxState).not.toHaveBeenCalled();
    });

    it('should handle actions with empty type', () => {
      const action = { type: '', payload: 'test' };

      actionHandler(action);

      expect(persistReduxState).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive action type matching', () => {
      const actions = [
        { type: 'Query/setQuery', payload: 'test' }, // Capital Q
        { type: 'QUERY/setQuery', payload: 'test' }, // All caps
        { type: 'query/setQuery', payload: 'test' }, // Correct case
      ];

      actions.forEach((action) => actionHandler(action));

      // Only the correctly cased action should trigger persistence
      expect(persistReduxState).toHaveBeenCalledTimes(1);
    });
  });
});
