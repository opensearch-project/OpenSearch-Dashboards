/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useInitialQueryExecution } from './use_initial_query_execution';
import { ExploreServices } from '../../../types';
import {
  queryReducer,
  uiInitialState,
  uiReducer,
  resultsInitialState,
  resultsReducer,
} from '../state_management/slices';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults } from '../state_management/slices';

// Mock Redux actions
jest.mock('../state_management/actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'EXECUTE_QUERIES' }),
}));

jest.mock('../state_management/slices', () => ({
  ...jest.requireActual('../state_management/slices'),
  clearResults: jest.fn().mockReturnValue({ type: 'CLEAR_RESULTS' }),
}));

const mockExecuteQueries = executeQueries as jest.MockedFunction<typeof executeQueries>;
const mockClearResults = clearResults as jest.MockedFunction<typeof clearResults>;

// Mock store state type
interface MockRootState {
  query: {
    query: string;
    language: string;
    dataset?: any;
  };
  ui: any;
  results: any;
}

describe('useInitialQueryExecution', () => {
  let mockServices: ExploreServices;
  let mockStore: any;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();

    mockServices = {
      uiSettings: {
        get: jest.fn().mockReturnValue(true), // Default: searchOnPageLoad = true
        get$: jest.fn(),
        getAll: jest.fn(),
        getDefault: jest.fn(),
        getUserProvidedWithScope: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        isDeclared: jest.fn(),
        isDefault: jest.fn(),
        isCustom: jest.fn(),
        isOverridden: jest.fn(),
        getUpdate$: jest.fn(),
        getSaved$: jest.fn(),
        getUpdateErrors$: jest.fn(),
        stop: jest.fn(),
      },
      data: {
        query: {
          queryString: {
            addToQueryHistory: jest.fn(),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            },
          },
        },
      },
    } as any;

    mockStore = configureStore({
      reducer: {
        query: queryReducer,
        ui: uiReducer,
        results: resultsReducer,
      },
      preloadedState: {
        query: {
          query: 'source=logs',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
        ui: uiInitialState,
        results: resultsInitialState,
      },
    });

    // Mock dispatch
    jest.spyOn(mockStore, 'dispatch').mockImplementation(mockDispatch);
  });

  const renderHookWithProvider = (
    services: ExploreServices,
    initialState?: Partial<MockRootState>
  ) => {
    if (initialState) {
      mockStore = configureStore({
        reducer: {
          query: queryReducer,
          ui: uiReducer,
          results: resultsReducer,
        },
        preloadedState: {
          query: initialState.query || {
            query: 'source=logs',
            language: 'ppl',
            dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
          },
          ui: initialState.ui || uiInitialState,
          results: initialState.results || resultsInitialState,
        },
      });
      jest.spyOn(mockStore, 'dispatch').mockImplementation(mockDispatch);
    }

    return renderHook(() => useInitialQueryExecution(services), {
      wrapper: ({ children }) => <Provider store={mockStore}>{children}</Provider>,
    });
  };

  describe('when all conditions are met', () => {
    it('should execute initial query and add to history', () => {
      const { result } = renderHookWithProvider(mockServices);

      expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
        {
          query: 'source=logs',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
        { from: 'now-15m', to: 'now' }
      );

      expect(mockClearResults).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(result.current.isInitialized).toBe(true);
    });

    it('should only initialize once', () => {
      const { rerender } = renderHookWithProvider(mockServices);

      // First render
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
      expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledTimes(1);

      // Re-render should not trigger again
      rerender();
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
      expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('when searchOnPageLoad is disabled', () => {
    it('should not execute query or add to history', () => {
      const servicesWithSearchDisabled = {
        ...mockServices,
        uiSettings: {
          ...mockServices.uiSettings,
          get: jest.fn().mockReturnValue(false), // searchOnPageLoad = false
        },
      } as any;

      const { result } = renderHookWithProvider(servicesWithSearchDisabled);

      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
      expect(mockClearResults).not.toHaveBeenCalled();
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('when query is empty', () => {
    it('should not execute query or add to history', () => {
      const { result } = renderHookWithProvider(mockServices, {
        query: {
          query: '',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      });

      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
      expect(mockClearResults).not.toHaveBeenCalled();
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('when query is whitespace only', () => {
    it('should not add whitespace-only query to history but should execute', () => {
      const { result } = renderHookWithProvider(mockServices, {
        query: {
          query: '   ',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      });

      // Should not add to history due to trim() check
      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();

      // But should still execute query (business logic decision)
      expect(mockClearResults).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('when dataset is missing', () => {
    it('should not execute query or add to history', () => {
      const { result } = renderHookWithProvider(mockServices, {
        query: {
          query: 'source=logs',
          language: 'ppl',
          dataset: undefined,
        },
      });

      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();
      expect(mockClearResults).not.toHaveBeenCalled();
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('when timefilter is missing', () => {
    it('should execute query but not add to history', () => {
      const servicesWithoutTimefilter = {
        ...mockServices,
        data: {
          ...mockServices.data,
          query: {
            ...mockServices.data.query,
            timefilter: undefined,
          },
        },
      } as any;

      const { result } = renderHookWithProvider(servicesWithoutTimefilter);

      // Should not add to history due to missing timefilter
      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();

      // But should still execute query
      expect(mockClearResults).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: servicesWithoutTimefilter });
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('when services are missing', () => {
    it('should not execute query or add to history', () => {
      const { result } = renderHookWithProvider(null as any);

      expect(mockClearResults).not.toHaveBeenCalled();
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('shouldSearchOnPageLoad memoization', () => {
    it('should memoize shouldSearchOnPageLoad based on uiSettings', () => {
      const { rerender } = renderHookWithProvider(mockServices);

      // First render
      expect(mockServices.uiSettings.get).toHaveBeenCalledWith('discover:searchOnPageLoad', true);

      const initialCallCount = (mockServices.uiSettings.get as jest.Mock).mock.calls.length;

      // Re-render with same services should not call uiSettings.get again
      rerender();
      expect((mockServices.uiSettings.get as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });

    it('should recalculate when uiSettings changes', () => {
      const { rerender } = renderHookWithProvider(mockServices);

      const newServices = {
        ...mockServices,
        uiSettings: {
          ...mockServices.uiSettings,
          get: jest.fn().mockReturnValue(false),
        },
      } as any;

      // Re-render with different uiSettings should recalculate
      rerender({ children: <div /> });
      renderHookWithProvider(newServices);

      expect(newServices.uiSettings.get).toHaveBeenCalledWith('discover:searchOnPageLoad', true);
    });
  });

  describe('edge cases', () => {
    it('should handle query with leading/trailing whitespace', () => {
      const { result } = renderHookWithProvider(mockServices, {
        query: {
          query: '  source=logs  ',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      });

      // Should add to history because trim() returns non-empty string
      expect(mockServices.data.query.queryString.addToQueryHistory).toHaveBeenCalledWith(
        {
          query: '  source=logs  ',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
        { from: 'now-15m', to: 'now' }
      );

      expect(mockClearResults).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(true);
    });

    it('should handle mixed whitespace characters', () => {
      const { result } = renderHookWithProvider(mockServices, {
        query: {
          query: '\n\t  \r',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      });

      // Should not add to history due to trim() returning empty string
      expect(mockServices.data.query.queryString.addToQueryHistory).not.toHaveBeenCalled();

      // But should still execute query
      expect(mockClearResults).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(true);
    });
  });
});
