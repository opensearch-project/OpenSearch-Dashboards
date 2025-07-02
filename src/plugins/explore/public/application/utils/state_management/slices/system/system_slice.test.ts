/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { systemReducer, setStatus, SystemState } from '../system/system_slice';
import { ResultStatus } from '../../../../legacy/discover/application/view_components/utils/use_search';

describe('System Slice', () => {
  // Define the initial state for testing
  const initialState: SystemState = {
    status: ResultStatus.UNINITIALIZED,
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(systemReducer(undefined, {})).toEqual(initialState);
  });

  describe('setStatus', () => {
    it('should handle setStatus action', () => {
      const newStatus = ResultStatus.LOADING;
      const action = setStatus(newStatus);

      expect(action.type).toBe('system/setStatus');
      expect(action.payload).toBe(newStatus);

      const newState = systemReducer(initialState, action);
      expect(newState.status).toBe(newStatus);
    });

    it('should handle all status values', () => {
      const statusValues = [
        ResultStatus.UNINITIALIZED,
        ResultStatus.LOADING,
        ResultStatus.READY,
        ResultStatus.NO_RESULTS,
        ResultStatus.ERROR,
      ];

      statusValues.forEach((status) => {
        const action = setStatus(status);
        const newState = systemReducer(initialState, action);
        expect(newState.status).toBe(status);
      });
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple status changes in sequence', () => {
      let state = initialState;

      // First action: set loading
      state = systemReducer(state, setStatus(ResultStatus.LOADING));
      expect(state.status).toBe(ResultStatus.LOADING);

      // Second action: set ready
      state = systemReducer(state, setStatus(ResultStatus.READY));
      expect(state.status).toBe(ResultStatus.READY);

      // Third action: set error
      state = systemReducer(state, setStatus(ResultStatus.ERROR));
      expect(state.status).toBe(ResultStatus.ERROR);

      // Final state should have the last status
      expect(state).toEqual({
        status: ResultStatus.ERROR,
      });
    });
  });
});
