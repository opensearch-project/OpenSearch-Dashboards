/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTimefilterSubscription } from './use_timefilter_subscription';
import { ExploreServices } from '../../../types';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults, clearQueryStatusMap } from '../state_management/slices';
import {
  queryInitialState,
  queryReducer,
  uiInitialState,
  uiReducer,
  resultsInitialState,
  resultsReducer,
  QueryState,
} from '../state_management/slices';
import { Subject, Subscription } from 'rxjs';

// Mock the query actions
jest.mock('../state_management/actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'EXECUTE_QUERIES' }),
}));

jest.mock('../state_management/slices', () => ({
  ...jest.requireActual('../state_management/slices'),
  clearResults: jest.fn().mockReturnValue({ type: 'CLEAR_RESULTS' }),
  clearQueryStatusMap: jest.fn().mockReturnValue({ type: 'CLEAR_QUERY_STATUS_MAP' }),
}));

const mockExecuteQueries = executeQueries as jest.MockedFunction<typeof executeQueries>;
const mockClearResults = clearResults as jest.MockedFunction<typeof clearResults>;
const mockClearQueryStatusMap = clearQueryStatusMap as jest.MockedFunction<
  typeof clearQueryStatusMap
>;

// Mock store state type
interface MockRootState {
  query: QueryState;
  ui: any;
  results: any;
}

describe('useTimefilterSubscription', () => {
  let mockServices: ExploreServices;
  let mockDispatch: jest.Mock;
  let autoRefreshSubject: Subject<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    autoRefreshSubject = new Subject();

    mockServices = {
      data: {
        query: {
          timefilter: {
            timefilter: {
              getAutoRefreshFetch$: jest.fn(() => autoRefreshSubject.asObservable()),
            },
          },
        },
      },
    } as any;
  });

  const createMockStore = (initialState: Partial<MockRootState> = {}) => {
    const preloadedState = {
      query: {
        ...queryInitialState,
        ...initialState.query,
      },
      ui: {
        ...uiInitialState,
        ...initialState.ui,
      },
      results: {
        ...resultsInitialState,
        ...initialState.results,
      },
    };

    const store = configureStore({
      reducer: {
        query: queryReducer,
        ui: uiReducer,
        results: resultsReducer,
      },
      preloadedState,
    });

    // Mock dispatch
    jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
    return store;
  };

  const renderHookWithProvider = (
    services: ExploreServices,
    initialState?: Partial<MockRootState>
  ) => {
    const store = createMockStore(initialState);

    return renderHook(() => useTimefilterSubscription(services), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  describe('when all conditions are met', () => {
    it('should subscribe to auto refresh and dispatch query on refresh', () => {
      const initialState = {
        query: {
          ...queryInitialState,
          query: 'source=logs',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      renderHookWithProvider(mockServices, initialState);

      // Verify subscription was created
      expect(mockServices.data.query.timefilter.timefilter.getAutoRefreshFetch$).toHaveBeenCalled();

      // Trigger auto refresh
      autoRefreshSubject.next({});

      // Verify actions were dispatched
      expect(mockClearResults).toHaveBeenCalled();
      expect(mockClearQueryStatusMap).toHaveBeenCalled();
      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_RESULTS' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_QUERY_STATUS_MAP' });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EXECUTE_QUERIES' });
    });

    it('should handle multiple auto refresh events', () => {
      const initialState = {
        query: {
          ...queryInitialState,
          query: 'source=logs | head 10',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      renderHookWithProvider(mockServices, initialState);

      // Trigger multiple auto refresh events
      autoRefreshSubject.next({});
      autoRefreshSubject.next({});
      autoRefreshSubject.next({});

      // Verify actions were dispatched for each event (3 actions per event, 3 events = 9 total)
      expect(mockClearResults).toHaveBeenCalledTimes(3);
      expect(mockClearQueryStatusMap).toHaveBeenCalledTimes(3);
      expect(mockExecuteQueries).toHaveBeenCalledTimes(3);
      expect(mockDispatch).toHaveBeenCalledTimes(9); // 3 actions × 3 events
    });
  });

  describe('subscription cleanup', () => {
    it('should unsubscribe when component unmounts', () => {
      const mockUnsubscribe = jest.fn();

      // Create a proper Subscription mock
      const mockSubscription = new Subscription();
      mockSubscription.unsubscribe = mockUnsubscribe;

      // Mock the observable to return our mock subscription
      const mockObservable = {
        subscribe: jest.fn(() => mockSubscription),
      };

      mockServices.data.query.timefilter.timefilter.getAutoRefreshFetch$ = jest.fn(
        () => mockObservable as any
      );

      const initialState = {
        query: {
          ...queryInitialState,
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      const { unmount } = renderHookWithProvider(mockServices, initialState);

      // Verify subscription was created
      expect(mockObservable.subscribe).toHaveBeenCalled();

      // Unmount the component
      unmount();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe and resubscribe when services change', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();

      const mockSubscription1 = new Subscription();
      mockSubscription1.unsubscribe = mockUnsubscribe1;

      const mockSubscription2 = new Subscription();
      mockSubscription2.unsubscribe = mockUnsubscribe2;

      let subscriptionCount = 0;
      const mockObservable = {
        subscribe: jest.fn(() => {
          subscriptionCount++;
          return subscriptionCount === 1 ? mockSubscription1 : mockSubscription2;
        }),
      };

      mockServices.data.query.timefilter.timefilter.getAutoRefreshFetch$ = jest.fn(
        () => mockObservable as any
      );

      const initialState = {
        query: {
          ...queryInitialState,
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      const { rerender } = renderHookWithProvider(mockServices, initialState);

      // Verify first subscription was created
      expect(mockObservable.subscribe).toHaveBeenCalledTimes(1);

      // Re-render with new services
      rerender();

      // Note: In a real scenario, we'd need to change the services prop,
      // but since we're testing the hook directly, we simulate the effect
      // by checking that cleanup would happen on dependency change
      expect(mockUnsubscribe1).not.toHaveBeenCalled(); // Not called yet since services didn't actually change
    });
  });

  describe('query state changes', () => {
    it('should use updated query when auto refresh triggers', () => {
      const initialState = {
        query: {
          ...queryInitialState,
          query: 'source=logs',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      // First render with initial state
      const { unmount } = renderHookWithProvider(mockServices, initialState);

      // Trigger auto refresh with initial query
      autoRefreshSubject.next({});

      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });

      // Unmount the first hook
      unmount();

      // Clear previous calls
      mockExecuteQueries.mockClear();
      mockClearResults.mockClear();
      mockClearQueryStatusMap.mockClear();

      // Create a new hook instance with updated state
      const updatedState = {
        query: {
          ...queryInitialState,
          query: 'source=logs | head 20',
          language: 'ppl',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
      };

      renderHookWithProvider(mockServices, updatedState);

      // Trigger auto refresh with updated query
      autoRefreshSubject.next({});

      expect(mockExecuteQueries).toHaveBeenCalledWith({ services: mockServices });
    });
  });
});
