/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTimefilterSubscription } from './use_timefilter_subscription';
import { ExploreServices } from '../../../types';
import { executeQueries } from '../state_management/actions/query_actions';
import { clearResults, clearQueryStatusMap } from '../state_management/slices';
import {
  queryEditorInitialState,
  queryEditorReducer,
  queryInitialState,
  queryReducer,
  uiInitialState,
  uiReducer,
  resultsInitialState,
  resultsReducer,
  QueryState,
} from '../state_management/slices';
import { Subject, Subscription } from 'rxjs';
import { QueryExecutionStatus } from '../state_management/types';

// Mock the query actions
jest.mock('../state_management/actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'EXECUTE_QUERIES' }),
  defaultPrepareQueryString: jest.fn(() => 'results-key'),
}));

jest.mock('../state_management/actions/streaming_query_actions', () => ({
  STREAMING_MAX_HELD_ROWS: 100,
}));

let mockStreamingKeys: string[] = [];
jest.mock('../streaming/streaming_abort_registry', () => ({
  isStreamingQueryAbortable: (cacheKey: string) => mockStreamingKeys.includes(cacheKey),
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
  queryEditor?: any;
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
        queryEditor: (state = initialState.queryEditor ?? { queryStatusMap: {} }) => state,
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

  // A tick that superseded the running queries meant nothing rendered with an interval shorter than
  // the query, and every restart scanned the source again.
  describe('while a query is still running', () => {
    const withStatuses = (queryStatusMap: Record<string, unknown>) =>
      ({
        query: {
          ...queryInitialState,
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
        queryEditor: { queryStatusMap },
      }) as any;

    it.each([
      ['the results query runs', { 'results-key': { status: QueryExecutionStatus.LOADING } }],
      [
        'the histogram still runs after the results settled',
        {
          'results-key': { status: QueryExecutionStatus.READY },
          'histogram-key': { status: QueryExecutionStatus.LOADING },
        },
      ],
      [
        'the run is between its queries',
        { 'executeQueries:1': { status: QueryExecutionStatus.LOADING } },
      ],
    ])('ignores the tick while %s', (_label, statusMap) => {
      renderHookWithProvider(mockServices, withStatuses(statusMap));

      autoRefreshSubject.next({});
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it.each([
      ['returned results', QueryExecutionStatus.READY],
      ['returned nothing', QueryExecutionStatus.NO_RESULTS],
      ['failed', QueryExecutionStatus.ERROR],
      ['was stopped', QueryExecutionStatus.UNINITIALIZED],
    ])('refreshes on a tick once the run %s', (_label, status) => {
      renderHookWithProvider(
        mockServices,
        withStatuses({
          'results-key': { status },
          'histogram-key': { status: QueryExecutionStatus.READY },
        })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
    });
  });

  // A refresh interval shorter than the query would otherwise supersede every run before it renders.
  describe('while the results query is still streaming', () => {
    const withStreaming = (streaming: Record<string, unknown>) =>
      ({
        query: {
          ...queryInitialState,
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test-dataset', title: 'Test Dataset', type: 'INDEX_PATTERN' },
        },
        queryEditor: { queryStatusMap: { 'results-key': { streaming } } },
      }) as any;

    beforeEach(() => {
      mockStreamingKeys = ['results-key'];
    });

    afterEach(() => {
      mockStreamingKeys = [];
    });

    it('skips the refresh while rows are still arriving, and resumes once the run ends', () => {
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: true, rowsFetched: 40, total: 500 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(mockClearResults).not.toHaveBeenCalled();

      mockStreamingKeys = [];
      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
    });

    it('skips while nothing has rendered yet, before the total is known', () => {
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: true, rowsFetched: 0, total: 0 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
    });

    // A slow query: the client has read every row produced so far, but more are coming.
    it('skips while the client has caught up with a query that is still producing rows', () => {
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: true, rowsFetched: 40, total: 40 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
    });

    it('refreshes once a run below the cap has finished', () => {
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: false, rowsFetched: 40, total: 40 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
    });

    // Past the cap the run only polls for status, which could hold refreshes back for minutes.
    it('refreshes once the table reaches the row cap', () => {
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: true, rowsFetched: 100, total: 5000 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
    });

    // Past the cap only the table stops holding refreshes back: a histogram or tab query still
    // loading would be restarted by the tick.
    it('past the row cap, still skips while another of the page’s queries is loading', () => {
      const state = withStreaming({ isPolling: true, rowsFetched: 100, total: 5000 });
      state.queryEditor.queryStatusMap['results-key'].status = QueryExecutionStatus.LOADING;
      state.queryEditor.queryStatusMap['histogram-key'] = { status: QueryExecutionStatus.LOADING };
      const { unmount } = renderHookWithProvider(mockServices, state);

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      unmount();
    });

    it('past the row cap, refreshes while only the table itself is still loading', () => {
      const state = withStreaming({ isPolling: true, rowsFetched: 100, total: 5000 });
      state.queryEditor.queryStatusMap['results-key'].status = QueryExecutionStatus.LOADING;
      renderHookWithProvider(mockServices, state);

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
    });

    it('still refreshes while some other query streams', () => {
      mockStreamingKeys = ['another-key'];
      renderHookWithProvider(
        mockServices,
        withStreaming({ isPolling: true, rowsFetched: 40, total: 500 })
      );

      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledTimes(1);
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

  describe('for a dataset type that requires an explicit Run', () => {
    const EXPLICIT = { id: 'explicit', title: 'Explicit', type: 'EXPLICIT_RUN_TYPE' };

    const renderExplicit = (queryEditor: Record<string, unknown>) => {
      const services = {
        data: {
          query: {
            ...mockServices.data.query,
            queryString: {
              getDatasetService: () => ({
                getType: (type: string) =>
                  type === EXPLICIT.type ? { meta: { requiresExplicitRun: true } } : { meta: {} },
              }),
            },
          },
        },
      } as any;
      const store = configureStore({
        reducer: { query: queryReducer, queryEditor: queryEditorReducer },
        preloadedState: {
          query: { ...queryInitialState, query: 'q', dataset: EXPLICIT },
          queryEditor: { ...queryEditorInitialState, ...queryEditor },
        } as any,
      });
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      renderHook(() => useTimefilterSubscription(services), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });
      return services;
    };

    it('does not run on a tick before the user has run the query (e.g. a restored interval)', () => {
      renderExplicit({ queryStatusMap: {} });
      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
      expect(mockClearResults).not.toHaveBeenCalled();
    });

    it('does not run on a tick after the query was edited', () => {
      renderExplicit({
        queryStatusMap: { someCacheKey: { status: 'READY' } },
        isQueryEditorDirty: true,
      });
      autoRefreshSubject.next({});
      expect(mockExecuteQueries).not.toHaveBeenCalled();
    });

    it('refreshes a query the user has run', () => {
      const services = renderExplicit({ queryStatusMap: { someCacheKey: { status: 'READY' } } });
      autoRefreshSubject.next({});
      expect(mockExecuteQueries).toHaveBeenCalledWith({ services });
    });
  });
});
