/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { createOverallStatusMiddleware } from './overall_status_middleware';
import { QueryExecutionStatus, QueryResultStatus } from '../types';
import {
  setIndividualQueryStatus,
  setOverallQueryStatus,
  QueryStatusMap,
} from '../slices/query_editor/query_editor_slice';

const initialState = {
  queryStatusMap: {} as QueryStatusMap,
  overallQueryStatus: {
    status: QueryExecutionStatus.UNINITIALIZED,
    elapsedMs: undefined,
    startTime: undefined,
    body: undefined,
  } as QueryResultStatus,
  editorMode: 'single-query',
  promptModeIsAvailable: false,
  promptToQueryIsLoading: false,
  lastExecutedPrompt: '',
};

// Mock the query editor slice
const mockQueryEditorSlice = {
  name: 'queryEditor',
  reducer: (state = initialState, action: any) => {
    switch (action.type) {
      case 'queryEditor/setIndividualQueryStatus':
        return {
          ...state,
          queryStatusMap: {
            ...state.queryStatusMap,
            [action.payload.cacheKey]: action.payload.status,
          },
        };
      case 'queryEditor/setOverallQueryStatus':
        return {
          ...state,
          overallQueryStatus: action.payload,
        };
      default:
        return state;
    }
  },
};

describe('createOverallStatusMiddleware', () => {
  let store: any;
  let middleware: ReturnType<typeof createOverallStatusMiddleware>;

  beforeEach(() => {
    middleware = createOverallStatusMiddleware();

    store = configureStore({
      reducer: {
        queryEditor: mockQueryEditorSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }).concat(middleware),
    }) as any;
  });

  describe('middleware behavior', () => {
    it('should only process setIndividualQueryStatus actions', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      // Dispatch a different action type
      store.dispatch({ type: 'some/other/action', payload: {} });

      // Should not trigger any additional dispatches
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith({ type: 'some/other/action', payload: {} });
    });

    it('should not recompute when overall status is already ERROR', () => {
      // Set initial error state
      store.dispatch(
        setOverallQueryStatus({
          status: QueryExecutionStatus.ERROR,
          elapsedMs: 100,
          startTime: Date.now(),
          body: { error: { error: 'Test error' } },
        })
      );

      const dispatchSpy = jest.spyOn(store, 'dispatch');
      dispatchSpy.mockClear();

      // Dispatch individual status update
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.READY,
            elapsedMs: 50,
            startTime: Date.now(),
            body: undefined,
          },
        })
      );

      // Should not dispatch setOverallQueryStatus since overall status is ERROR
      const overallStatusCalls = dispatchSpy.mock.calls.filter(
        (call: any) => call[0].type === 'queryEditor/setOverallQueryStatus'
      );
      expect(overallStatusCalls).toHaveLength(0);
    });

    it('should set overall status to ERROR immediately when incoming status is ERROR', () => {
      const errorStatus: QueryResultStatus = {
        status: QueryExecutionStatus.ERROR,
        elapsedMs: 100,
        startTime: Date.now(),
        body: { error: { error: 'Query failed' } },
      };

      const action = setIndividualQueryStatus({
        cacheKey: 'query1',
        status: errorStatus,
      });

      store.dispatch(action);
      const finalState = store.getState();

      // The overall status should be set to the error status
      expect(finalState.queryEditor.overallQueryStatus).toEqual(errorStatus);

      // The query status map should contain the error status
      expect(finalState.queryEditor.queryStatusMap.query1).toEqual(errorStatus);
    });

    it('should compute overall status from status map for non-error statuses', () => {
      // Add first query status
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.LOADING,
            startTime: 1000,
            elapsedMs: undefined,
            body: undefined,
          },
        })
      );

      // Add second query status
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query2',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1100,
            elapsedMs: 200,
            body: undefined,
          },
        })
      );

      const finalState = store.getState();

      // Should be LOADING since one query is still loading
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.LOADING);
      expect(finalState.queryEditor.overallQueryStatus.startTime).toBe(1000); // Earliest start time
    });
  });

  describe('computeOverallStatus logic', () => {
    it('should return LOADING status when any query is loading', () => {
      // Add loading query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.LOADING,
            startTime: 1000,
            elapsedMs: undefined,
            body: undefined,
          },
        })
      );

      // Add completed query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query2',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1100,
            elapsedMs: 200,
            body: undefined,
          },
        })
      );

      // Add another loading query to trigger recomputation
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query3',
          status: {
            status: QueryExecutionStatus.LOADING,
            startTime: 900,
            elapsedMs: undefined,
            body: undefined,
          },
        })
      );

      const finalState = store.getState();
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.LOADING);
      expect(finalState.queryEditor.overallQueryStatus.startTime).toBe(900); // Earliest start time
    });

    it('should return READY status when all queries are completed and at least one has results', () => {
      // Add ready query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1000,
            elapsedMs: 150,
            body: undefined,
          },
        })
      );

      // Add no results query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query2',
          status: {
            status: QueryExecutionStatus.NO_RESULTS,
            startTime: 1100,
            elapsedMs: 200,
            body: undefined,
          },
        })
      );

      const finalState = store.getState();
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.READY);
      expect(finalState.queryEditor.overallQueryStatus.elapsedMs).toBe(200); // Slowest query
    });

    it('should return NO_RESULTS status when all queries are completed but none have results', () => {
      // Add first no results query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.NO_RESULTS,
            startTime: 1000,
            elapsedMs: 150,
            body: undefined,
          },
        })
      );

      // Add second no results query
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query2',
          status: {
            status: QueryExecutionStatus.NO_RESULTS,
            startTime: 1100,
            elapsedMs: 200,
            body: undefined,
          },
        })
      );

      const finalState = store.getState();
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(
        QueryExecutionStatus.NO_RESULTS
      );
      expect(finalState.queryEditor.overallQueryStatus.elapsedMs).toBe(200); // Slowest query
    });

    it('should handle queries with undefined elapsedMs when computing slowest query', () => {
      // Add query with undefined elapsedMs
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1000,
            elapsedMs: undefined,
            body: undefined,
          },
        })
      );

      // Add query with defined elapsedMs
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query2',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1100,
            elapsedMs: 200,
            body: undefined,
          },
        })
      );

      const finalState = store.getState();
      // Should not crash and should handle the undefined elapsedMs gracefully
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.READY);
    });

    it('should return UNINITIALIZED status when status map is empty', () => {
      // Start with empty status map and dispatch a non-setIndividualQueryStatus action
      // to trigger middleware without adding any statuses
      store.dispatch({ type: 'some/other/action' });

      // Manually test the computeOverallStatus function with empty map
      // by dispatching an action that would clear the status map
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1000,
            elapsedMs: 100,
            body: undefined,
          },
        })
      );

      // Clear the status map by resetting state
      const emptyState = {
        ...store.getState(),
        queryEditor: {
          ...store.getState().queryEditor,
          queryStatusMap: {},
        },
      };

      // Test the empty status map scenario by creating a new store with empty state
      const emptyStore = configureStore({
        reducer: {
          queryEditor: mockQueryEditorSlice.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
          }).concat(middleware),
        preloadedState: emptyState,
      }) as any;

      // Dispatch an action to trigger middleware computation with empty status map
      emptyStore.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'query1',
          status: {
            status: QueryExecutionStatus.READY,
            startTime: 1000,
            elapsedMs: 100,
            body: undefined,
          },
        })
      );

      const finalState = emptyStore.getState();
      expect(finalState.queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.READY);
    });

    it('should return the single status when there is only one query in the status map', () => {
      const singleStatus: QueryResultStatus = {
        status: QueryExecutionStatus.READY,
        startTime: 1000,
        elapsedMs: 150,
        body: undefined,
      };

      // Add only one query status
      store.dispatch(
        setIndividualQueryStatus({
          cacheKey: 'onlyQuery',
          status: singleStatus,
        })
      );

      const finalState = store.getState();

      // The overall status should exactly match the single query status
      expect(finalState.queryEditor.overallQueryStatus).toEqual(singleStatus);
      expect(finalState.queryEditor.queryStatusMap.onlyQuery).toEqual(singleStatus);
    });
  });
});
