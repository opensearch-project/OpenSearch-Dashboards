/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uiReducer, setActiveTab, setUiState, setShowHistogram, UIState } from './ui_slice';

describe('UI Slice', () => {
  const initialState: UIState = {
    activeTabId: '',
    showHistogram: true,
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
      expect(newState.showHistogram).toBe(initialState.showHistogram);
    });
  });

  describe('setShowHistogram', () => {
    it('should handle setShowHistogram action', () => {
      const newValue = false;
      const action = setShowHistogram(newValue);

      expect(action.type).toBe('ui/setShowHistogram');
      expect(action.payload).toBe(newValue);

      const newState = uiReducer(initialState, action);
      expect(newState.showHistogram).toBe(newValue);

      expect(newState.activeTabId).toBe(initialState.activeTabId);
    });
  });

  describe('setUiState', () => {
    it('should handle setUiState action', () => {
      const newState: UIState = {
        activeTabId: 'visualizations',
        showHistogram: false,
      };
      const action = setUiState(newState);

      expect(action.type).toBe('ui/setUiState');
      expect(action.payload).toEqual(newState);

      const resultState = uiReducer(initialState, action);
      expect(resultState).toEqual({ ...initialState, ...newState });
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // First action: set active tab
      state = uiReducer(state, setActiveTab('visualizations'));
      expect(state.activeTabId).toBe('visualizations');

      // Second action: set histogram
      state = uiReducer(state, setShowHistogram(true));
      expect(state.showHistogram).toBe(true);

      // Final state should have all changes
      expect(state).toEqual({
        ...initialState,
        activeTabId: 'visualizations',
        showHistogram: true,
      });
    });
  });
});
