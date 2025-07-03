/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { queryEditorReducer, setExecutionStatus, QueryEditorSliceState } from './query_editor_slice';
import { QueryExecutionStatus } from '../../types';

describe('QueryEditor Slice', () => {
  // Define the initial state for testing
  const initialState: QueryEditorSliceState = {
    executionStatus: QueryExecutionStatus.UNINITIALIZED,
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(queryEditorReducer(undefined, {})).toEqual(initialState);
  });

  describe('setExecutionStatus', () => {
    it('should handle setExecutionStatus action', () => {
      const newStatus = QueryExecutionStatus.LOADING;
      const action = setExecutionStatus(newStatus);

      expect(action.type).toBe('system/setExecutionStatus');
      expect(action.payload).toBe(newStatus);

      const newState = queryEditorReducer(initialState, action);
      expect(newState.executionStatus).toBe(newStatus);
    });

    it('should handle all status values', () => {
      const statusValues = [
        QueryExecutionStatus.UNINITIALIZED,
        QueryExecutionStatus.LOADING,
        QueryExecutionStatus.READY,
        QueryExecutionStatus.NO_RESULTS,
        QueryExecutionStatus.ERROR,
      ];

      statusValues.forEach((status) => {
        const action = setExecutionStatus(status);
        const newState = queryEditorReducer(initialState, action);
        expect(newState.executionStatus).toBe(status);
      });
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple status changes in sequence', () => {
      let state = initialState;

      // First action: set loading
      state = queryEditorReducer(state, setExecutionStatus(QueryExecutionStatus.LOADING));
      expect(state.executionStatus).toBe(QueryExecutionStatus.LOADING);

      // Second action: set ready
      state = queryEditorReducer(state, setExecutionStatus(QueryExecutionStatus.READY));
      expect(state.executionStatus).toBe(QueryExecutionStatus.READY);

      // Third action: set error
      state = queryEditorReducer(state, setExecutionStatus(QueryExecutionStatus.ERROR));
      expect(state.executionStatus).toBe(QueryExecutionStatus.ERROR);

      // Final state should have the last status
      expect(state).toEqual({
        status: QueryExecutionStatus.ERROR,
      });
    });
  });
});
