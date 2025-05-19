/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  uiReducer,
  setActiveTab,
  setFlavor,
  setLoading,
  setError,
  setPromptQuery,
  UIState,
} from '../ui_slice';

describe('UI Slice', () => {
  // Define the initial state for testing
  const initialState: UIState = {
    activeTabId: 'logs',
    flavor: 'log',
    isLoading: false,
    error: null,
    queryPanel: {
      promptQuery: '',
    },
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(uiReducer(undefined, {})).toEqual({
      activeTabId: 'logs',
      flavor: 'log',
      isLoading: false,
      error: null,
      queryPanel: {
        promptQuery: '',
      },
    });
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
      expect(newState.isLoading).toBe(initialState.isLoading);
      expect(newState.error).toBe(initialState.error);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
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
      expect(newState.isLoading).toBe(initialState.isLoading);
      expect(newState.error).toBe(initialState.error);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
    });
  });

  describe('setLoading', () => {
    it('should handle setLoading action with true', () => {
      const action = setLoading(true);

      expect(action.type).toBe('ui/setLoading');
      expect(action.payload).toBe(true);

      const newState = uiReducer(initialState, action);
      expect(newState.isLoading).toBe(true);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.error).toBe(initialState.error);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
    });

    it('should handle setLoading action with false', () => {
      // Start with loading state as true
      const loadingState = {
        ...initialState,
        isLoading: true,
      };

      const action = setLoading(false);

      expect(action.type).toBe('ui/setLoading');
      expect(action.payload).toBe(false);

      const newState = uiReducer(loadingState, action);
      expect(newState.isLoading).toBe(false);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.error).toBe(initialState.error);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
    });
  });

  describe('setError', () => {
    it('should handle setError action with an error', () => {
      const error = new Error('Test error');
      const action = setError(error);

      expect(action.type).toBe('ui/setError');
      expect(action.payload).toBe(error);

      const newState = uiReducer(initialState, action);
      expect(newState.error).toBe(error);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.isLoading).toBe(initialState.isLoading);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
    });

    it('should handle setError action with null', () => {
      // Start with an error state
      const errorState = {
        ...initialState,
        error: new Error('Existing error'),
      };

      const action = setError(null);

      expect(action.type).toBe('ui/setError');
      expect(action.payload).toBe(null);

      const newState = uiReducer(errorState, action);
      expect(newState.error).toBe(null);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.isLoading).toBe(initialState.isLoading);
      expect(newState.queryPanel).toEqual(initialState.queryPanel);
    });
  });

  describe('setPromptQuery', () => {
    it('should handle setPromptQuery action', () => {
      const newPromptQuery = 'new prompt query';
      const action = setPromptQuery(newPromptQuery);

      expect(action.type).toBe('ui/setPromptQuery');
      expect(action.payload).toBe(newPromptQuery);

      const newState = uiReducer(initialState, action);
      expect(newState.queryPanel.promptQuery).toBe(newPromptQuery);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.flavor).toBe(initialState.flavor);
      expect(newState.isLoading).toBe(initialState.isLoading);
      expect(newState.error).toBe(initialState.error);
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // First action: set active tab
      state = uiReducer(state, setActiveTab('visualizations'));
      expect(state.activeTabId).toBe('visualizations');

      // Second action: set loading
      state = uiReducer(state, setLoading(true));
      expect(state.isLoading).toBe(true);

      // Third action: set error
      const error = new Error('Test error');
      state = uiReducer(state, setError(error));
      expect(state.error).toBe(error);

      // Fourth action: set flavor
      state = uiReducer(state, setFlavor('metric'));
      expect(state.flavor).toBe('metric');

      // Fifth action: set prompt query
      state = uiReducer(state, setPromptQuery('test prompt'));
      expect(state.queryPanel.promptQuery).toBe('test prompt');

      // Final state should have all changes
      expect(state).toEqual({
        activeTabId: 'visualizations',
        flavor: 'metric',
        isLoading: true,
        error,
        queryPanel: {
          promptQuery: 'test prompt',
        },
      });
    });
  });
});
