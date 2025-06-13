/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  uiReducer,
  setActiveTab,
  setFlavor,
  setStatus,
  setExecutionCacheKeys,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
  UIState,
} from '../ui_slice';
import { ResultStatus } from '../../../../legacy/discover/application/view_components/utils/use_search';

describe('UI Slice', () => {
  // Define the initial state for testing
  const initialState: UIState = {
    activeTabId: 'logs',
    flavor: 'log',
    status: ResultStatus.UNINITIALIZED,
    executionCacheKeys: [],
    transaction: {
      inProgress: false,
      pendingActions: [],
    },
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(uiReducer(undefined, {})).toEqual(initialState);
  });

  describe('setActiveTab', () => {
    it('should handle setActiveTab action', () => {
      const newTabId = 'visualizations';
      const action = setActiveTab(newTabId);

      expect(action.type).toBe('ui/setActiveTab');
      expect(action.payload).toBe(newTabId);

      const newState = uiReducer(initialState, action);
      expect(newState.activeTabId).toBe(newTabId);

      // Other state properties should remain unchanged
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.status).toBe(initialState.status);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
      expect(newState.transaction).toEqual(initialState.transaction);
    });
  });

  describe('setFlavor', () => {
    it('should handle setFlavor action', () => {
      const newFlavor = 'metric';
      const action = setFlavor(newFlavor);

      expect(action.type).toBe('ui/setFlavor');
      expect(action.payload).toBe(newFlavor);

      const newState = uiReducer(initialState, action);
      expect(newState.flavor).toBe(newFlavor);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.status).toBe(initialState.status);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
      expect(newState.transaction).toEqual(initialState.transaction);
    });
  });

  describe('setStatus', () => {
    it('should handle setStatus action', () => {
      const newStatus = ResultStatus.LOADING;
      const action = setStatus(newStatus);

      expect(action.type).toBe('ui/setStatus');
      expect(action.payload).toBe(newStatus);

      const newState = uiReducer(initialState, action);
      expect(newState.status).toBe(newStatus);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
      expect(newState.transaction).toEqual(initialState.transaction);
    });
  });

  describe('setExecutionCacheKeys', () => {
    it('should handle setExecutionCacheKeys action', () => {
      const cacheKeys = ['key1', 'key2', 'key3'];
      const action = setExecutionCacheKeys(cacheKeys);

      expect(action.type).toBe('ui/setExecutionCacheKeys');
      expect(action.payload).toEqual(cacheKeys);

      const newState = uiReducer(initialState, action);
      expect(newState.executionCacheKeys).toEqual(cacheKeys);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.status).toBe(initialState.status);
      expect(newState.transaction).toEqual(initialState.transaction);
    });
  });

  describe('transaction actions', () => {
    it('should handle startTransaction action', () => {
      const previousState = { someKey: 'someValue' };
      const action = startTransaction({ previousState });

      expect(action.type).toBe('ui/startTransaction');
      expect(action.payload).toEqual({ previousState });

      const newState = uiReducer(initialState, action);
      expect(newState.transaction.inProgress).toBe(true);
      expect(newState.transaction.pendingActions).toEqual([]);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.status).toBe(initialState.status);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
    });

    it('should handle commitTransaction action', () => {
      const transactionState = {
        ...initialState,
        transaction: {
          inProgress: true,
          pendingActions: ['action1', 'action2'],
        },
      };

      const action = commitTransaction();

      expect(action.type).toBe('ui/commitTransaction');

      const newState = uiReducer(transactionState, action);
      expect(newState.transaction.inProgress).toBe(false);
      expect(newState.transaction.pendingActions).toEqual([]);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.status).toBe(initialState.status);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
    });

    it('should handle rollbackTransaction action', () => {
      const transactionState = {
        ...initialState,
        transaction: {
          inProgress: true,
          pendingActions: ['action1', 'action2'],
        },
      };

      const errorMessage = 'Transaction failed';
      const action = rollbackTransaction(errorMessage);

      expect(action.type).toBe('ui/rollbackTransaction');
      expect(action.payload).toBe(errorMessage);

      const newState = uiReducer(transactionState, action);
      expect(newState.transaction.inProgress).toBe(false);
      expect(newState.transaction.pendingActions).toEqual([]);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.status).toBe(initialState.status);
      expect(newState.executionCacheKeys).toEqual(initialState.executionCacheKeys);
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // First action: set active tab
      state = uiReducer(state, setActiveTab('visualizations'));
      expect(state.activeTabId).toBe('visualizations');

      // Second action: set status
      state = uiReducer(state, setStatus(ResultStatus.LOADING));
      expect(state.status).toBe(ResultStatus.LOADING);

      // Third action: set flavor
      state = uiReducer(state, setFlavor('metric'));
      expect(state.flavor).toBe('metric');

      // Fourth action: set cache keys
      const cacheKeys = ['key1', 'key2'];
      state = uiReducer(state, setExecutionCacheKeys(cacheKeys));
      expect(state.executionCacheKeys).toEqual(cacheKeys);

      // Final state should have all changes
      expect(state).toEqual({
        activeTabId: 'visualizations',
        flavor: 'metric',
        status: ResultStatus.LOADING,
        executionCacheKeys: cacheKeys,
        transaction: {
          inProgress: false,
          pendingActions: [],
        },
      });
    });
  });
});
